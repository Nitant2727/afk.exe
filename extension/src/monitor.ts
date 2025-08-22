import * as vscode from 'vscode';
import { Tracker } from './tracker';
import { ApiClient } from './api';
import { Config } from './config';
import { SessionData, FileSession } from './types';

/**
 * Main monitor that coordinates tracking and API communication
 */
export class Monitor {
  private tracker: Tracker;
  private apiClient: ApiClient;
  private config: Config;
  private statusBar: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];
  private pendingSessions: SessionData[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.config = Config.getInstance();
    
    const settings = this.config.getConfig();
    this.tracker = new Tracker();
    this.apiClient = new ApiClient(settings.serverUrl);

    // Create status bar
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBar.command = 'afk-coding-monitor.status';
    this.statusBar.show();

    this.setupEventHandlers();
    this.updateStatusBar();
  }

  /**
   * Initialize and start monitoring if enabled
   */
  public async initialize(): Promise<void> {
    const settings = this.config.getConfig();
    
    if (settings.enabled) {
      await this.startMonitoring();
    } else {
      console.log('[AFK] Monitoring disabled in settings');
    }
  }

  /**
   * Start monitoring
   */
  public async startMonitoring(): Promise<void> {
    const settings = this.config.getConfig();

    // Test server connection
    const connectionTest = await this.apiClient.testConnection();
    if (!connectionTest.success) {
      vscode.window.showErrorMessage(`AFK Monitor: Server connection failed - ${connectionTest.message}`);
      console.warn(`[AFK] Server connection failed: ${connectionTest.message}`);
      return; // Don't start monitoring if server is unreachable
    }

    this.tracker.startMonitoring();
    this.updateStatusBar();
    
    vscode.window.showInformationMessage('AFK Monitor: Started tracking - your sessions will be saved to the server!');
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    this.tracker.stopMonitoring();
    this.updateStatusBar();
    
    vscode.window.showInformationMessage('AFK Monitor: Stopped tracking file sessions');
  }

  /**
   * Show status
   */
  public async showStatus(): Promise<void> {
    const currentSession = this.tracker.getCurrentSession();
    const settings = this.config.getConfig();
    
    let statusMessage = '**AFK Monitor Status**\n\n';
    statusMessage += `• Monitoring: ${currentSession ? '🟢 Active' : '🔴 Inactive'}\n`;
    statusMessage += `• Server: ${settings.serverUrl}\n`;
    statusMessage += `• Pending Sessions: ${this.pendingSessions.length}\n\n`;
    
    if (currentSession) {
      const sessionTime = Math.floor((Date.now() - currentSession.sessionStartTime.getTime()) / 1000);
      statusMessage += `**Current Session:**\n`;
      statusMessage += `• File: ${currentSession.fileName}\n`;
      statusMessage += `• Language: ${currentSession.language}\n`;
      statusMessage += `• Project: ${currentSession.projectName}\n`;
      statusMessage += `• Session Time: ${this.formatDuration(sessionTime)}\n`;
      statusMessage += `• Total Edits: ${currentSession.totalEdits}\n`;
      statusMessage += `• Lines: +${currentSession.linesAdded} -${currentSession.linesDeleted} ~${currentSession.linesModified}\n`;
      statusMessage += `• Characters: +${currentSession.charactersAdded} -${currentSession.charactersDeleted} ~${currentSession.charactersModified}\n`;
    }

    // Test server connection
    statusMessage += `\n**Server Status:**\n`;
    
    const connectionTest = await this.apiClient.testConnection();
    statusMessage += `• Connection: ${connectionTest.success ? '🟢 Connected' : '🔴 Disconnected'}\n`;
    statusMessage += `• Message: ${connectionTest.message}`;

    vscode.window.showInformationMessage(statusMessage, { modal: true });
  }

  /**
   * Show configuration
   */
  public async showConfig(): Promise<void> {
    await this.config.showConfigMenu();
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.tracker.dispose();
    this.statusBar.dispose();
    this.disposables.forEach(d => d.dispose());
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Handle completed sessions
    this.disposables.push(
      this.tracker.onSessionCompleted(sessionData => {
        this.handleSessionCompleted(sessionData);
      })
    );

    // Handle config changes
    this.disposables.push(
      this.config.onConfigChanged(settings => {
        this.apiClient.updateUrl(settings.serverUrl);
        
        if (settings.enabled && !this.tracker.getCurrentSession()) {
          this.startMonitoring();
        } else if (!settings.enabled && this.tracker.getCurrentSession()) {
          this.stopMonitoring();
        }
      })
    );
  }

  /**
   * Handle completed session
   */
  private async handleSessionCompleted(sessionData: SessionData): Promise<void> {
    this.pendingSessions.push(sessionData);
    this.updateStatusBar();

    // Try to send immediately
    const result = await this.apiClient.sendSession(sessionData);
    
    if (result.success) {
      // Remove from pending if sent successfully
      const index = this.pendingSessions.indexOf(sessionData);
      if (index > -1) {
        this.pendingSessions.splice(index, 1);
      }
    } else {
      console.error(`[AFK] Failed to send session: ${result.error}`);
      // Keep in pending list for retry (could implement retry logic later)
    }
    
    this.updateStatusBar();
  }

  /**
   * Update status bar
   */
  private updateStatusBar(): void {
    const currentSession = this.tracker.getCurrentSession();
    const settings = this.config.getConfig();
    
    if (!settings.enabled) {
      this.statusBar.text = '$(eye-closed) AFK: Disabled';
      this.statusBar.tooltip = 'AFK Monitor is disabled';
      return;
    }

    if (currentSession) {
      const sessionTime = Math.floor((Date.now() - currentSession.sessionStartTime.getTime()) / 1000);
      this.statusBar.text = `$(eye) AFK: ${currentSession.fileName}`;
      this.statusBar.tooltip = `Tracking: ${currentSession.fileName}
Session Time: ${this.formatDuration(sessionTime)}
Edits: ${currentSession.totalEdits}
Lines: +${currentSession.linesAdded}/-${currentSession.linesDeleted}/~${currentSession.linesModified}
Characters: +${currentSession.charactersAdded}/-${currentSession.charactersDeleted}/~${currentSession.charactersModified}
Pending: ${this.pendingSessions.length} sessions`;
    } else {
      this.statusBar.text = '$(eye) AFK: Ready';
      this.statusBar.tooltip = `AFK Monitor is ready
Pending: ${this.pendingSessions.length} sessions
Click to view status`;
    }
  }

  /**
   * Format duration in human readable format
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
} 