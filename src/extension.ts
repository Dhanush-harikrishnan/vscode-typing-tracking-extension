import * as vscode from 'vscode';
import { EventHandler } from './event-handler';
import { ConfigManager } from './config';
import { ApiClient } from './api-client';
import { showInfo, showWarning, showError, getCurrentDate } from './utils';

let eventHandler: EventHandler;
let changeListener: vscode.Disposable;
let saveListener: vscode.Disposable;
let closeListener: vscode.Disposable;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('VS Code Typing Activity Logger is now active!');

  const configManager = ConfigManager.getInstance();
  const apiClient = ApiClient.getInstance();

  // Get username and log it
  const username = configManager.getUsername();
  console.log(`Tracking activity for user: ${username || 'anonymous'}`);

  // Validate configuration
  const validation = configManager.validateConfig();
  if (!validation.valid) {
    showWarning('Configuration incomplete: ' + validation.errors.join(', '));
  }

  // Check backend connectivity
  void checkBackendConnection(apiClient);

  // Initialize event handler
  eventHandler = new EventHandler();

  // Register text document change listener
  changeListener = vscode.workspace.onDidChangeTextDocument((event) => {
    void eventHandler.handleTextChange(event);
  });

  // Register document save listener
  saveListener = vscode.workspace.onDidSaveTextDocument((document) => {
    void eventHandler.handleDocumentSave(document);
  });

  // Register document close listener
  closeListener = vscode.workspace.onDidCloseTextDocument((document) => {
    void eventHandler.handleDocumentClose(document);
  });

  // Register configuration change listener
  const configChangeListener = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('typingTracker')) {
      configManager.refresh();
      apiClient.refreshClient();
      showInfo('Configuration updated');
    }
  });

  // Register commands
  const showStatsCommand = vscode.commands.registerCommand(
    'typingTracker.showStats',
    async () => {
      await showTodayStats(configManager, apiClient);
    }
  );

  const toggleTrackingCommand = vscode.commands.registerCommand(
    'typingTracker.toggleTracking',
    async () => {
      const newState = await configManager.toggleEnabled();
      showInfo(`Tracking ${newState ? 'enabled' : 'disabled'}`);
    }
  );

  // Add to subscriptions for cleanup
  context.subscriptions.push(
    changeListener,
    saveListener,
    closeListener,
    configChangeListener,
    showStatsCommand,
    toggleTrackingCommand
  );
}

/**
 * Extension deactivation
 */
export async function deactivate(): Promise<void> {
  console.log('VS Code Typing Activity Logger is deactivating...');

  // Dispose event handler and save pending sessions
  if (eventHandler) {
    await eventHandler.dispose();
  }

  // Dispose listeners
  if (changeListener) {
    changeListener.dispose();
  }
  if (saveListener) {
    saveListener.dispose();
  }
  if (closeListener) {
    closeListener.dispose();
  }

  console.log('VS Code Typing Activity Logger deactivated');
}

/**
 * Check backend server connection
 */
async function checkBackendConnection(apiClient: ApiClient): Promise<void> {
  const isHealthy = await apiClient.healthCheck();
  if (!isHealthy) {
    showWarning(
      'Cannot connect to backend server. Data will not be saved. Please start the server.'
    );
  }
}

/**
 * Show today's statistics
 */
async function showTodayStats(
  configManager: ConfigManager,
  apiClient: ApiClient
): Promise<void> {
  const username = configManager.getUsername();
  if (!username) {
    showError('Username not configured');
    return;
  }

  const date = getCurrentDate();
  const summary = await apiClient.getUserSummary(username, date);

  if (summary) {
    const message = `📊 Today's Stats (${date})
    
✍️ Typed Lines: ${summary.totalTypedLines || 0}
📋 Pasted Lines: ${summary.totalPastedLines || 0}
📈 Ratio: ${summary.typingToPastingRatio?.toFixed(2) || 'N/A'}
📁 Files Edited: ${summary.totalFilesEdited || 0}`;

    void vscode.window.showInformationMessage(message, { modal: false });
  } else {
    showInfo('No activity recorded for today');
  }
}
