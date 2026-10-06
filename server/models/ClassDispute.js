const mongoose = require('mongoose')

// A student reports a problem with a class. Only THEIR escrowed credits are frozen;
// the other students in the class are not affected.
const classDisputeSchema = new mongoose.Schema({
  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Snapshot of the money at the time the dispute was opened
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000
  },
  // The host's side of the story (optional)
  response: {
    type: String,
    default: '',
    trim: true,
    maxlength: 1000
  },
  respondedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['open', 'resolved'],
    default: 'open'
  },
  // release = credits go to the host, refund = credits go back to the student
  decision: {
    type: String,
    enum: ['release', 'refund', null],
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolutionNote: {
    type: String,
    default: '',
    trim: true,
    maxlength: 1000
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true })

// Only ONE open dispute per enrollment
classDisputeSchema.index({ enrollment: 1 }, { unique: true, partialFilterExpression: { status: 'open' } })
classDisputeSchema.index({ status: 1, createdAt: -1 })
classDisputeSchema.index({ student: 1 })
classDisputeSchema.index({ host: 1 })
classDisputeSchema.index({ workshop: 1 })

module.exports = mongoose.model('ClassDispute', classDisputeSchema)