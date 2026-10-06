const mongoose = require('mongoose')

// One record per student per class. It tracks the student's escrowed credits.
const enrollmentSchema = new mongoose.Schema({
  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true
  },
  attendee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Snapshot of the host at join time
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  // held     = credits are in escrow
  // released = credits were paid to the host
  // refunded = credits went back to the student
  status: {
    type: String,
    enum: ['held', 'released', 'refunded'],
    default: 'held'
  },
  confirmedAt: {
    type: Date,
    default: null
  },
  // True while a dispute is open (freezes this student's credits)
  disputed: {
    type: Boolean,
    default: false
  },
  settlementReason: {
    type: String,
    enum: ['attendee_confirmation', 'auto_timeout', 'admin_decision', 'cancelled', null],
    default: null
  },
  settledAt: {
    type: Date,
    default: null
  }
}, { timestamps: true })

// A student can only have ONE held enrollment per class at a time
// (after leaving and refunded, they may join again).
enrollmentSchema.index({ workshop: 1, attendee: 1 }, { unique: true, partialFilterExpression: { status: 'held' } })
enrollmentSchema.index({ status: 1 })
enrollmentSchema.index({ attendee: 1, status: 1 })
enrollmentSchema.index({ workshop: 1, status: 1 })

module.exports = mongoose.model('Enrollment', enrollmentSchema)