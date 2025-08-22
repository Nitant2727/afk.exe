import { create } from 'zustand';
import { apiClient } from '../lib/api';
import type { User } from '../types/api';

interface AuthStore {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  // State
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  initializeUser: async () => {
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
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to load user',
        });
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to load user',
      });
    }
  },

  clearError: () => set({ error: null }),
})); 