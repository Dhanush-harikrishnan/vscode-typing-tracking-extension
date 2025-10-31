import axios, { AxiosInstance, AxiosError } from 'axios';
import { ActivityLog } from './types';
import { ConfigManager } from './config';
import { showError } from './utils';

/**
 * API client for communicating with the backend server
 */
export class ApiClient {
  private static instance: ApiClient;
  private client: AxiosInstance;
  private configManager: ConfigManager;

  private constructor() {
    this.configManager = ConfigManager.getInstance();
    this.client = this.createClient();
  }

  /**
   * Get singleton instance of ApiClient
   */
  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Create axios client with configuration
   */
  private createClient(): AxiosInstance {
    const config = this.configManager.getConfig();
    return axios.create({
      baseURL: config.apiEndpoint,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Refresh client configuration
   */
  public refreshClient(): void {
    this.client = this.createClient();
  }

  /**
   * Send activity log to backend
   */
  public async sendActivityLog(log: ActivityLog): Promise<boolean> {
    try {
      await this.client.post('/activity', log);
      return true;
    } catch (error) {
      this.handleError(error as AxiosError, 'Failed to send activity log');
      return false;
    }
  }

  /**
   * Send batch activity logs to backend
   */
  public async sendBatchActivityLogs(logs: ActivityLog[]): Promise<boolean> {
    try {
      await this.client.post('/activity/batch', { logs });
      return true;
    } catch (error) {
      this.handleError(error as AxiosError, 'Failed to send batch activity logs');
      return false;
    }
  }

  /**
   * Get user activity summary for a specific date
   */
  public async getUserSummary(username: string, date: string): Promise<any> {
    try {
      const response = await this.client.get(`/summary/${username}/${date}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError, 'Failed to fetch user summary');
      return null;
    }
  }

  /**
   * Health check for backend server
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError, context: string): void {
    if (error.response) {
      // Server responded with error status
      console.error(`${context}: ${error.response.status}`, error.response.data);
      showError(`${context}: Server error ${error.response.status}`);
    } else if (error.request) {
      // Request made but no response
      console.error(`${context}: No response from server`, error.message);
      showError(`${context}: Cannot reach server. Is it running?`);
    } else {
      // Error in request setup
      console.error(`${context}:`, error.message);
      showError(`${context}: ${error.message}`);
    }
  }
}
