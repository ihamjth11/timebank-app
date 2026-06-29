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

  // Password
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
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
    maxlength: 200
  },

  // Active status
  isActive: {
    type: Boolean,
    default: true
  },

  // Created date
  createdAt: {
    type: Date,
    default: Date.now
  }

})

module.exports = mongoose.model('User', UserSchema)