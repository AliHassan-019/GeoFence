import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  withCredentials: true, // Include cookies in requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }
    
    const { status, data } = error.response;
    
    // Handle 401 Unauthorized
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshResponse = await api.post('/auth/refresh');
        const { token } = refreshResponse.data.data;
        
        // Update authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        
        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        console.error('Token refresh failed:', refreshError);
        
        // Clear auth state
        delete api.defaults.headers.common['Authorization'];
        localStorage.removeItem('auth-storage');
        
        // Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other errors
    const errorMessage = data?.message || getErrorMessage(status);
    
    // Don't show toast for certain endpoints
    const silentEndpoints = ['/auth/check', '/auth/me', '/auth/refresh'];
    const isSilentEndpoint = silentEndpoints.some(endpoint => 
      originalRequest.url?.includes(endpoint)
    );
    
    if (!isSilentEndpoint) {
      toast.error(errorMessage);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to get error messages
const getErrorMessage = (status) => {
  switch (status) {
    case 400:
      return 'Bad request. Please check your input.';
    case 401:
      return 'Unauthorized. Please log in again.';
    case 403:
      return 'Access denied. You don\'t have permission.';
    case 404:
      return 'Resource not found.';
    case 409:
      return 'Conflict. Resource already exists.';
    case 422:
      return 'Validation error. Please check your input.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
      return 'Bad gateway. Server is temporarily unavailable.';
    case 503:
      return 'Service unavailable. Please try again later.';
    case 504:
      return 'Gateway timeout. Please try again later.';
    default:
      return 'An unexpected error occurred.';
  }
};

// API methods
export const authAPI = {
  // Check authentication status
  checkAuth: () => api.get('/auth/check'),
  
  // Get current user
  getMe: () => api.get('/auth/me'),
  
  // Refresh token
  refreshToken: () => api.post('/auth/refresh'),
  
  // Logout
  logout: () => api.post('/auth/logout'),
  
  // Update profile
  updateProfile: (data) => api.put('/auth/profile', data),
  
  // Google OAuth login URL
  getGoogleLoginUrl: () => `http://localhost:5001/api/auth/google`,
  
  // Facebook OAuth login URL
  getFacebookLoginUrl: () => `http://localhost:5001/api/auth/facebook`,
};

export const usersAPI = {
  // Get all users (admin only)
  getUsers: (params = {}) => api.get('/users', { params }),
  
  // Get user by ID
  getUser: (id) => api.get(`/users/${id}`),
  
  // Update user
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  
  // Delete user (admin only)
  deleteUser: (id) => api.delete(`/users/${id}`),
  
  // Activate user (admin only)
  activateUser: (id) => api.post(`/users/${id}/activate`),
  
  // Get user statistics (admin only)
  getUserStats: () => api.get('/users/stats/overview'),
};

export const geofencesAPI = {
  // Get all geofences for the authenticated user
  getGeofences: () => api.get('/geofences'),
  
  // Get a specific geofence by ID
  getGeofence: (id) => api.get(`/geofences/${id}`),
  
  // Create a new geofence
  createGeofence: (data) => api.post('/geofences', data),
  
  // Update a geofence
  updateGeofence: (id, data) => api.put(`/geofences/${id}`, data),
  
  // Delete a geofence
  deleteGeofence: (id) => api.delete(`/geofences/${id}`),
  
  // Check if a point is inside any geofence
  checkPoint: (lat, lng) => api.post('/geofences/check-point', { lat, lng }),
  
  // Get geofences by tag
  getGeofencesByTag: (tag) => api.get(`/geofences/tags/${tag}`),
  
  // Get all unique tags
  getTags: () => api.get('/geofences/tags'),
};

export const googleAdsAPI = {
  // Get all campaigns
  getCampaigns: () => api.get('/google-ads/campaigns'),
  
  // Get ad groups for a campaign
  getAdGroups: (campaignId) => api.get(`/google-ads/ad-groups/${campaignId}`),
  
  // Get ads for an ad group
  getAds: (adGroupId) => api.get(`/google-ads/ads/${adGroupId}`),
  
  // Get performance data
  getPerformance: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/google-ads/performance${queryParams ? `?${queryParams}` : ''}`);
  },
  
  // Get account summary
  getSummary: () => api.get('/google-ads/summary'),
};

// Google Ads Authentication API services
export const googleAdsAuthAPI = {
  // Get connection status
  getStatus: () => api.get('/auth/google-ads/status'),
  
  // Initiate connection flow
  connect: () => api.get('/auth/google-ads/connect'),
  
  // Disconnect Google Ads account
  disconnect: () => api.post('/auth/google-ads/disconnect'),
};

export default api;