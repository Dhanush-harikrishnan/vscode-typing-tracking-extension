import * as vscode from 'vscode';
import { FileSession, ActivityLog, ChangeEvent } from './types';
import { ConfigManager } from './config';
import { ApiClient } from './api-client';
import {
  getCurrentDate,
  getCurrentTime,
  getEditorVersion,
  countLines,
  extractSnippet,
  debounce,
  shouldTrackFile,
} from './utils';

/**
 * Event handler for tracking typing and paste activities
 */
export class EventHandler {
  private sessions: Map<string, FileSession> = new Map();
  private configManager: ConfigManager;
  private apiClient: ApiClient;
  private clipboardText: string = '';
  private debouncedSave: () => void;

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.apiClient = ApiClient.getInstance();
    this.debouncedSave = debounce(() => {
      void this.saveAllPendingSessions();
    }, this.configManager.getConfig().debounceInterval);
  }

  /**
   * Handle text document change events
   */
  public async handleTextChange(event: vscode.TextDocumentChangeEvent): Promise<void> {
    // Check if tracking is enabled
    if (!this.configManager.isEnabled()) {
      return;
    }

    const document = event.document;
    const filePath = document.uri.fsPath;

    // Skip if file shouldn't be tracked
    if (!shouldTrackFile(filePath)) {
      return;
    }

    // Skip if no content changes
    if (event.contentChanges.length === 0) {
      return;
    }

    // Get or create session for this file
    const session = this.getOrCreateSession(document);

    // Process each content change
    for (const change of event.contentChanges) {
      const changeEvent = await this.analyzeChange(change);
      this.updateSession(session, changeEvent);
    }

    // Mark session as having pending changes
    session.pendingChanges = true;
    session.lastActivity = new Date();

    // Debounced save
    this.debouncedSave();
  }

  /**
   * Analyze a text change to determine if it's typed or pasted
   */
  private async analyzeChange(
    change: vscode.TextDocumentContentChangeEvent
  ): Promise<ChangeEvent> {
    const text = change.text;
    const rangeLength = change.rangeLength;
    const lineCount = countLines(text);

    // Update clipboard text periodically
    try {
      this.clipboardText = await vscode.env.clipboard.readText();
    } catch (error) {
      // Clipboard access might fail in some contexts
      console.error('Failed to read clipboard:', error);
    }

    // Heuristic for paste detection:
    // 1. Large text insertion (> 50 chars or > 2 lines)
    // 2. Matches clipboard content
    // 3. Zero range length (pure insertion, not replacement)
    const isPaste =
      (text.length > 50 || lineCount > 2) &&
      rangeLength === 0 &&
      this.clipboardText.includes(text.trim());

    return {
      text,
      rangeLength,
      isPaste,
      lineCount,
    };
  }

  /**
   * Update session with change event
   */
  private updateSession(session: FileSession, changeEvent: ChangeEvent): void {
    if (changeEvent.isPaste) {
      session.pastedLines += changeEvent.lineCount;
    } else {
      session.typedLines += changeEvent.lineCount;
    }
  }

  /**
   * Get or create a file session
   */
  private getOrCreateSession(document: vscode.TextDocument): FileSession {
    const filePath = document.uri.fsPath;

    if (!this.sessions.has(filePath)) {
      const session: FileSession = {
        fileName: document.fileName.split(/[\\/]/).pop() || 'unknown',
        filePath,
        typedLines: 0,
        pastedLines: 0,
        sessionStart: new Date(),
        lastActivity: new Date(),
        pendingChanges: false,
      };
      this.sessions.set(filePath, session);
    }

    return this.sessions.get(filePath)!;
  }

  /**
   * Handle document save event
   */
  public async handleDocumentSave(document: vscode.TextDocument): Promise<void> {
    const filePath = document.uri.fsPath;
    const session = this.sessions.get(filePath);

    if (session && session.pendingChanges) {
      await this.saveSession(session);
    }
  }

  /**
   * Handle document close event
   */
  public async handleDocumentClose(document: vscode.TextDocument): Promise<void> {
    const filePath = document.uri.fsPath;
    const session = this.sessions.get(filePath);

    if (session) {
      if (session.pendingChanges) {
        await this.saveSession(session);
      }
      this.sessions.delete(filePath);
    }
  }

  /**
   * Save a session to the backend
   */
  private async saveSession(session: FileSession): Promise<void> {
    // Don't save if no actual changes
    if (session.typedLines === 0 && session.pastedLines === 0) {
      return;
    }

    // Create activity logs for typed and pasted lines
    const logs: ActivityLog[] = [];

    if (session.typedLines > 0) {
      logs.push(this.createActivityLog(session, 'typing', session.typedLines, 0));
    }

    if (session.pastedLines > 0) {
      logs.push(this.createActivityLog(session, 'paste', 0, session.pastedLines));
    }

    // Send to backend
    if (logs.length > 0) {
      const success = await this.apiClient.sendBatchActivityLogs(logs);
      if (success) {
        // Reset counters after successful save
        session.typedLines = 0;
        session.pastedLines = 0;
        session.pendingChanges = false;
      }
    }
  }

  /**
   * Save all pending sessions
   */
  private async saveAllPendingSessions(): Promise<void> {
    const pendingSessions = Array.from(this.sessions.values()).filter(
      (session) => session.pendingChanges
    );

    for (const session of pendingSessions) {
      await this.saveSession(session);
    }
  }

  /**
   * Create an activity log object
   */
  private createActivityLog(
    session: FileSession,
    actionType: 'typing' | 'paste',
    typedLines: number,
    pastedLines: number
  ): ActivityLog {
    const config = this.configManager.getConfig();
    const now = new Date();

    return {
      username: this.configManager.getUsername(),
      fileName: session.fileName,
      filePath: session.filePath,
      date: getCurrentDate(),
      time: getCurrentTime(),
      timestamp: now,
      actionType,
      typedLines,
      pastedLines,
      totalLines: typedLines + pastedLines,
      contentSnippet: config.trackContentSnippets ? extractSnippet('', 100) : undefined,
      editorVersion: getEditorVersion(),
    };
  }

  /**
   * Dispose resources
   */
  public async dispose(): Promise<void> {
    // Save all pending sessions before disposing
    await this.saveAllPendingSessions();
    this.sessions.clear();
  }
}
