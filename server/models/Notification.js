const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['message', 'session_scheduled', 'session_completed', 'session_reminder', 'session_starting', 'session_cancelled'],
    required: true
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fromName: {
    type: String,
    default: ''
  },
  text: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: '/messages'
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

module.exports = mongoose.model('Notification', notificationSchema)