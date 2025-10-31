import * as vscode from 'vscode';

/**
 * Utility functions for the typing tracker extension
 */

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get current time in HH:MM:SS format
 */
export function getCurrentTime(): string {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
}

/**
 * Get VS Code editor version
 */
export function getEditorVersion(): string {
  return vscode.version;
}

/**
 * Count lines in a text string
 */
export function countLines(text: string): number {
  if (!text) {
    return 0;
  }
  // Count newlines + 1 for the content itself
  const lines = text.split(/\r?\n/).length;
  return lines;
}

/**
 * Extract a snippet from text (first N characters)
 */
export function extractSnippet(text: string, maxLength: number = 100): string {
  if (!text) {
    return '';
  }
  const snippet = text.replace(/\s+/g, ' ').trim();
  return snippet.length > maxLength ? snippet.substring(0, maxLength) + '...' : snippet;
}

/**
 * Debounce function for rate limiting
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Check if a file should be tracked (exclude certain file types)
 */
export function shouldTrackFile(filePath: string): boolean {
  // Exclude git, node_modules, and other system files
  const excludePatterns = [
    /node_modules/,
    /\.git\//,
    /\.vscode/,
    /\.next/,
    /dist\//,
    /build\//,
    /out\//,
    /\.log$/,
    /\.lock$/,
  ];

  return !excludePatterns.some((pattern) => pattern.test(filePath));
}

/**
 * Show error message to user
 */
export function showError(message: string): void {
  void vscode.window.showErrorMessage(`Typing Tracker: ${message}`);
}

/**
 * Show info message to user
 */
export function showInfo(message: string): void {
  void vscode.window.showInformationMessage(`Typing Tracker: ${message}`);
}

/**
 * Show warning message to user
 */
export function showWarning(message: string): void {
  void vscode.window.showWarningMessage(`Typing Tracker: ${message}`);
}

/**
 * Calculate typing to pasting ratio
 */
export function calculateRatio(typed: number, pasted: number): number {
  if (pasted === 0) {
    return typed > 0 ? Infinity : 0;
  }
  return Number((typed / pasted).toFixed(2));
}
