const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  facebookId: {
    type: String,
    unique: true,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  profilePicture: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['client', 'admin'],
    default: 'client'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  },
  // For local authentication (if needed in future)
  password: {
    type: String,
    select: false // Don't include password in queries by default
  },
  // OAuth provider info
  provider: {
    type: String,
    enum: ['google', 'facebook', 'local'],
    default: 'google'
  },
  // Google OAuth tokens for API access
  googleAccessToken: {
    type: String,
    select: false // Don't include in queries by default for security
  },
  googleRefreshToken: {
    type: String,
    select: false // Don't include in queries by default for security
  },
  googleTokenExpiry: {
    type: Date,
    select: false
  },
  // Google Ads API tokens
  googleAdsAccessToken: {
    type: String,
    select: false // Don't include in queries by default for security
  },
  googleAdsRefreshToken: {
    type: String,
    select: false // Don't include in queries by default for security
  },
  googleAdsTokenExpiry: {
    type: Date,
    select: false
  },
  googleAdsCustomerId: {
    type: String,
    select: false // Google Ads customer ID
  },
  isGoogleAdsConnected: {
    type: Boolean,
    default: false
  },
  // Additional profile information
  locale: {
    type: String,
    default: 'en'
  },
  timezone: {
    type: String,
    default: 'UTC'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ facebookId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password (for local auth)
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified and exists
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password (for local auth)
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by Google ID
userSchema.statics.findByGoogleId = function(googleId) {
  return this.findOne({ googleId });
};

// Static method to find by Facebook ID
userSchema.statics.findByFacebookId = function(facebookId) {
  return this.findOne({ facebookId });
};

// Static method to create from Google profile
userSchema.statics.createFromGoogleProfile = function(profile, accessToken, refreshToken) {
  return this.create({
    googleId: profile.id,
    email: profile.emails[0].value,
    firstName: profile.name.givenName,
    lastName: profile.name.familyName,
    profilePicture: profile.photos[0]?.value,
    provider: 'google',
    isEmailVerified: true, // Google emails are pre-verified
    locale: profile._json.locale || 'en',
    googleAccessToken: accessToken,
    googleRefreshToken: refreshToken,
    googleTokenExpiry: new Date(Date.now() + 3600 * 1000) // 1 hour from now
  });
};

// Static method to create from Facebook profile
userSchema.statics.createFromFacebookProfile = function(profile) {
  const email = profile.emails?.[0]?.value;
  return this.create({
    facebookId: profile.id,
    email: email || `${profile.id}@facebook.local`, // Fallback if no email
    firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User',
    lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
    profilePicture: profile.photos?.[0]?.value,
    provider: 'facebook',
    isEmailVerified: !!email, // Only verified if email is provided
    locale: profile._json?.locale || 'en'
  });
};

// Method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Method to check if user is client
userSchema.methods.isClient = function() {
  return this.role === 'client';
};

// Method to get safe user data (without sensitive info)
userSchema.methods.getSafeUserData = function() {
  return {
    id: this._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    profilePicture: this.profilePicture,
    role: this.role,
    isActive: this.isActive,
    isEmailVerified: this.isEmailVerified,
    lastLogin: this.lastLogin,
    provider: this.provider,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('User', userSchema);