/**
 * File session tracking with edit statistics
 */

export interface FileSession {
  id: string;
  filePath: string;
  fileName: string;
  fileExtension: string;
  language: string;
  projectName: string;
  projectPath: string;
  sessionStartTime: Date;
  sessionEndTime?: Date;
  totalDuration: number; // Total session duration in seconds
  linesAdded: number;
  linesDeleted: number;
  linesModified: number;
  charactersAdded: number;
  charactersDeleted: number;
  charactersModified: number;
  totalEdits: number; // Total number of edit operations
  isActive: boolean;
}

export interface SessionData {
  session: FileSession;
  systemInfo: {
    editor: 'vscode' | 'cursor';
    platform: string;
  };
}

export interface ExtensionConfig {
  enabled: boolean;
  serverUrl: string;
  syncInterval: number; // seconds
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
} 