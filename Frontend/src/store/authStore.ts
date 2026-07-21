import { create } from 'zustand';
import { apiClient } from '../lib/api';
import type { User } from '../types/api';

const TOKEN_KEY = 'auth_token';

interface AuthStore {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeUser: () => Promise<void>;
  setUser: (user: User, token?: string) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  /**
   * Restore the session on boot. With no stored token there is nothing to
   * restore, so fall through to the login screen instead of calling the API.
   */
  initializeUser: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.getCurrentUser();

      if (response.success && response.data) {
        set({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        // Stale token — drop it so the next boot skips this round trip.
        localStorage.removeItem(TOKEN_KEY);
        set({ user: null, isAuthenticated: false, isLoading: false, error: null });
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Could not reach the backend',
      });
    }
  },

  setUser: (user, token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    set({ user, isAuthenticated: true, isLoading: false, error: null });
  },

  setLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
