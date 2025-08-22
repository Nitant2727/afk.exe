import * as vscode from 'vscode';
import * as path from 'path';
import { FileSession, SessionData } from './types';

/**
 * Tracker that monitors file sessions and edit statistics
 */
export class Tracker {
  private currentSession: FileSession | null = null;
  private disposables: vscode.Disposable[] = [];
  private isMonitoring = false;
  private lastDocumentContent: string = '';

  private onSessionComplete = new vscode.EventEmitter<SessionData>();
  public readonly onSessionCompleted = this.onSessionComplete.event;

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Start monitoring
   */
  public startMonitoring(): void {
    this.isMonitoring = true;
    console.log('[AFK] Started monitoring file sessions');

    // Handle current active editor
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.uri.scheme === 'file') {
      this.startSession(activeEditor.document);
    }
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;
    this.endCurrentSession();
    console.log('[AFK] Stopped monitoring file sessions');
  }

  /**
   * Get current session info
   */
  public getCurrentSession(): FileSession | null {
    return this.currentSession;
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.stopMonitoring();
    this.disposables.forEach(d => d.dispose());
    this.onSessionComplete.dispose();
  }

  /**
   * Setup VSCode event listeners
   */
  private setupEventListeners(): void {
    // File focus changes
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (!this.isMonitoring) return;

        this.endCurrentSession();
        
        if (editor && editor.document.uri.scheme === 'file') {
          this.startSession(editor.document);
        }
      })
    );

    // File content changes - track edits
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(event => {
        if (!this.isMonitoring || !this.currentSession) return;
        
        if (event.document.uri.toString() === this.currentSession.filePath) {
          this.handleFileEdit(event);
        }
      })
    );

    // Window focus changes
    this.disposables.push(
      vscode.window.onDidChangeWindowState(state => {
        if (!this.isMonitoring) return;
        
        if (!state.focused) {
          // VSCode lost focus - end current session
          this.endCurrentSession();
        } else {
          // VSCode gained focus - start session if there's an active editor
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor && activeEditor.document.uri.scheme === 'file' && !this.currentSession) {
            this.startSession(activeEditor.document);
          }
        }
      })
    );

    // File saves
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument(document => {
        if (!this.isMonitoring || !this.currentSession) return;
        
        if (document.uri.toString() === this.currentSession.filePath) {
          console.log(`[AFK] File saved: ${this.currentSession.fileName}`);
        }
      })
    );
  }

  /**
   * Start a new session for a file
   */
  private startSession(document: vscode.TextDocument): void {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    const projectPath = workspaceFolder?.uri.fsPath || '';
    const projectName = workspaceFolder ? path.basename(projectPath) : 'Unknown';
    
    this.currentSession = {
      id: this.generateId(),
      filePath: document.uri.toString(),
      fileName: path.basename(document.uri.fsPath),
      fileExtension: path.extname(document.uri.fsPath).slice(1),
      language: document.languageId,
      projectName,
      projectPath,
      sessionStartTime: new Date(),
      totalDuration: 0,
      linesAdded: 0,
      linesDeleted: 0,
      linesModified: 0,
      charactersAdded: 0,
      charactersDeleted: 0,
      charactersModified: 0,
      totalEdits: 0,
      isActive: true
    };

    // Store initial document content for comparison
    this.lastDocumentContent = document.getText();

    console.log(`[AFK] Started session: ${this.currentSession.fileName}`);
  }

  /**
   * End current session and send to server
   */
  private endCurrentSession(): void {
    if (!this.currentSession) return;

    // Calculate final duration
    const now = new Date();
    this.currentSession.sessionEndTime = now;
    this.currentSession.totalDuration = Math.floor(
      (now.getTime() - this.currentSession.sessionStartTime.getTime()) / 1000
    );
    this.currentSession.isActive = false;

    // Only send sessions that lasted more than 5 seconds
    if (this.currentSession.totalDuration >= 5) {
      const sessionData: SessionData = {
        session: this.currentSession,
        systemInfo: {
          editor: this.detectEditor(),
          platform: process.platform
        }
      };

      console.log(`[AFK] Session completed: ${this.currentSession.fileName} - Duration: ${this.currentSession.totalDuration}s, Edits: ${this.currentSession.totalEdits}, Lines: +${this.currentSession.linesAdded}/-${this.currentSession.linesDeleted}/~${this.currentSession.linesModified}, Chars: +${this.currentSession.charactersAdded}/-${this.currentSession.charactersDeleted}/~${this.currentSession.charactersModified}`);
      
      // Emit session for sending to server
      this.onSessionComplete.fire(sessionData);
    }

    this.currentSession = null;
    this.lastDocumentContent = '';
  }

  /**
   * Handle file edits and calculate statistics
   */
  private handleFileEdit(event: vscode.TextDocumentChangeEvent): void {
    if (!this.currentSession) return;

    this.currentSession.totalEdits++;

    // Process each content change
    for (const change of event.contentChanges) {
      const deletedText = this.lastDocumentContent.substring(
        change.rangeOffset,
        change.rangeOffset + change.rangeLength
      );
      const insertedText = change.text;

      // Calculate line changes
      const deletedLines = deletedText.split('\n').length - 1;
      const insertedLines = insertedText.split('\n').length - 1;

      // Calculate character changes
      const deletedChars = deletedText.length;
      const insertedChars = insertedText.length;

      // Determine if it's an addition, deletion, or modification
      if (deletedChars === 0 && insertedChars > 0) {
        // Pure addition
        this.currentSession.linesAdded += insertedLines;
        this.currentSession.charactersAdded += insertedChars;
      } else if (insertedChars === 0 && deletedChars > 0) {
        // Pure deletion
        this.currentSession.linesDeleted += deletedLines;
        this.currentSession.charactersDeleted += deletedChars;
      } else if (deletedChars > 0 && insertedChars > 0) {
        // Modification (replacement)
        this.currentSession.linesModified += Math.max(deletedLines, insertedLines);
        this.currentSession.charactersModified += Math.max(deletedChars, insertedChars);
      }
    }

    // Update the stored content for next comparison
    this.lastDocumentContent = event.document.getText();
  }

  /**
   * Detect if running in VSCode or Cursor
   */
  private detectEditor(): 'vscode' | 'cursor' {
    return vscode.env.appName.toLowerCase().includes('cursor') ? 'cursor' : 'vscode';
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
} 