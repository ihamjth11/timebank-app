// ===================================
// LEDGER.JS — Atomic credit movements
//
// Rules this file enforces:
// 1. A balance never goes below zero: the balance check and the deduction are
//    ONE atomic database operation (no read-then-write gap).
// 2. Every balance change writes an append-only LedgerEntry.
// 3. Every operation has a unique idempotency key, so it cannot be applied twice.
// 4. A session's escrow moves through a one-way state machine
//    (held -> released OR held -> refunded) guarded by conditional updates.
// 5. All steps of one operation run inside ONE MongoDB transaction:
//    either everything is saved, or nothing is.
// ===================================

const mongoose = require('mongoose')
const User = require('../models/User')
const Session = require('../models/Session')
const Transaction = require('../models/Transaction')
const LedgerEntry = require('../models/LedgerEntry')

class LedgerError extends Error {
  constructor(code, message, status = 400) {
    super(message)
    this.name = 'LedgerError'
    this.code = code
    this.status = status
  }
}

function assertAmount(amount) {
  if (!Number.isInteger(amount) || amount < 1) {
    throw new LedgerError('INVALID_AMOUNT', 'Invalid credit amount', 400)
  }
}

// Runs `work(dbSession)` inside a transaction. Transient conflicts are retried
// automatically by MongoDB's withTransaction helper.
async function runInTransaction(work) {
  const dbSession = await mongoose.startSession()
  try {
    let result
    await dbSession.withTransaction(async () => {
      result = await work(dbSession)
    })
    return result
  } finally {
    await dbSession.endSession()
  }
}

async function writeEntry(entry, dbSession) {
  try {
    await LedgerEntry.create([entry], { session: dbSession })
  } catch (error) {
    if (error && error.code === 11000) {
      throw new LedgerError('DUPLICATE_OPERATION', 'This operation was already processed', 409)
    }
    throw error
  }
}

// Removes credits from a user. Fails if the balance is too low or the account is suspended.
// Returns the new balance.
async function debitUser({ userId, amount, type, sessionId, counterpartyId, key, insufficientMessage }, dbSession) {
  assertAmount(amount)

  const updated = await User.findOneAndUpdate(
    { _id: userId, isActive: { $ne: false }, timeCredits: { $gte: amount } },
    { $inc: { timeCredits: -amount } },
    { new: true, session: dbSession }
  ).select('timeCredits')

  if (!updated) {
    const account = await User.findById(userId).select('isActive').session(dbSession)
    if (!account) throw new LedgerError('USER_NOT_FOUND', 'User not found', 404)
    if (account.isActive === false) throw new LedgerError('ACCOUNT_SUSPENDED', 'This account is suspended', 403)
    throw new LedgerError('INSUFFICIENT_FUNDS', insufficientMessage || 'Not enough Time Credits', 400)
  }

  await writeEntry({
    user: userId,
    type,
    direction: 'debit',
    amount,
    balanceAfter: updated.timeCredits,
    session: sessionId,
    counterparty: counterpartyId || null,
    idempotencyKey: key
  }, dbSession)

  return updated.timeCredits
}

// Adds credits to a user. Returns the new balance.
async function creditUser({ userId, amount, type, sessionId, counterpartyId, key }, dbSession) {
  assertAmount(amount)

  const updated = await User.findOneAndUpdate(
    { _id: userId },
    { $inc: { timeCredits: amount } },
    { new: true, session: dbSession }
  ).select('timeCredits')

  if (!updated) throw new LedgerError('USER_NOT_FOUND', 'User not found', 404)

  await writeEntry({
    user: userId,
    type,
    direction: 'credit',
    amount,
    balanceAfter: updated.timeCredits,
    session: sessionId,
    counterparty: counterpartyId || null,
    idempotencyKey: key
  }, dbSession)

  return updated.timeCredits
}

// held -> released: pays the helper. Only one caller can ever win this transition.
async function releaseEscrow(sessionId, dbSession) {
  const session = await Session.findOneAndUpdate(
    { _id: sessionId, escrowStatus: 'held', status: 'scheduled' },
    { $set: { escrowStatus: 'released', status: 'completed', creditsTransferred: true, completedAt: new Date() } },
    { new: true, session: dbSession }
  )
  if (!session) throw new LedgerError('NOT_RELEASABLE', 'This session has already been settled', 409)

  await creditUser({
    userId: session.helper,
    amount: session.escrowAmount,
    type: 'escrow_release',
    sessionId: session._id,
    counterpartyId: session.payer,
    key: `release:${session._id}`
  }, dbSession)

  // Keeps the wallet history working exactly as before
  await Transaction.create([{
    from: session.payer,
    to: session.helper,
    session: session._id,
    amount: session.escrowAmount
  }], { session: dbSession })

  return session
}

// held -> refunded: gives the held credits back to the payer.
async function refundEscrow(sessionId, dbSession) {
  const session = await Session.findOneAndUpdate(
    { _id: sessionId, escrowStatus: 'held', status: 'scheduled' },
    { $set: { escrowStatus: 'refunded', status: 'cancelled' } },
    { new: true, session: dbSession }
  )
  if (!session) throw new LedgerError('NOT_REFUNDABLE', 'This session can no longer be refunded', 409)

  await creditUser({
    userId: session.payer,
    amount: session.escrowAmount,
    type: 'escrow_refund',
    sessionId: session._id,
    counterpartyId: session.helper,
    key: `refund:${session._id}`
  }, dbSession)

  return session
}

// Sessions booked before escrow existed: credits move at completion (1 credit).
// Same safety rules as above (no negative balance, no double settlement).
async function settleLegacySession(sessionId, helperId, payerId, dbSession) {
  const session = await Session.findOneAndUpdate(
    { _id: sessionId, status: 'scheduled', escrowStatus: 'none', creditsTransferred: false },
    { $set: { status: 'completed', creditsTransferred: true, completedAt: new Date(), payer: payerId, helper: helperId } },
    { new: true, session: dbSession }
  )
  if (!session) throw new LedgerError('NOT_RELEASABLE', 'This session has already been settled', 409)

  await debitUser({
    userId: payerId,
    amount: 1,
    type: 'session_settlement',
    sessionId: session._id,
    counterpartyId: helperId,
    key: `settle-debit:${session._id}`,
    insufficientMessage: 'The person receiving help does not have enough Time Credits to complete this session'
  }, dbSession)

  await creditUser({
    userId: helperId,
    amount: 1,
    type: 'session_settlement',
    sessionId: session._id,
    counterpartyId: payerId,
    key: `settle-credit:${session._id}`
  }, dbSession)

  await Transaction.create([{
    from: payerId,
    to: helperId,
    session: session._id,
    amount: 1
  }], { session: dbSession })

  return session
}

module.exports = {
  LedgerError,
  runInTransaction,
  debitUser,
  creditUser,
  releaseEscrow,
  refundEscrow,
  settleLegacySession
}