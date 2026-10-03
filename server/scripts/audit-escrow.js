// ===================================
// AUDIT-ESCROW.JS — Read-only integrity check for escrowed credits
//
// Run from the server folder:
//   node scripts/audit-escrow.js
//
// It checks that the credits currently held in escrow match the ledger:
//   held now = (all holds) - (all releases) - (all refunds)
// It never writes to the database.
// ===================================

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const Session = require('../models/Session')
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
    'Credits held in escrow match the ledger',
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

  const negativeLedgerBalances = await LedgerEntry.countDocuments({ balanceAfter: { $lt: 0 } })
  check('No ledger entry ever left a negative balance', negativeLedgerBalances === 0, `${negativeLedgerBalances} found`)

  const negativeUsers = await User.countDocuments({ timeCredits: { $lt: 0 } })
  if (negativeUsers > 0) {
    console.log(`WARN  ${negativeUsers} user(s) currently have a negative balance (likely from before the ledger existed)`)
  }

  console.log('')
  console.log(`Summary: ${heldSessions} session(s) in escrow holding ${heldNow} credit(s) in total`)
  console.log(`Ledger totals: holds ${holds.total}, releases ${releases.total}, refunds ${refunds.total}`)
  console.log(failed ? 'RESULT: PROBLEM FOUND' : 'RESULT: ALL CHECKS PASSED')

  await mongoose.disconnect()
  process.exit(failed ? 1 : 0)
}

main().catch(async (error) => {
  console.error('Audit failed to run:', error.message)
  try { await mongoose.disconnect() } catch (e) { /* ignore */ }
  process.exit(2)
})