# Environment Variables Setup Guide

This document provides comprehensive information about all environment variables used in the Geofence Management System.

## Backend Environment Variables

### Required Variables

#### Database Configuration
- **MONGODB_URI**: MongoDB connection string
  - Development: `mongodb://localhost:27017/geofence`
  - Production: `mongodb://username:password@host:port/database`
  - Docker: `mongodb://admin:password123@mongodb:27017/geofence?authSource=admin`

#### Server Configuration
- **PORT**: Server port number
  - Default: `5001`
  - Production: Set according to your deployment environment

#### JWT Configuration
- **JWT_SECRET**: Secret key for signing JWT tokens
  - **CRITICAL**: Must be at least 32 characters long
  - Example: `your_very_secure_jwt_secret_key_here_minimum_32_characters`
  
- **JWT_REFRESH_SECRET**: Secret key for refresh tokens
  - **CRITICAL**: Must be different from JWT_SECRET and at least 32 characters
  - Example: `your_very_secure_refresh_secret_key_here_minimum_32_characters`
  
- **JWT_EXPIRES_IN**: Access token expiration time
  - Default: `15m`
  - Options: `15m`, `30m`, `1h`, etc.
  
- **JWT_REFRESH_EXPIRES_IN**: Refresh token expiration time
  - Default: `7d`
  - Options: `7d`, `30d`, `90d`, etc.

#### Google OAuth Configuration
- **GOOGLE_CLIENT_ID**: Google OAuth 2.0 client ID
  - Obtain from [Google Cloud Console](https://console.cloud.google.com/)
  - Example: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
  
- **GOOGLE_CLIENT_SECRET**: Google OAuth 2.0 client secret
  - Obtain from Google Cloud Console
  - **CRITICAL**: Keep this secret and never expose in frontend
  
- **GOOGLE_CALLBACK_URL**: OAuth callback URL
  - Development: `http://localhost:5001/api/auth/google/callback`
  - Production: `https://yourdomain.com/api/auth/google/callback`

#### Facebook OAuth Configuration
- **FACEBOOK_APP_ID**: Facebook App ID
  - Obtain from [Facebook Developers Console](https://developers.facebook.com/)
  - Example: `123456789012345`
  
- **FACEBOOK_APP_SECRET**: Facebook App Secret
  - Obtain from Facebook Developers Console
  - **CRITICAL**: Keep this secret and never expose in frontend
  
- **FACEBOOK_CALLBACK_URL**: OAuth callback URL
  - Development: `http://localhost:5001/api/auth/facebook/callback`
  - Production: `https://yourdomain.com/api/auth/facebook/callback`

#### Application URLs
- **FRONTEND_URL**: Frontend application URL
  - Development: `http://localhost:3000`
  - Production: `https://yourdomain.com`

#### Session Configuration
- **SESSION_SECRET**: Express session secret
  - **CRITICAL**: Must be at least 32 characters long
  - Example: `your_very_secure_session_secret_here_minimum_32_characters`

### Optional Variables

- **NODE_ENV**: Node.js environment
  - Values: `development`, `production`, `test`
  - Default: `development`

- **CORS_ORIGIN**: CORS allowed origins
  - Development: `http://localhost:3000`
  - Production: `https://yourdomain.com`

## Frontend Environment Variables

The frontend uses a proxy configuration in development, so most API calls are relative. For production builds, ensure the backend URL is correctly configured in the build process.

### Build-time Variables (if needed)
- **REACT_APP_API_URL**: API base URL (only if not using proxy)
  - Development: Not needed (uses proxy)
  - Production: Set during build if needed

## Docker Environment Variables

When using Docker Compose, additional variables are available:

### MongoDB Docker Variables
- **MONGO_ROOT_USERNAME**: MongoDB root username
  - Default: `admin`
  
- **MONGO_ROOT_PASSWORD**: MongoDB root password
  - **CRITICAL**: Change from default in production
  
- **MONGO_DB_NAME**: Database name
  - Default: `geofence`

## Security Best Practices

### Secret Generation
Generate secure secrets using:
```bash
# Generate a 32-character random string
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Environment File Security
1. **Never commit `.env` files to version control**
2. **Use different secrets for each environment**
3. **Rotate secrets regularly in production**
4. **Use environment variable management tools in production**

### Production Considerations
1. **Use a secrets management service** (AWS Secrets Manager, Azure Key Vault, etc.)
2. **Enable MongoDB authentication and SSL**
3. **Use HTTPS for all URLs**
4. **Set up proper CORS policies**
5. **Use strong, unique passwords**

## Environment File Templates

### Development (.env)
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/geofence
JWT_SECRET=dev_jwt_secret_minimum_32_characters_long
JWT_REFRESH_SECRET=dev_refresh_secret_minimum_32_characters_long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:5001/api/auth/facebook/callback
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=dev_session_secret_minimum_32_characters_long
```

### Production (.env)
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://username:password@host:port/database
JWT_SECRET=prod_jwt_secret_minimum_32_characters_long
JWT_REFRESH_SECRET=prod_refresh_secret_minimum_32_characters_long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_CALLBACK_URL=https://yourdomain.com/api/auth/facebook/callback
FRONTEND_URL=https://yourdomain.com
SESSION_SECRET=prod_session_secret_minimum_32_characters_long
CORS_ORIGIN=https://yourdomain.com
```

## Troubleshooting

### Common Issues
1. **JWT_SECRET too short**: Ensure all secrets are at least 32 characters
2. **Google OAuth errors**: Verify client ID, secret, and callback URL
3. **Facebook OAuth errors**: Verify app ID, secret, and callback URL
4. **CORS errors**: Check FRONTEND_URL and CORS_ORIGIN settings
5. **Database connection**: Verify MONGODB_URI format and credentials

### Validation
The application includes environment variable validation on startup. Check the console for any missing or invalid variables.