import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setToken: (token) => set({ token }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),

      // Login action
      login: async (token) => {
        try {
          set({ isLoading: true, error: null });
          
          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get user data
          const response = await api.get('/auth/me');
          const userData = response.data.data.user;
          
          set({
            user: userData,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          return userData;
        } catch (error) {
          console.error('Login error:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.response?.data?.message || 'Login failed'
          });
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        try {
          set({ isLoading: true });
          
          // Call logout endpoint to clear cookies
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear state regardless of API call success
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          
          // Remove token from API headers
          delete api.defaults.headers.common['Authorization'];
          
          // Clear persisted state
          localStorage.removeItem('auth-storage');
        }
      },

      // Refresh token action
      refreshToken: async () => {
        try {
          const response = await api.post('/auth/refresh');
          const { user, token } = response.data.data;
          
          // Update API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({
            user,
            token,
            isAuthenticated: true,
            error: null
          });
          
          return { user, token };
        } catch (error) {
          console.error('Token refresh error:', error);
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },

      // Initialize auth from stored token or cookies
      initializeAuth: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // Try to get user data (this will work with cookies)
          const response = await api.get('/auth/me');
          const userData = response.data.data.user;
          
          set({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Auth initialization error:', error);
          
          // If /auth/me fails, user is not authenticated
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          
          // Clear any authorization header
          delete api.defaults.headers.common['Authorization'];
        }
      },

      // Update user profile
      updateProfile: async (profileData) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await api.put('/auth/profile', profileData);
          const updatedUser = response.data.data.user;
          
          set({
            user: updatedUser,
            isLoading: false,
            error: null
          });
          
          return updatedUser;
        } catch (error) {
          console.error('Profile update error:', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Profile update failed'
          });
          throw error;
        }
      },

      // Check if user has specific role
      hasRole: (role) => {
        const { user } = get();
        return user?.role === role;
      },

      // Check if user is admin
      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      },

      // Check if user is client
      isClient: () => {
        const { user } = get();
        return user?.role === 'client';
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;