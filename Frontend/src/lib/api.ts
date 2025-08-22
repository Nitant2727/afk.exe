import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type {
  ApiResponse,
  SessionRequest,
  SessionsQueryParams,
  StatsQueryParams,
  FileSession,
  SessionStats,
  ProjectStats,
  LanguageStats,
  DailyStats,
  User
} from '../types/api';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    params?: any
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.request({
        method,
        url,
        data,
        params,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data as ApiResponse<T>;
      }
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  // Auth endpoints
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('GET', '/api/auth/me');
  }

  // Session endpoints
  async createSession(data: SessionRequest): Promise<ApiResponse<void>> {
    return this.request('POST', '/api/sessions', data);
  }

  async getSessions(params?: SessionsQueryParams): Promise<ApiResponse<{ sessions: FileSession[]; total: number }>> {
    return this.request('GET', '/api/sessions', undefined, params);
  }

  async getUniqueProjects(): Promise<ApiResponse<string[]>> {
    return this.request('GET', '/api/sessions/projects');
  }

  async getUniqueLanguages(): Promise<ApiResponse<string[]>> {
    return this.request('GET', '/api/sessions/languages');
  }

  // Statistics endpoints - Updated to match OpenAPI spec
  async getSessionStatistics(params?: StatsQueryParams): Promise<ApiResponse<SessionStats>> {
    return this.request('GET', '/api/sessions/stats', undefined, params);
  }

  async getProjectStatistics(params?: Omit<StatsQueryParams, 'project_name'>): Promise<ApiResponse<ProjectStats[]>> {
    return this.request('GET', '/api/sessions/stats/projects', undefined, params);
  }

  async getLanguageStatistics(params?: Omit<StatsQueryParams, 'language'>): Promise<ApiResponse<LanguageStats[]>> {
    return this.request('GET', '/api/sessions/stats/languages', undefined, params);
  }

  async getDailyStatistics(params?: StatsQueryParams): Promise<ApiResponse<DailyStats[]>> {
    return this.request('GET', '/api/sessions/stats/daily', undefined, params);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request('GET', '/api/health');
  }
}

export const apiClient = new ApiClient(); 