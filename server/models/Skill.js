const mongoose = require('mongoose')

const SkillSchema = new mongoose.Schema({

  // Who posted this skill
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  userName: {
    type: String,
    required: true
  },

  // Skill title
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 80
  },

  // Description
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: 500
  },

  // Category
  category: {
    type: String,
    required: true,
    enum: [
      'Technology',
      'Design',
      'Education',
      'Cooking',
      'Music',
      'Language',
      'Business',
      'Health',
      'Other'
    ]
  },

  // Type — offering or requesting
  type: {
    type: String,
    enum: ['offer', 'request'],
    required: true
  },

  // Credits per hour
  credits: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },

  // Location
  location: {
    type: String,
    default: 'Online'
  },

  // Tags
  tags: [{
    type: String,
    trim: true
  }],

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Views count
  views: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Skill', SkillSchema)