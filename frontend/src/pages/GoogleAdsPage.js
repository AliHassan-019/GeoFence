import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/layout/Layout';
import { googleAdsAPI, googleAdsAuthAPI } from '../services/api';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  LinkIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const GoogleAdsPage = () => {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedAdGroup, setSelectedAdGroup] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const queryClient = useQueryClient();

  // Check Google Ads connection status
  const { data: authStatus, isLoading: authLoading, error: authError } = useQuery({
    queryKey: ['googleAdsAuthStatus'],
    queryFn: async () => {
      const response = await googleAdsAuthAPI.getStatus();
      return response.data;
    }
  });

  // Update connection status when auth data changes
  useEffect(() => {
    if (authStatus) {
      setConnectionStatus(authStatus.isConnected);
    } else if (authError) {
      console.error('Failed to check Google Ads connection status:', authError);
      setConnectionStatus(false);
    }
  }, [authStatus, authError]);

  // Connect to Google Ads mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await googleAdsAuthAPI.connect();
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 800));
      return response;
    },
    onSuccess: (response) => {
      const data = response.data;
      if (data && data.authUrl) {
        console.log('Redirecting to Google OAuth:', data.authUrl);
        window.location.href = data.authUrl;
      } else {
        console.error('No authUrl found in response:', response);
      }
    },
    onError: (error) => {
      console.error('Failed to initiate Google Ads connection:', error);
    }
  });

  // Disconnect from Google Ads mutation
  const disconnectMutation = useMutation({
    mutationFn: googleAdsAuthAPI.disconnect,
    onSuccess: () => {
      setConnectionStatus(false);
      queryClient.invalidateQueries({ queryKey: ['googleAdsAuthStatus'] });
      queryClient.invalidateQueries({ queryKey: ['googleAdsSummary'] });
      queryClient.invalidateQueries({ queryKey: ['googleAdsCampaigns'] });
    },
    onError: (error) => {
      console.error('Failed to disconnect Google Ads:', error);
    }
  });

  // Handle URL parameters for OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');

    if (connected === 'true') {
      setConnectionStatus(true);
      queryClient.invalidateQueries('googleAdsAuthStatus');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      console.error('Google Ads connection error:', error);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [queryClient]);

  // Fetch account summary (only when connected)
  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['googleAds', 'summary'],
    queryFn: () => googleAdsAPI.getSummary(),
    select: (response) => response.data.data,
    enabled: connectionStatus === true
  });

  // Fetch campaigns (only when connected)
  const { data: campaignsData, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['googleAds', 'campaigns'],
    queryFn: () => googleAdsAPI.getCampaigns(),
    select: (response) => response.data.data || [],
    enabled: connectionStatus === true
  });

  // Fetch ad groups for selected campaign (only when connected)
  const { data: adGroupsData, isLoading: isLoadingAdGroups } = useQuery({
    queryKey: ['googleAds', 'adGroups', selectedCampaign?.campaign?.id],
    queryFn: () => googleAdsAPI.getAdGroups(selectedCampaign.campaign.id),
    select: (response) => response.data.data || [],
    enabled: !!selectedCampaign && connectionStatus === true
  });

  // Fetch ads for selected ad group (only when connected)
  const { data: adsData, isLoading: isLoadingAds } = useQuery({
    queryKey: ['googleAds', 'ads', selectedAdGroup?.ad_group?.id],
    queryFn: () => googleAdsAPI.getAds(selectedAdGroup.ad_group.id),
    select: (response) => response.data.data || [],
    enabled: !!selectedAdGroup && connectionStatus === true
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number || 0);
  };

  const formatPercentage = (percentage) => {
    return `${(percentage * 100 || 0).toFixed(2)}%`;
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      purple: 'bg-purple-50 text-purple-600',
    };

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                {trend === 'up' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>
    );
  };

  const CampaignCard = ({ campaign, onClick, isSelected }) => (
    <div
      className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => onClick(campaign)}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium text-gray-900 truncate">{campaign.campaign.name}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${
          campaign.campaign.status === 'ENABLED' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {campaign.campaign.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Impressions</p>
          <p className="font-semibold">{formatNumber(campaign.metrics.impressions)}</p>
        </div>
        <div>
          <p className="text-gray-600">Clicks</p>
          <p className="font-semibold">{formatNumber(campaign.metrics.clicks)}</p>
        </div>
        <div>
          <p className="text-gray-600">Cost</p>
          <p className="font-semibold">{formatCurrency(campaign.metrics.cost)}</p>
        </div>
        <div>
          <p className="text-gray-600">CTR</p>
          <p className="font-semibold">{formatPercentage(campaign.metrics.ctr)}</p>
        </div>
      </div>
    </div>
  );

  const AdGroupCard = ({ adGroup, onClick, isSelected }) => (
    <div
      className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => onClick(adGroup)}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-medium text-gray-900 truncate">{adGroup.ad_group.name}</h4>
        <span className={`px-2 py-1 text-xs rounded-full ${
          adGroup.ad_group.status === 'ENABLED' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {adGroup.ad_group.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Impressions</p>
          <p className="font-semibold">{formatNumber(adGroup.metrics.impressions)}</p>
        </div>
        <div>
          <p className="text-gray-600">Clicks</p>
          <p className="font-semibold">{formatNumber(adGroup.metrics.clicks)}</p>
        </div>
        <div>
          <p className="text-gray-600">Cost</p>
          <p className="font-semibold">{formatCurrency(adGroup.metrics.cost)}</p>
        </div>
        <div>
          <p className="text-gray-600">CTR</p>
          <p className="font-semibold">{formatPercentage(adGroup.metrics.ctr)}</p>
        </div>
      </div>
    </div>
  );

  const AdCard = ({ ad }) => (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h5 className="font-medium text-gray-900 mb-1">
            {ad.ad_group_ad.ad.text_ad?.headline || `Ad ${ad.ad_group_ad.ad.id}`}
          </h5>
          {ad.ad_group_ad.ad.text_ad?.description1 && (
            <p className="text-sm text-gray-600 mb-2">
              {ad.ad_group_ad.ad.text_ad.description1}
            </p>
          )}
          {ad.ad_group_ad.ad.final_urls && ad.ad_group_ad.ad.final_urls.length > 0 && (
            <p className="text-xs text-blue-600 truncate">
              {ad.ad_group_ad.ad.final_urls[0]}
            </p>
          )}
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          ad.ad_group_ad.status === 'ENABLED' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {ad.ad_group_ad.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Impressions</p>
          <p className="font-semibold">{formatNumber(ad.metrics.impressions)}</p>
        </div>
        <div>
          <p className="text-gray-600">Clicks</p>
          <p className="font-semibold">{formatNumber(ad.metrics.clicks)}</p>
        </div>
        <div>
          <p className="text-gray-600">Cost</p>
          <p className="font-semibold">{formatCurrency(ad.metrics.cost)}</p>
        </div>
        <div>
          <p className="text-gray-600">CTR</p>
          <p className="font-semibold">{formatPercentage(ad.metrics.ctr)}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Google Ads</h1>
            <p className="text-gray-600">Monitor your advertising campaigns and performance</p>
          </div>
          {connectionStatus && (
            <button
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isLoading}
              className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              {disconnectMutation.isLoading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          )}
        </div>

        {/* Loading State */}
        {connectionStatus === null && authLoading && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="animate-spin mx-auto h-12 w-12 text-blue-600 mb-4">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Checking Google Ads Connection</h3>
              <p className="text-gray-600">Please wait while we verify your connection status...</p>
            </div>
          </div>
        )}

        {/* Connection Status */}
        {connectionStatus === false && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Google Ads Account</h3>
              <p className="text-gray-600 mb-6">
                To view your advertising campaigns and performance data, you need to connect your Google Ads account.
              </p>
              <button
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isLoading}
                className={`flex items-center justify-center px-6 py-3 text-sm font-medium text-white border border-transparent rounded-lg mx-auto transition-all duration-200 ${
                  connectMutation.isLoading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {connectMutation.isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-5 w-5 mr-2" />
                    Connect Google Ads
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Show content only when connected */}
        {connectionStatus === true && (
          <>

        {/* Account Summary */}
        {isLoadingSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : summaryData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Campaigns"
              value={formatNumber(summaryData.totalCampaigns)}
              icon={ChartBarIcon}
              color="blue"
            />
            <StatCard
              title="Total Impressions"
              value={formatNumber(summaryData.totalImpressions)}
              icon={EyeIcon}
              color="green"
            />
            <StatCard
              title="Total Clicks"
              value={formatNumber(summaryData.totalClicks)}
              icon={CursorArrowRaysIcon}
              color="yellow"
            />
            <StatCard
              title="Total Cost"
              value={formatCurrency(summaryData.totalCost)}
              icon={CurrencyDollarIcon}
              color="purple"
            />
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Unable to load account summary. Please ensure your Google Ads account is properly connected.
            </p>
          </div>
        )}

        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button
            onClick={() => {
              setSelectedCampaign(null);
              setSelectedAdGroup(null);
            }}
            className={`hover:text-blue-600 ${!selectedCampaign ? 'text-blue-600 font-medium' : ''}`}
          >
            Campaigns
          </button>
          {selectedCampaign && (
            <>
              <span>/</span>
              <button
                onClick={() => setSelectedAdGroup(null)}
                className={`hover:text-blue-600 ${selectedCampaign && !selectedAdGroup ? 'text-blue-600 font-medium' : ''}`}
              >
                {selectedCampaign.campaign.name} - Ad Groups
              </button>
            </>
          )}
          {selectedAdGroup && (
            <>
              <span>/</span>
              <span className="text-blue-600 font-medium">
                {selectedAdGroup.ad_group.name} - Ads
              </span>
            </>
          )}
        </div>

        {/* Content Area */}
        {!selectedCampaign ? (
          /* Campaigns View */
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaigns</h2>
            {isLoadingCampaigns ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : campaignsData && campaignsData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaignsData.map((campaign) => (
                  <CampaignCard
                    key={campaign.campaign.id}
                    campaign={campaign}
                    onClick={setSelectedCampaign}
                    isSelected={false}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No campaigns found. Create your first campaign in Google Ads.</p>
              </div>
            )}
          </div>
        ) : !selectedAdGroup ? (
          /* Ad Groups View */
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ad Groups - {selectedCampaign.campaign.name}
            </h2>
            {isLoadingAdGroups ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : adGroupsData && adGroupsData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adGroupsData.map((adGroup) => (
                  <AdGroupCard
                    key={adGroup.ad_group.id}
                    adGroup={adGroup}
                    onClick={setSelectedAdGroup}
                    isSelected={false}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-600">No ad groups found for this campaign.</p>
              </div>
            )}
          </div>
        ) : (
          /* Ads View */
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ads - {selectedAdGroup.ad_group.name}
            </h2>
            {isLoadingAds ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : adsData && adsData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adsData.map((ad) => (
                  <AdCard
                    key={ad.ad_group_ad.ad.id}
                    ad={ad}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-600">No ads found for this ad group.</p>
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default GoogleAdsPage;