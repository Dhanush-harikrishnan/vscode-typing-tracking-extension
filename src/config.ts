import * as vscode from 'vscode';
import { TrackerConfig } from './types';

/**
 * Configuration manager for the typing tracker extension
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: vscode.WorkspaceConfiguration;

  private constructor() {
    this.config = vscode.workspace.getConfiguration('typingTracker');
  }

  /**
   * Get singleton instance of ConfigManager
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Refresh configuration from workspace settings
   */
  public refresh(): void {
    this.config = vscode.workspace.getConfiguration('typingTracker');
  }

  /**
   * Get all tracker configuration
   */
  public getConfig(): TrackerConfig {
    return {
      username: this.config.get<string>('username', ''),
      apiEndpoint: this.config.get<string>('apiEndpoint', 'http://localhost:3000/api'),
      enabled: this.config.get<boolean>('enabled', true),
      trackContentSnippets: this.config.get<boolean>('trackContentSnippets', false),
      debounceInterval: this.config.get<number>('debounceInterval', 2000),
    };
  }

  /**
   * Get username from configuration
   */
  public getUsername(): string {
    // Try VS Code config first
    const configUsername = this.config.get<string>('username', '');
    if (configUsername && configUsername.trim() !== '') {
      return configUsername;
    }

    // Try to get from Git config
    try {
      // Use Node.js child_process to run git config
      // This works in Node.js context (VS Code extension host)
      // @ts-ignore
      const cp = require('child_process');
      const gitUsername = cp.execSync('git config --get user.name', { encoding: 'utf8' }).trim();
      if (gitUsername) {
        return gitUsername;
      }
    } catch (err) {
      // Ignore errors, fallback below
    }

    // Fallback to environment variables
    const envUser = process.env.USER || process.env.USERNAME;
    if (envUser && envUser.trim() !== '') {
      return envUser;
    }

    // If all else fails, return empty string
    return '';
  }

  /**
   * Get API endpoint from configuration
   */
  public getApiEndpoint(): string {
    return this.config.get<string>('apiEndpoint', 'http://localhost:3000/api');
  }

  /**
   * Check if tracking is enabled
   */
  public isEnabled(): boolean {
    return this.config.get<boolean>('enabled', true);
  }

  /**
   * Toggle tracking enabled state
   */
  public async toggleEnabled(): Promise<boolean> {
    const currentState = this.isEnabled();
    await this.config.update('enabled', !currentState, vscode.ConfigurationTarget.Global);
    this.refresh();
    return !currentState;
  }

  /**
   * Validate configuration
   */
  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this.getConfig();

    if (!config.username || config.username.trim() === '') {
      errors.push('Username is not configured. Please set typingTracker.username in settings.');
    }

    if (!config.apiEndpoint || config.apiEndpoint.trim() === '') {
      errors.push('API endpoint is not configured.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
