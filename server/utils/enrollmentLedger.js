// ===================================
// ENROLLMENTLEDGER.JS — Escrow for classes (one hold per student)
//
// Same rules as utils/ledger.js:
// - the balance check and deduction are one atomic operation
// - every movement writes an append-only ledger entry with a unique key
// - held -> released OR held -> refunded, one way, guarded by conditional updates
// Call these inside runInTransaction(...).
// ===================================

const Enrollment = require('../models/Enrollment')
const Transaction = require('../models/Transaction')
const { LedgerError, debitUser, creditUser } = require('./ledger')

// Takes the student's credits into escrow when they get a seat.
async function holdEnrollment({ workshop, attendeeId }, dbSession) {
  const amount = workshop.creditsPerPerson

  const enrollment = new Enrollment({
    workshop: workshop._id,
    attendee: attendeeId,
    host: workshop.host,
    amount,
    status: 'held'
  })

  const balanceAfter = await debitUser({
    userId: attendeeId,
    amount,
    type: 'class_hold',
    enrollmentId: enrollment._id,
    counterpartyId: workshop.host,
    key: `class-hold:${enrollment._id}`,
    insufficientMessage: `You need ${amount} Time Credit${amount > 1 ? 's' : ''} to join this class, but your balance is too low.`
  }, dbSession)

  await enrollment.save({ session: dbSession })
  return { enrollment, balanceAfter }
}

// held -> released: pays the host. A disputed enrollment needs allowDisputed (admin decision).
async function releaseEnrollment(enrollmentId, dbSession, { reason = 'attendee_confirmation', allowDisputed = false } = {}) {
  const filter = { _id: enrollmentId, status: 'held' }
  if (!allowDisputed) filter.disputed = { $ne: true }

  const now = new Date()
  const set = { status: 'released', settledAt: now, settlementReason: reason }
  if (reason === 'attendee_confirmation') set.confirmedAt = now

  const enrollment = await Enrollment.findOneAndUpdate(filter, { $set: set }, { new: true, session: dbSession })
  if (!enrollment) throw new LedgerError('NOT_RELEASABLE', 'This enrollment has already been settled or is under dispute', 409)

  await creditUser({
    userId: enrollment.host,
    amount: enrollment.amount,
    type: 'class_release',
    enrollmentId: enrollment._id,
    counterpartyId: enrollment.attendee,
    key: `class-release:${enrollment._id}`
  }, dbSession)

  // Keeps the wallet history working
  await Transaction.create([{
    from: enrollment.attendee,
    to: enrollment.host,
    amount: enrollment.amount
  }], { session: dbSession })

  return enrollment
}

// held -> refunded: gives the credits back to the student.
async function refundEnrollment(enrollmentId, dbSession, { reason = 'cancelled', allowDisputed = false } = {}) {
  const filter = { _id: enrollmentId, status: 'held' }
  if (!allowDisputed) filter.disputed = { $ne: true }

  const enrollment = await Enrollment.findOneAndUpdate(
    filter,
    { $set: { status: 'refunded', settledAt: new Date(), settlementReason: reason } },
    { new: true, session: dbSession }
  )
  if (!enrollment) throw new LedgerError('NOT_REFUNDABLE', 'This enrollment can no longer be refunded or is under dispute', 409)

  await creditUser({
    userId: enrollment.attendee,
    amount: enrollment.amount,
    type: 'class_refund',
    enrollmentId: enrollment._id,
    counterpartyId: enrollment.host,
    key: `class-refund:${enrollment._id}`
  }, dbSession)

  return enrollment
}

module.exports = { holdEnrollment, releaseEnrollment, refundEnrollment }