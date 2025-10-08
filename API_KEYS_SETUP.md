# 🔑 API Keys Setup Guide

This guide will help you obtain all the necessary API keys to run the GeoFence project.

## 📋 Required API Keys

You need to configure the following API keys in your `.env` files:

### 1. Google OAuth API Keys
**Location:** Root `.env` file
**Variables:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

#### How to get Google OAuth keys:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (or **Google Identity API**)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:5001/api/auth/google/callback`
   - `http://localhost:3000` (for development)
7. Copy the **Client ID** and **Client Secret**

### 2. Google Maps API Key
**Location:** `frontend/.env` file
**Variable:** `REACT_APP_GOOGLE_MAPS_API_KEY`

#### How to get Google Maps API key:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select the same project as above
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**
   - **Maps Embed API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Restrict the API key to the enabled APIs
6. Add HTTP referrers (for development):
   - `http://localhost:3000/*`
   - `http://127.0.0.1:3000/*`

### 3. Facebook OAuth API Keys (Optional)
**Location:** Root `.env` file
**Variables:** `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`

#### How to get Facebook OAuth keys:
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add **Facebook Login** product
4. Configure OAuth redirect URIs:
   - `http://localhost:5001/api/auth/facebook/callback`
5. Copy the **App ID** and **App Secret**

### 4. Google Ads API Keys (Optional)
**Location:** Root `.env` file
**Variables:** `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`

#### How to get Google Ads API keys:
1. Go to [Google Ads API Center](https://ads.google.com/home/tools/api-center/)
2. Apply for a developer token
3. Create OAuth 2.0 credentials in Google Cloud Console
4. Get your Google Ads customer ID (without hyphens)

## 🔧 Environment File Configuration

### Root `.env` file (already created):
```env
# Replace these with your actual API keys:
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
FACEBOOK_APP_ID=YOUR_FACEBOOK_APP_ID_HERE
FACEBOOK_APP_SECRET=YOUR_FACEBOOK_APP_SECRET_HERE
GOOGLE_ADS_CLIENT_ID=YOUR_GOOGLE_ADS_CLIENT_ID_HERE
GOOGLE_ADS_CLIENT_SECRET=YOUR_GOOGLE_ADS_CLIENT_SECRET_HERE
GOOGLE_ADS_DEVELOPER_TOKEN=YOUR_GOOGLE_ADS_DEVELOPER_TOKEN_HERE
GOOGLE_ADS_CUSTOMER_ID=YOUR_GOOGLE_ADS_CUSTOMER_ID_HERE
```

### Frontend `.env` file (already created):
```env
# Replace this with your actual Google Maps API key:
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
```

## 🚀 Quick Start After API Keys Setup

1. **Update your `.env` files** with the actual API keys
2. **Run the project:**
   ```bash
   # Start all services with Docker Compose
   docker-compose up -d
   ```
3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001
   - API Health: http://localhost:5001/api/health

## 🔒 Security Notes

- **Never commit** your `.env` files to version control
- **Restrict your API keys** to specific domains/IPs in production
- **Use environment-specific** API keys for development and production
- **Rotate your API keys** regularly for security

## 🆘 Troubleshooting

### Common Issues:

1. **"Invalid redirect URI" error:**
   - Check that your redirect URIs match exactly in Google Cloud Console
   - Ensure no trailing slashes or extra characters

2. **"API key not valid" error:**
   - Verify the API key is correct
   - Check that required APIs are enabled
   - Ensure the API key has proper restrictions

3. **"CORS error" in browser:**
   - Check that `FRONTEND_URL` in backend `.env` matches your frontend URL
   - Verify CORS configuration in `server.js`

4. **"MongoDB connection failed":**
   - Ensure MongoDB is running in Docker
   - Check the connection string in `.env`

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all API keys are correctly configured
3. Ensure all required APIs are enabled
4. Check the application logs for detailed error messages

---

**Note:** The project is now fully configured with all necessary files. You only need to replace the placeholder API keys with your actual keys and run the project!
