// ===================================
// LEDGERENTRY.JS — Append-only record of every credit movement
// One row per balance change. Rows are never edited or deleted by the app.
// ===================================

const mongoose = require('mongoose')

const ENTRY_TYPES = [
  'escrow_hold', // payer balance debited when a session is booked
  'escrow_release', // helper balance credited when both sides confirm
  'escrow_refund', // payer balance credited back when a session is cancelled
  'session_settlement' // legacy sessions (booked before escrow existed)
]

const ledgerEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true, index: true },
    type: { type: String, enum: ENTRY_TYPES, required: true, immutable: true },
    direction: { type: String, enum: ['debit', 'credit'], required: true, immutable: true },
    amount: { type: Number, required: true, min: 1, immutable: true },
    balanceAfter: { type: Number, required: true, immutable: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, immutable: true, index: true },
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