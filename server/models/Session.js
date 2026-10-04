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
  },

  // ---- Escrow ----
  // The person who booked (and pays). Null for sessions created before escrow existed.
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Credits held for this session while it is scheduled
  escrowAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  // none     = legacy session (credits move at completion, no hold)
  // held     = credits are held, waiting for confirmation
  // released = credits were paid to the helper
  // refunded = session was cancelled and the payer got the credits back
  escrowStatus: {
    type: String,
    enum: ['none', 'held', 'released', 'refunded'],
    default: 'none'
  },
  completedAt: {
    type: Date,
    default: null
  },

  // When the FIRST of the two people confirmed. Starts the auto-release timer.
  firstConfirmedAt: {
    type: Date,
    default: null
  },
  // True while a dispute is open. Freezes confirmations, cancellation and auto-settlement.
  disputed: {
    type: Boolean,
    default: false
  },
  // Why the escrow was settled (audit trail)
  settlementReason: {
    type: String,
    enum: ['mutual_confirmation', 'auto_timeout', 'admin_decision', 'cancelled', null],
    default: null
  }
}, { timestamps: true })

sessionSchema.index({ escrowStatus: 1 })
sessionSchema.index({ escrowStatus: 1, firstConfirmedAt: 1 })
sessionSchema.index({ organizer: 1, participant: 1 })

module.exports = mongoose.model('Session', sessionSchema)