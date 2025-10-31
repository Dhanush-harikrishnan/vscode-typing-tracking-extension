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
  private lastClipboardCheck: number = 0;
  private debouncedSave: () => void;

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.apiClient = ApiClient.getInstance();
    this.debouncedSave = debounce(() => {
      void this.saveAllPendingSessions();
    }, this.configManager.getConfig().debounceInterval);
    
    // Initialize clipboard monitoring
    this.updateClipboard();
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
    
    // Determine if this is a deletion
    const isDelete = rangeLength > 0 && text.length === 0;
    
    // Count lines based on operation type
    let lineCount = 0;
    if (isDelete) {
      // For deletions, count how many lines were removed
      // This is approximate - we count the range length
      lineCount = Math.max(1, Math.floor(rangeLength / 50)); // Rough estimate
    } else {
      // For insertions, count new lines added
      lineCount = countLines(text);
    }

    // Update clipboard text (but not too frequently - cache for 500ms)
    const now = Date.now();
    if (now - this.lastClipboardCheck > 500) {
      await this.updateClipboard();
      this.lastClipboardCheck = now;
    }

    // Improved paste detection heuristics:
    // 1. Multi-line paste: > 1 newline AND matches clipboard
    // 2. Large single-line paste: > 100 chars AND matches clipboard
    // 3. Must be pure insertion (rangeLength === 0)
    // 4. Clipboard must contain the exact text or text must be subset of clipboard
    
    const hasMultipleLines = (text.match(/\r?\n/g) || []).length > 1;
    const isLargeInsertion = text.length > 100;
    const isPureInsertion = rangeLength === 0;
    
    // Check if text matches clipboard (exact or subset)
    const clipboardMatch = this.clipboardText.length > 0 && (
      this.clipboardText === text ||
      this.clipboardText.includes(text) ||
      text.includes(this.clipboardText.trim())
    );
    
    // Determine if this is a paste
    const isPaste = !isDelete && isPureInsertion && clipboardMatch && (hasMultipleLines || isLargeInsertion);

    return {
      text,
      rangeLength,
      isPaste,
      isDelete,
      lineCount,
    };
  }

  /**
   * Update clipboard text from system clipboard
   */
  private async updateClipboard(): Promise<void> {
    try {
      this.clipboardText = await vscode.env.clipboard.readText();
    } catch (error) {
      // Clipboard access might fail in some contexts
      console.error('Failed to read clipboard:', error);
    }
  }

  /**
   * Update session with change event
   */
  private updateSession(session: FileSession, changeEvent: ChangeEvent): void {
    if (changeEvent.isDelete) {
      session.deletedLines += changeEvent.lineCount;
    } else if (changeEvent.isPaste) {
      session.pastedLines += changeEvent.lineCount;
    } else {
      session.typedLines += changeEvent.lineCount;
    }
    
    // Track content snippets (limit to last 5 snippets)
    if (changeEvent.text.trim().length > 0) {
      const snippet = extractSnippet(changeEvent.text, 100);
      session.contentSnippets.push(snippet);
      if (session.contentSnippets.length > 5) {
        session.contentSnippets.shift(); // Remove oldest
      }
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
        deletedLines: 0,
        contentSnippets: [],
        initialLineCount: document.lineCount, // Track starting line count
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
      // Calculate actual line change for accurate reporting
      const currentLineCount = document.lineCount;
      const actualLineChange = currentLineCount - session.initialLineCount;
      
      // If we have actual line increases, use that as a reality check
      if (actualLineChange > 0) {
        // Distribute the actual line change between typed and pasted based on ratio
        const total = session.typedLines + session.pastedLines;
        if (total > 0) {
          const typedRatio = session.typedLines / total;
          const pastedRatio = session.pastedLines / total;
          session.typedLines = Math.round(actualLineChange * typedRatio);
          session.pastedLines = Math.round(actualLineChange * pastedRatio);
        } else {
          // If we somehow missed tracking, count as typed
          session.typedLines = actualLineChange;
          session.pastedLines = 0;
        }
      }
      
      await this.saveSession(session);
      
      // Reset initial line count for next session
      session.initialLineCount = currentLineCount;
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
        // Calculate actual line change before closing
        const currentLineCount = document.lineCount;
        const actualLineChange = currentLineCount - session.initialLineCount;
        
        if (actualLineChange > 0) {
          const total = session.typedLines + session.pastedLines;
          if (total > 0) {
            const typedRatio = session.typedLines / total;
            const pastedRatio = session.pastedLines / total;
            session.typedLines = Math.round(actualLineChange * typedRatio);
            session.pastedLines = Math.round(actualLineChange * pastedRatio);
          } else {
            session.typedLines = actualLineChange;
            session.pastedLines = 0;
          }
        }
        
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

    // Create a single activity log with both typed and pasted lines
    // The actionType represents the predominant activity
    const predominantAction = session.typedLines >= session.pastedLines ? 'typing' : 'paste';
    
    const log = this.createActivityLog(
      session,
      predominantAction,
      session.typedLines,
      session.pastedLines
    );

    // Send to backend
    const success = await this.apiClient.sendActivityLog(log);
    if (success) {
      // Reset counters after successful save
      session.typedLines = 0;
      session.pastedLines = 0;
      session.deletedLines = 0;
      session.contentSnippets = [];
      session.pendingChanges = false;
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
    actionType: 'typing' | 'paste' | 'delete' | 'cut',
    typedLines: number,
    pastedLines: number
  ): ActivityLog {
    const config = this.configManager.getConfig();
    const now = new Date();

    // Get the most relevant content snippet
    const contentSnippet = config.trackContentSnippets && session.contentSnippets.length > 0
      ? session.contentSnippets[session.contentSnippets.length - 1]
      : undefined;

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
      contentSnippet,
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
