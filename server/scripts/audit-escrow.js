// ===================================
// AUDIT-ESCROW.JS — Read-only integrity check for escrowed credits
//
// Run from the server folder:
//   node scripts/audit-escrow.js
//
// It checks that the credits currently held in escrow match the ledger,
// for sessions and for classes:
//   held now = (all holds) - (all releases) - (all refunds)
// It never writes to the database.
// ===================================

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const Session = require('../models/Session')
const Enrollment = require('../models/Enrollment')
const LedgerEntry = require('../models/LedgerEntry')
const User = require('../models/User')

async function sumEntries(match) {
  const rows = await LedgerEntry.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ])
  return { total: rows[0]?.total || 0, count: rows[0]?.count || 0 }
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing in server/.env')
  await mongoose.connect(process.env.MONGO_URI)

  let failed = false
  const check = (label, ok, detail) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` (${detail})` : ''}`)
    if (!ok) failed = true
  }

  // ---------- Sessions ----------
  const holds = await sumEntries({ type: 'escrow_hold' })
  const releases = await sumEntries({ type: 'escrow_release' })
  const refunds = await sumEntries({ type: 'escrow_refund' })

  const heldRows = await Session.aggregate([
    { $match: { escrowStatus: 'held' } },
    { $group: { _id: null, total: { $sum: '$escrowAmount' }, count: { $sum: 1 } } }
  ])
  const heldNow = heldRows[0]?.total || 0
  const heldSessions = heldRows[0]?.count || 0

  const expectedHeld = holds.total - releases.total - refunds.total
  check(
    'Session credits held in escrow match the ledger',
    heldNow === expectedHeld,
    `sessions say ${heldNow}, ledger says ${expectedHeld}`
  )

  const releasedSessions = await Session.countDocuments({ escrowStatus: 'released' })
  check(
    'Every released session has exactly one release entry',
    releasedSessions === releases.count,
    `${releasedSessions} released sessions, ${releases.count} release entries`
  )

  const legacyDebits = await sumEntries({ type: 'session_settlement', direction: 'debit' })
  const legacyCredits = await sumEntries({ type: 'session_settlement', direction: 'credit' })
  check(
    'Legacy settlements are balanced',
    legacyDebits.total === legacyCredits.total,
    `debits ${legacyDebits.total}, credits ${legacyCredits.total}`
  )

  // ---------- Classes ----------
  const classHolds = await sumEntries({ type: 'class_hold' })
  const classReleases = await sumEntries({ type: 'class_release' })
  const classRefunds = await sumEntries({ type: 'class_refund' })

  const classHeldRows = await Enrollment.aggregate([
    { $match: { status: 'held' } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ])
  const classHeldNow = classHeldRows[0]?.total || 0
  const classHeldCount = classHeldRows[0]?.count || 0

  const classExpectedHeld = classHolds.total - classReleases.total - classRefunds.total
  check(
    'Class credits held in escrow match the ledger',
    classHeldNow === classExpectedHeld,
    `enrollments say ${classHeldNow}, ledger says ${classExpectedHeld}`
  )

  const releasedEnrollments = await Enrollment.countDocuments({ status: 'released' })
  check(
    'Every released enrollment has exactly one class release entry',
    releasedEnrollments === classReleases.count,
    `${releasedEnrollments} released enrollments, ${classReleases.count} release entries`
  )

  const refundedEnrollments = await Enrollment.countDocuments({ status: 'refunded' })
  check(
    'Every refunded enrollment has exactly one class refund entry',
    refundedEnrollments === classRefunds.count,
    `${refundedEnrollments} refunded enrollments, ${classRefunds.count} refund entries`
  )

  // ---------- Balances ----------
  const negativeLedgerBalances = await LedgerEntry.countDocuments({ balanceAfter: { $lt: 0 } })
  check('No ledger entry ever left a negative balance', negativeLedgerBalances === 0, `${negativeLedgerBalances} found`)

  const negativeUsers = await User.countDocuments({ timeCredits: { $lt: 0 } })
  if (negativeUsers > 0) {
    console.log(`WARN  ${negativeUsers} user(s) currently have a negative balance (likely from before the ledger existed)`)
  }

  console.log('')
  console.log(`Sessions: ${heldSessions} in escrow holding ${heldNow} credit(s). Ledger: holds ${holds.total}, releases ${releases.total}, refunds ${refunds.total}`)
  console.log(`Classes: ${classHeldCount} enrollment(s) in escrow holding ${classHeldNow} credit(s). Ledger: holds ${classHolds.total}, releases ${classReleases.total}, refunds ${classRefunds.total}`)
  console.log(failed ? 'RESULT: PROBLEM FOUND' : 'RESULT: ALL CHECKS PASSED')

  await mongoose.disconnect()
  process.exit(failed ? 1 : 0)
}

main().catch(async (error) => {
  console.error('Audit failed to run:', error.message)
  try { await mongoose.disconnect() } catch (e) { /* ignore */ }
  process.exit(2)
})