const mongoose = require('mongoose')

const disputeSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  openedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Snapshot of the money at the time the dispute was opened
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  helper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  // The other person's side of the story (optional, one text)
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
  // release = credit goes to the helper, refund = credit goes back to the payer
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

// Only ONE open dispute per session (resolved ones do not count)
disputeSchema.index({ session: 1 }, { unique: true, partialFilterExpression: { status: 'open' } })
disputeSchema.index({ status: 1, createdAt: -1 })
disputeSchema.index({ payer: 1 })
disputeSchema.index({ helper: 1 })

module.exports = mongoose.model('Dispute', disputeSchema)