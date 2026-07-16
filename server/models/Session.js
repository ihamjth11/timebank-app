const mongoose = require('mongoose')

const sessionSchema = new mongoose.Schema({
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  meetingLink: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  completionConfirmedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  helper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  creditsTransferred: {
    type: Boolean,
    default: false
  },
  reminder15Sent: {
    type: Boolean,
    default: false
  },
  reminderStartSent: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

module.exports = mongoose.model('Session', sessionSchema)