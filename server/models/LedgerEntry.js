// ===================================
// LEDGERENTRY.JS — Append-only record of every credit movement
// One row per balance change. Rows are never edited or deleted by the app.
// ===================================

const mongoose = require('mongoose')

const ENTRY_TYPES = [
  'escrow_hold', // session: payer balance debited when a session is booked
  'escrow_release', // session: helper balance credited when both sides confirm
  'escrow_refund', // session: payer balance credited back when a session is cancelled
  'session_settlement', // legacy sessions (booked before escrow existed)
  'class_hold', // class: student balance debited when joining a class
  'class_release', // class: host balance credited when the student confirms
  'class_refund' // class: student balance credited back
]

const ledgerEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true, index: true },
    type: { type: String, enum: ENTRY_TYPES, required: true, immutable: true },
    direction: { type: String, enum: ['debit', 'credit'], required: true, immutable: true },
    amount: { type: Number, required: true, min: 1, immutable: true },
    balanceAfter: { type: Number, required: true, immutable: true },
    // Every entry points to a session OR to a class enrollment
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      immutable: true,
      index: true,
      required: function () { return !this.enrollment }
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      immutable: true,
      index: true
    },
    counterparty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, immutable: true },
    // Unique per operation, so the same movement can never be applied twice
    idempotencyKey: { type: String, required: true, unique: true, immutable: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// Application-level guard: block every update/delete path Mongoose exposes.
// (This does not stop someone with direct database access, only bugs and misuse in the app.)
const blockMutation = function (next) {
  next(new Error('Ledger entries are append-only'))
}

ledgerEntrySchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndReplace', 'replaceOne', 'deleteOne', 'deleteMany', 'findOneAndDelete'],
  blockMutation
)
ledgerEntrySchema.pre('deleteOne', { document: true, query: false }, blockMutation)
ledgerEntrySchema.pre('save', function (next) {
  if (!this.isNew) return next(new Error('Ledger entries are append-only'))
  next()
})

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema)