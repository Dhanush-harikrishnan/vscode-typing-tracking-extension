/**
 * Type definitions for activity tracking
 */

/**
 * Represents a single activity log entry
 */
export interface ActivityLog {
  username: string;
  fileName: string;
  filePath: string;
  date: string;
  time: string;
  timestamp: Date;
  actionType: 'typing' | 'paste';
  typedLines: number;
  pastedLines: number;
  totalLines: number;
  contentSnippet?: string;
  editorVersion: string;
}

/**
 * Represents aggregated user activity summary
 */
export interface UserActivitySummary {
  username: string;
  date: string;
  totalTypedLines: number;
  totalPastedLines: number;
  typingToPastingRatio: number;
  totalFilesEdited: number;
}

/**
 * Configuration interface for the extension
 */
export interface TrackerConfig {
  username: string;
  apiEndpoint: string;
  enabled: boolean;
  trackContentSnippets: boolean;
  debounceInterval: number;
}

/**
 * Represents a file session being tracked
 */
export interface FileSession {
  fileName: string;
  filePath: string;
  typedLines: number;
  pastedLines: number;
  sessionStart: Date;
  lastActivity: Date;
  pendingChanges: boolean;
}

/**
 * Text change event details
 */
export interface ChangeEvent {
  text: string;
  rangeLength: number;
  isPaste: boolean;
  lineCount: number;
}
