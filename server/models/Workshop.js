const mongoose = require('mongoose')

const workshopSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'Other'
  },
  date: {
    type: String, // "YYYY-MM-DD"
    required: true
  },
  time: {
    type: String, // "HH:MM"
    required: true
  },
  durationMinutes: {
    type: Number,
    default: 60
  },
  meetingLink: {
    type: String,
    default: ''
  },
  capacity: {
    type: Number,
    default: 10,
    min: 1,
    max: 100
  },
  creditsPerPerson: {
    type: Number,
    default: 1,
    min: 1
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  waitlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  creditsSettled: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

module.exports = mongoose.model('Workshop', workshopSchema)