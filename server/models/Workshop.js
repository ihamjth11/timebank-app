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
    trim: true,
    maxlength: 120
  },
  description: {
    type: String,
    default: '',
    maxlength: 2000
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
  // The roster. Each attendee also has an Enrollment record holding their escrow.
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  waitlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // upcoming  = open (also while it is running, until the host marks it completed)
  // completed = host said the class was held; students confirm to release their credits
  // cancelled = host cancelled; all held credits were refunded
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  // Old field from before escrow. Kept so older classes still load.
  creditsSettled: {
    type: Boolean,
    default: false
  },
  // When the host marked the class as completed
  hostCompletedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true })

module.exports = mongoose.model('Workshop', workshopSchema)