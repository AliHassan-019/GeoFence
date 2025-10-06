import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Components
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import GeofenceManager from './pages/GeofenceManager';
import GoogleAdsPage from './pages/GoogleAdsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    initializeAuth,
    login 
  } = useAuthStore();
  
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Initialize authentication on app start
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Handle OAuth callback and other URL parameters
  useEffect(() => {
    const handleUrlParams = async () => {
      const authSuccess = searchParams.get('auth');
      const error = searchParams.get('error');
      const expired = searchParams.get('expired');

      if (authSuccess === 'success') {
        toast.success('Successfully logged in!');
        // Re-initialize auth to pick up the new authentication state
        await initializeAuth();
        // Remove the auth parameter from URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }

      if (error) {
        let errorMessage = 'Authentication failed';
        switch (error) {
          case 'oauth_failed':
            errorMessage = 'Google OAuth authentication failed';
            break;
          case 'user_not_found':
            errorMessage = 'User account not found';
            break;
          case 'callback_failed':
            errorMessage = 'Authentication callback failed';
            break;
          default:
            errorMessage = 'Authentication error occurred';
        }
        toast.error(errorMessage);
        
        // Remove error parameter from URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }

      if (expired === 'true') {
        toast.error('Your session has expired. Please log in again.');
        // Remove expired parameter from URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    };

    handleUrlParams();
  }, [searchParams, login, initializeAuth]);

  // Show loading spinner while initializing auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />

        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/geofences" 
          element={
            <ProtectedRoute>
              <GeofenceManager />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/google-ads" 
          element={
            <ProtectedRoute>
              <GoogleAdsPage />
            </ProtectedRoute>
          } 
        />

        {/* Admin routes */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Root redirect */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              user?.role === 'admin' ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* 404 page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;