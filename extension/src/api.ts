import { SessionData, ApiResponse } from './types';

/**
 * API client for sending session data
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Update server URL
   */
  public updateUrl(baseUrl: string): void {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Send session data to server
   */
  public async sendSession(sessionData: SessionData): Promise<ApiResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(`${this.baseUrl}/api/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(sessionData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`[AFK] Session sent successfully: ${sessionData.session.fileName}`);
      
      return {
        success: true,
        data: result
      };

    } catch (error: any) {
      console.error(`[AFK] Failed to send session: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test server connection
   */
  public async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Server returned ${response.status}: ${response.statusText}`
        };
      }

      return {
        success: true,
        message: 'Connected successfully'
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }
} 