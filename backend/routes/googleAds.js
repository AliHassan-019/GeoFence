const express = require('express');
const { GoogleAdsApi, enums } = require('google-ads-api');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Initialize Google Ads API client
const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

// Helper function to get user's Google Ads customer
async function getGoogleAdsCustomer(userId) {
  const user = await User.findById(userId).select('+googleAdsAccessToken +googleAdsRefreshToken +googleAdsCustomerId +isGoogleAdsConnected');
  
  if (!user || !user.isGoogleAdsConnected || !user.googleAdsAccessToken) {
    throw new Error('User not authenticated with Google Ads');
  }

  // Use a default customer ID if not set in user profile
  const customerId = user.googleAdsCustomerId || process.env.GOOGLE_ADS_CUSTOMER_ID || '1234567890';

  const customer = client.Customer({
    customer_id: customerId,
    refresh_token: user.googleAdsRefreshToken,
  });

  return customer;
}

// GET /api/google-ads/campaigns - Get all campaigns
router.get('/campaigns', authenticateToken, async (req, res) => {
  try {
    const customer = await getGoogleAdsCustomer(req.user.id);

    const campaigns = await customer.query(`
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.start_date,
        campaign.end_date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.ctr,
        metrics.average_cpc
      FROM campaign 
      WHERE campaign.status != 'REMOVED'
      ORDER BY campaign.name
    `);

    // Convert cost from micros to actual currency
    const formattedCampaigns = campaigns.map(campaign => ({
      ...campaign,
      metrics: {
        ...campaign.metrics,
        cost: campaign.metrics.cost_micros / 1000000, // Convert micros to dollars
        average_cpc: campaign.metrics.average_cpc / 1000000
      }
    }));

    res.json({
      success: true,
      data: formattedCampaigns
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns',
      error: error.message
    });
  }
});

// GET /api/google-ads/ad-groups/:campaignId - Get ad groups for a campaign
router.get('/ad-groups/:campaignId', authenticateToken, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const customer = await getGoogleAdsCustomer(req.user.id);

    const adGroups = await customer.query(`
      SELECT 
        ad_group.id,
        ad_group.name,
        ad_group.status,
        ad_group.type,
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.ctr,
        metrics.average_cpc
      FROM ad_group 
      WHERE campaign.id = ${campaignId}
        AND ad_group.status != 'REMOVED'
      ORDER BY ad_group.name
    `);

    const formattedAdGroups = adGroups.map(adGroup => ({
      ...adGroup,
      metrics: {
        ...adGroup.metrics,
        cost: adGroup.metrics.cost_micros / 1000000,
        average_cpc: adGroup.metrics.average_cpc / 1000000
      }
    }));

    res.json({
      success: true,
      data: formattedAdGroups
    });
  } catch (error) {
    console.error('Error fetching ad groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ad groups',
      error: error.message
    });
  }
});

// GET /api/google-ads/ads/:adGroupId - Get ads for an ad group
router.get('/ads/:adGroupId', authenticateToken, async (req, res) => {
  try {
    const { adGroupId } = req.params;
    const customer = await getGoogleAdsCustomer(req.user.id);

    const ads = await customer.query(`
      SELECT 
        ad_group_ad.ad.id,
        ad_group_ad.ad.type,
        ad_group_ad.status,
        ad_group_ad.ad.final_urls,
        ad_group_ad.ad.text_ad.headline,
        ad_group_ad.ad.text_ad.description1,
        ad_group_ad.ad.text_ad.description2,
        ad_group.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.ctr,
        metrics.average_cpc
      FROM ad_group_ad 
      WHERE ad_group.id = ${adGroupId}
        AND ad_group_ad.status != 'REMOVED'
      ORDER BY metrics.impressions DESC
    `);

    const formattedAds = ads.map(ad => ({
      ...ad,
      metrics: {
        ...ad.metrics,
        cost: ad.metrics.cost_micros / 1000000,
        average_cpc: ad.metrics.average_cpc / 1000000
      }
    }));

    res.json({
      success: true,
      data: formattedAds
    });
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ads',
      error: error.message
    });
  }
});

// GET /api/google-ads/performance - Get performance data
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const customer = await getGoogleAdsCustomer(req.user.id);

    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `AND segments.date BETWEEN '${startDate}' AND '${endDate}'`;
    }

    const performance = await customer.query(`
      SELECT 
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.conversion_rate,
        metrics.cost_per_conversion,
        segments.date
      FROM campaign 
      WHERE campaign.status != 'REMOVED'
        ${dateFilter}
      ORDER BY segments.date DESC
    `);

    const formattedPerformance = performance.map(perf => ({
      ...perf,
      metrics: {
        ...perf.metrics,
        cost: perf.metrics.cost_micros / 1000000,
        average_cpc: perf.metrics.average_cpc / 1000000,
        cost_per_conversion: perf.metrics.cost_per_conversion / 1000000
      }
    }));

    res.json({
      success: true,
      data: formattedPerformance
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance data',
      error: error.message
    });
  }
});

// GET /api/google-ads/summary - Get account summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const customer = await getGoogleAdsCustomer(req.user.id);

    // Get campaign summary
    const campaignSummary = await customer.query(`
      SELECT 
        COUNT(campaign.id) as total_campaigns,
        SUM(metrics.impressions) as total_impressions,
        SUM(metrics.clicks) as total_clicks,
        SUM(metrics.cost_micros) as total_cost,
        AVG(metrics.ctr) as average_ctr,
        SUM(metrics.conversions) as total_conversions
      FROM campaign 
      WHERE campaign.status = 'ENABLED'
        AND segments.date = TODAY
    `);

    const summary = campaignSummary[0] || {};
    
    res.json({
      success: true,
      data: {
        totalCampaigns: summary.total_campaigns || 0,
        totalImpressions: summary.total_impressions || 0,
        totalClicks: summary.total_clicks || 0,
        totalCost: (summary.total_cost || 0) / 1000000,
        averageCtr: summary.average_ctr || 0,
        totalConversions: summary.total_conversions || 0
      }
    });
  } catch (error) {
    console.error('Error fetching summary data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch summary data',
      error: error.message
    });
  }
});

module.exports = router;