// ===================================
// ESCROWSETTLER.JS — Settles escrow nobody settled
//
// Rule 1: one person confirmed, the other stayed silent for 72 hours
//         -> credit is released to the helper.
// Rule 2: nobody confirmed and 7 days passed since the session started
//         -> credit is refunded to the payer.
// Sessions with an open dispute are NEVER touched here (an admin decides).
//
// SAFETY SWITCH: this job only moves credits when the environment variable
// ESCROW_AUTO_SETTLE is exactly "true". Otherwise it runs in dry-run mode and
// only logs what it WOULD do.
// ===================================

const Session = require('../models/Session')
const Notification = require('../models/Notification')
const {
  ESCROW_POLICY,
  LedgerError,
  runInTransaction,
  releaseEscrow,
  refundEscrow
} = require('./ledger')

const CHECK_INTERVAL_MS = 5 * 60 * 1000 // every 5 minutes
const BATCH_LIMIT = 50 // sessions handled per run
const SESSION_UTC_OFFSET = '+05:30' // Sri Lanka time, same offset used for sessions

let running = false

function sessionStart(session) {
  return new Date(`${session.date}T${session.time}:00${SESSION_UTC_OFFSET}`)
}

async function notifyBoth(session, { payerText, helperText, type }) {
  try {
    await Notification.create({
      user: session.payer,
      type,
      fromUser: session.helper,
      fromName: 'TimeBank',
      text: payerText,
      link: '/wallet',
      read: false
    })
    await Notification.create({
      user: session.helper,
      type,
      fromUser: session.payer,
      fromName: 'TimeBank',
      text: helperText,
      link: '/wallet',
      read: false
    })
  } catch (error) {
    console.error('Auto-settlement notification error:', error)
  }
}

async function settleStuckEscrow() {
  if (running) return
  running = true

  try {
    const enabled = process.env.ESCROW_AUTO_SETTLE === 'true'
    const now = Date.now()

    // Rule 1 candidates: first confirmation is older than the grace period
    const releaseCutoff = new Date(now - ESCROW_POLICY.AUTO_RELEASE_AFTER_HOURS * 60 * 60 * 1000)
    const toRelease = await Session.find({
      escrowStatus: 'held',
      status: 'scheduled',
      disputed: { $ne: true },
      firstConfirmedAt: { $ne: null, $lte: releaseCutoff }
    }).limit(BATCH_LIMIT)

    // Rule 2 candidates: nobody confirmed, session started long ago.
    // The date string is only a coarse pre-filter (one day of slack); the exact check is below.
    const refundCutoffMs = now - ESCROW_POLICY.AUTO_REFUND_AFTER_DAYS * 24 * 60 * 60 * 1000
    const datePrefilter = new Date(refundCutoffMs + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const refundCandidates = await Session.find({
      escrowStatus: 'held',
      status: 'scheduled',
      disputed: { $ne: true },
      firstConfirmedAt: null,
      date: { $lte: datePrefilter }
    }).limit(BATCH_LIMIT)
    const toRefund = refundCandidates.filter(s => sessionStart(s).getTime() <= refundCutoffMs)

    if (!enabled) {
      if (toRelease.length > 0 || toRefund.length > 0) {
        console.log(
          `[escrow-settler] DRY RUN (ESCROW_AUTO_SETTLE is not "true"): would release ${toRelease.length} and refund ${toRefund.length} session(s)`
        )
      }
      return
    }

    for (const candidate of toRelease) {
      try {
        const settled = await runInTransaction((dbSession) =>
          releaseEscrow(candidate._id, dbSession, { reason: 'auto_timeout' })
        )
        await notifyBoth(settled, {
          type: 'session_completed',
          payerText: 'The escrowed credit was released to the helper automatically, because the session was confirmed and no problem was reported in time.',
          helperText: `The session was confirmed and no problem was reported in time, so you received ${settled.escrowAmount} Time Credit${settled.escrowAmount > 1 ? 's' : ''}.`
        })
        console.log(`[escrow-settler] auto-released session ${settled._id}`)
      } catch (error) {
        // Already settled, disputed, or cancelled in the meantime: nothing to do
        if (error instanceof LedgerError) continue
        console.error(`[escrow-settler] release failed for ${candidate._id}:`, error)
      }
    }

    for (const candidate of toRefund) {
      try {
        const settled = await runInTransaction((dbSession) =>
          refundEscrow(candidate._id, dbSession, { reason: 'auto_timeout' })
        )
        await notifyBoth(settled, {
          type: 'session_cancelled',
          payerText: `Nobody confirmed the session within ${ESCROW_POLICY.AUTO_REFUND_AFTER_DAYS} days, so your escrowed credit was refunded.`,
          helperText: `Nobody confirmed the session within ${ESCROW_POLICY.AUTO_REFUND_AFTER_DAYS} days, so the escrowed credit was returned to the person who booked it.`
        })
        console.log(`[escrow-settler] auto-refunded session ${settled._id}`)
      } catch (error) {
        if (error instanceof LedgerError) continue
        console.error(`[escrow-settler] refund failed for ${candidate._id}:`, error)
      }
    }
  } catch (error) {
    console.error('[escrow-settler] run failed:', error)
  } finally {
    running = false
  }
}

function startEscrowSettler() {
  const enabled = process.env.ESCROW_AUTO_SETTLE === 'true'
  console.log(
    enabled
      ? '✅ Escrow auto-settlement is ON (checks every 5 minutes)'
      : 'ℹ️ Escrow auto-settlement is OFF (dry run). Set ESCROW_AUTO_SETTLE=true to enable it.'
  )
  settleStuckEscrow()
  setInterval(settleStuckEscrow, CHECK_INTERVAL_MS)
}

module.exports = { startEscrowSettler }