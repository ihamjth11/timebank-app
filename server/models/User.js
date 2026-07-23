// ===================================
// USER.JS — User Database Schema
// ===================================

const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({

  // name
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },

  // Email
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },

  // Password — Google users-ku required illa
  password: {
    type: String,
    minlength: 6
  },

  // Google OAuth ID — Google vachi login pannina users-ku mattum
  googleId: {
    type: String,
    default: null
  },

  // Time Credits — default 5 credits kedaikum join panrapa
  timeCredits: {
    type: Number,
    default: 5
  },

  // Skills — user-skills list
  skills: [{
    type: String,
    trim: true
  }],

  // Profile photo
  avatar: {
    type: String,
    default: ''
  },

  // Location
  location: {
    type: String,
    default: 'Sri Lanka'
  },

  // Bio
  bio: {
    type: String,
    default: '',
    maxlength: 800
  },

  // Active status
  isActive: {
    type: Boolean,
    default: true
  },

  // Brute-force login protection
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },

  // Unique code this user can share to invite friends
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },

  // Which user (if any) referred this user during signup
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // How many people this user has successfully referred
  referralCount: {
    type: Number,
    default: 0
  },

  // Users this account has blocked — hides them from feeds/messages
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Grants access to the moderation/admin dashboard
  isAdmin: {
    type: Boolean,
    default: false
  },

  // Created date
  createdAt: {
    type: Date,
    default: Date.now
  }

})

module.exports = mongoose.model('User', UserSchema)