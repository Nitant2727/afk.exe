export interface FileSession {
  id: string;
  filePath: string;
  fileName: string;
  fileExtension: string;
  language: string;
  projectName: string;
  projectPath: string;
  sessionStartTime: string;
  sessionEndTime: string | null;
  totalDuration: number;
  linesAdded: number;
  linesDeleted: number;
  linesModified: number;
  charactersAdded: number;
  charactersDeleted: number;
  charactersModified: number;
  totalEdits: number;
  isActive: boolean;
}

export interface SystemInfo {
  editor: 'vscode' | 'cursor';
  platform: string;
}

export interface SessionRequest {
  session: FileSession;
  systemInfo: SystemInfo;
}

export interface AuthCodeRequest {
  deviceId: string;
  deviceName: string;
  editor: 'vscode' | 'cursor';
}

export interface VerifyCodeRequest {
  codeId: string;
  code: string;
  deviceId: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RevokeRequest {
  deviceId: string;
}

export interface GitHubUserData {
  github_id: string;
  username: string;
  email?: string;
  avatar_url?: string;
}

export interface CodingSessionData {
  id: string;
  file_path: string;
  file_name: string;
  file_extension?: string;
  language?: string;
  project_name?: string;
  project_path?: string;
  focus_start_time: string;
  focus_end_time?: string;
  focus_duration: number;
  coding_duration: number;
  editor?: 'vscode' | 'cursor';
  platform?: string;
  is_active: boolean;
}

export type TimeFilter = 
  | 'today' 
  | 'yesterday' 
  | 'this_week' 
  | 'last_week' 
  | 'this_month' 
  | 'last_month' 
  | 'last_7_days' 
  | 'last_30_days' 
  | 'custom';

export interface SuccessResponse<T = any> {
  success: true;
  data?: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

export interface SessionsQueryParams {
  limit?: number;
  offset?: number;
  projectName?: string;
  language?: string;
  from?: string;
  to?: string;
  sync_from_extension?: boolean;
}

export interface LegacySessionsQueryParams {
  limit?: number;
  offset?: number;
  project_name?: string;
  language?: string;
  time_filter?: TimeFilter;
  start_date?: string;
  end_date?: string;
}

export interface StatsQueryParams {
  time_filter?: TimeFilter;
  start_date?: string;
  end_date?: string;
  project_name?: string;
  language?: string;
}

export interface SessionStats {
  totalSessions: number;
  totalDuration: number;
  totalLinesAdded: number;
  totalLinesDeleted: number;
  totalLinesModified: number;
  totalEdits: number;
  averageSessionDuration: number;
}

export interface ProjectStats {
  name: string;
  duration: number;
  sessions: number;
}

export interface LanguageStats {
  name: string;
  duration: number;
  sessions: number;
}

export interface DailyStats {
  date: string;
  duration: number;
  sessions: number;
}



// Chart data interfaces for dashboard
export interface DashboardStats {
  totalSessions: number;
  totalDuration: number;
  linesAdded: number;
  averageSessionTime: number;
  mostUsedLanguage: string;
  activeProject: string;
}

export interface ChartData {
  dailyData: DailyStats[];
  languageData: LanguageStats[];
  projectData: ProjectStats[];
}

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  github_id?: string;
  extension_token?: string;
} 