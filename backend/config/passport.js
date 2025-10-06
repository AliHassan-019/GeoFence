const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/adwords']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth Profile:', {
      id: profile.id,
      email: profile.emails[0]?.value,
      name: profile.displayName
    });

    // Check if user already exists with this Google ID
    let user = await User.findByGoogleId(profile.id);
    
    if (user) {
      // User exists, update tokens and last login
      user.googleAccessToken = accessToken;
      user.googleRefreshToken = refreshToken;
      user.googleTokenExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour from now
      await user.save();
      await user.updateLastLogin();
      return done(null, user);
    }

    // Check if user exists with same email (different provider)
    user = await User.findByEmail(profile.emails[0].value);
    
    if (user) {
      // User exists with same email but different provider
      // Link the Google account to existing user
      user.googleId = profile.id;
      user.provider = 'google';
      user.isEmailVerified = true;
      user.googleAccessToken = accessToken;
      user.googleRefreshToken = refreshToken;
      user.googleTokenExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour from now
      if (!user.profilePicture && profile.photos[0]?.value) {
        user.profilePicture = profile.photos[0].value;
      }
      await user.save();
      await user.updateLastLogin();
      return done(null, user);
    }

    // Create new user from Google profile
    user = await User.createFromGoogleProfile(profile, accessToken, refreshToken);
    await user.updateLastLogin();
    
    console.log('New user created:', user.email);
    return done(null, user);
    
  } catch (error) {
    console.error('Google OAuth Error:', error);
    return done(error, null);
  }
}));

// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: '/api/auth/facebook/callback',
  profileFields: ['id', 'emails', 'name', 'picture.type(large)']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Facebook OAuth Profile:', {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName
    });

    // Check if user already exists with this Facebook ID
    let user = await User.findByFacebookId(profile.id);
    
    if (user) {
      // User exists, update last login and return
      await user.updateLastLogin();
      return done(null, user);
    }

    // Check if user exists with same email (different provider)
    const email = profile.emails?.[0]?.value;
    if (email) {
      user = await User.findByEmail(email);
      
      if (user) {
        // User exists with same email but different provider
        // Link the Facebook account to existing user
        user.facebookId = profile.id;
        user.provider = 'facebook';
        user.isEmailVerified = true;
        if (!user.profilePicture && profile.photos?.[0]?.value) {
          user.profilePicture = profile.photos[0].value;
        }
        await user.save();
        await user.updateLastLogin();
        return done(null, user);
      }
    }

    // Create new user from Facebook profile
    user = await User.createFromFacebookProfile(profile);
    await user.updateLastLogin();
    
    console.log('New user created from Facebook:', user.email);
    return done(null, user);
    
  } catch (error) {
    console.error('Facebook OAuth Error:', error);
    return done(error, null);
  }
}));

// JWT Strategy for protecting routes
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  algorithms: ['HS256']
}, async (payload, done) => {
  try {
    // Find user by ID from JWT payload
    const user = await User.findById(payload.id).select('-password');
    
    if (!user) {
      return done(null, false, { message: 'User not found' });
    }

    if (!user.isActive) {
      return done(null, false, { message: 'User account is deactivated' });
    }

    // Check if token is not expired (additional check)
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      return done(null, false, { message: 'Token expired' });
    }

    return done(null, user);
    
  } catch (error) {
    console.error('JWT Strategy Error:', error);
    return done(error, false);
  }
}));

// Serialize user for session (not used in JWT setup, but required by Passport)
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session (not used in JWT setup, but required by Passport)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;