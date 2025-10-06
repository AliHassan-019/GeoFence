import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Layout from '../components/layout/Layout';
import {
  UserGroupIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ClockIcon,
  PlusIcon,
  EyeIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

const DashboardPage = () => {
  const { user } = useAuthStore();

  // Mock data for demonstration
  const stats = [
    {
      name: 'Active Geofences',
      value: '12',
      icon: MapPinIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Recent Alerts',
      value: '3',
      icon: ShieldCheckIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      name: 'Hours Tracked',
      value: '24.5',
      icon: ClockIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Reports Generated',
      value: '8',
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'entry',
      location: 'Office Building A',
      time: '2 hours ago',
      status: 'success'
    },
    {
      id: 2,
      type: 'exit',
      location: 'Warehouse District',
      time: '4 hours ago',
      status: 'success'
    },
    {
      id: 3,
      type: 'alert',
      location: 'Restricted Zone B',
      time: '6 hours ago',
      status: 'warning'
    }
  ];

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your geofences today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.status === 'success' ? 'bg-green-400' :
                      activity.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.type === 'entry' ? 'Entered' : 
                         activity.type === 'exit' ? 'Exited' : 'Alert from'} {activity.location}
                      </p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button className="text-sm text-primary-600 hover:text-primary-500 font-medium">
                  View all activity →
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <Link 
                  to="/geofences"
                  className="block w-full text-left p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="font-medium text-gray-900">Create New Geofence</p>
                      <p className="text-sm text-gray-500">Set up a new location boundary</p>
                    </div>
                  </div>
                </Link>
                
                <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <ChartBarIcon className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="font-medium text-gray-900">Generate Report</p>
                      <p className="text-sm text-gray-500">Create activity summary</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <ShieldCheckIcon className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="font-medium text-gray-900">View Alerts</p>
                      <p className="text-sm text-gray-500">Check recent notifications</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>


      </div>
    </Layout>
  );
};

export default DashboardPage;