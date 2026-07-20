const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: ['spam', 'harassment', 'inappropriate_content', 'no_show', 'fraud', 'other'],
    required: true
  },
  details: {
    type: String,
    default: '',
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed'],
    default: 'pending'
  }
}, { timestamps: true })

module.exports = mongoose.model('Report', reportSchema)