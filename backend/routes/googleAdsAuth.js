const express = require('express');
const { google } = require('googleapis');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Google Ads OAuth2 client setup
const getGoogleAdsOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_ADS_CLIENT_ID,
    process.env.GOOGLE_ADS_CLIENT_SECRET,
    process.env.GOOGLE_ADS_CALLBACK_URL
  );
};

// Google Ads OAuth scopes
const GOOGLE_ADS_SCOPES = [
  'https://www.googleapis.com/auth/adwords'
];

// GET /api/auth/google-ads/connect - Initiate Google Ads OAuth flow
router.get('/connect', authenticateToken, async (req, res) => {
  try {
    const oauth2Client = getGoogleAdsOAuth2Client();
    
    // Generate the URL for Google Ads OAuth consent
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_ADS_SCOPES,
      prompt: 'consent', // Force consent screen to get refresh token
      state: req.user.id // Pass user ID in state for security
    });

    res.json({
      success: true,
      authUrl,
      message: 'Redirect user to this URL to authorize Google Ads access'
    });
  } catch (error) {
    console.error('Google Ads OAuth initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Google Ads authentication',
      error: error.message
    });
  }
});

// GET /api/auth/google-ads/callback - Handle Google Ads OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/google-ads?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/google-ads?error=missing_parameters`);
    }

    const oauth2Client = getGoogleAdsOAuth2Client();
    
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Update user with Google Ads tokens
    const user = await User.findById(state);
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/google-ads?error=user_not_found`);
    }

    // Save tokens to user
    user.googleAdsAccessToken = tokens.access_token;
    user.googleAdsRefreshToken = tokens.refresh_token;
    user.googleAdsTokenExpiry = new Date(tokens.expiry_date);
    user.isGoogleAdsConnected = true;

    await user.save();

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}/google-ads?connected=true`);
  } catch (error) {
    console.error('Google Ads OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/google-ads?error=${encodeURIComponent('authentication_failed')}`);
  }
});

// POST /api/auth/google-ads/disconnect - Disconnect Google Ads account
router.post('/disconnect', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Clear Google Ads tokens
    user.googleAdsAccessToken = undefined;
    user.googleAdsRefreshToken = undefined;
    user.googleAdsTokenExpiry = undefined;
    user.googleAdsCustomerId = undefined;
    user.isGoogleAdsConnected = false;

    await user.save();

    res.json({
      success: true,
      message: 'Google Ads account disconnected successfully'
    });
  } catch (error) {
    console.error('Google Ads disconnect error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Google Ads account',
      error: error.message
    });
  }
});

// GET /api/auth/google-ads/status - Check Google Ads connection status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('isGoogleAdsConnected googleAdsTokenExpiry');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isConnected = user.isGoogleAdsConnected && 
                       user.googleAdsTokenExpiry && 
                       user.googleAdsTokenExpiry > new Date();

    res.json({
      success: true,
      isConnected,
      tokenExpiry: user.googleAdsTokenExpiry
    });
  } catch (error) {
    console.error('Google Ads status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check Google Ads connection status',
      error: error.message
    });
  }
});

module.exports = router;