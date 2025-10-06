import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import useAuthStore from '../store/authStore';

const NotFoundPage = () => {
  const { isAuthenticated, isAdmin } = useAuthStore();

  const getDashboardLink = () => {
    if (!isAuthenticated()) return '/login';
    return isAdmin() ? '/admin/dashboard' : '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto h-24 w-24 bg-primary-600 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl font-bold text-white">404</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you might have entered the wrong URL.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to={getDashboardLink()}
            className="w-full btn-primary flex items-center justify-center"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            {isAuthenticated() ? 'Go to Dashboard' : 'Go to Login'}
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full btn-secondary flex items-center justify-center"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Go Back
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>
            If you believe this is an error, please{' '}
            <a href="mailto:support@geofenceapp.com" className="text-primary-600 hover:text-primary-500">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;