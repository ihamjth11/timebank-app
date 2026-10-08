// ===================================
// ESCROWSETTLER.JS — Settles escrow nobody settled
//
// SESSIONS
//  Rule S1: one person confirmed, the other stayed silent for 72 hours
//           -> credit is released to the helper.
//  Rule S2: nobody confirmed and 7 days passed since the session started
//           -> credit is refunded to the payer.
//
// CLASSES (each student's credits are handled on their own)
//  Rule C1: the host marked the class completed and a student stayed silent
//           for 72 hours -> that student's credit is released to the host.
//  Rule C2: the host never marked the class completed and 7 days passed since
//           it started -> every student's held credit is refunded.
//
// Anything with an open dispute is NEVER touched here (an admin decides).
//
// SAFETY SWITCH: this job only moves credits when the environment variable
// ESCROW_AUTO_SETTLE is exactly "true". Otherwise it runs in dry-run mode and
// only logs what it WOULD do.
// ===================================

const Session = require('../models/Session')
const Workshop = require('../models/Workshop')
const Enrollment = require('../models/Enrollment')
const Notification = require('../models/Notification')
const {
  ESCROW_POLICY,
  LedgerError,
  runInTransaction,
  releaseEscrow,
  refundEscrow
} = require('./ledger')
const { releaseEnrollment, refundEnrollment } = require('./enrollmentLedger')

const CHECK_INTERVAL_MS = 5 * 60 * 1000 // every 5 minutes
const BATCH_LIMIT = 50 // items handled per run and rule
const SESSION_UTC_OFFSET = '+05:30' // Sri Lanka time, same offset used for sessions and classes
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

let running = false

function startOf(item) {
  return new Date(`${item.date}T${item.time}:00${SESSION_UTC_OFFSET}`)
}

async function safeNotify(data) {
  try {
    await Notification.create({ fromName: 'TimeBank', read: false, ...data })
  } catch (error) {
    console.error('Auto-settlement notification error:', error)
  }
}

async function notifyBoth(session, { payerText, helperText, type }) {
  await safeNotify({ user: session.payer, type, fromUser: session.helper, text: payerText, link: '/wallet' })
  await safeNotify({ user: session.helper, type, fromUser: session.payer, text: helperText, link: '/wallet' })
}

// Closes a class nobody completed: refunds every undisputed held credit, then closes the
// class itself once nothing is held anymore (completed if somebody already paid, else cancelled).
async function refundAbandonedWorkshop(workshopId) {
  return runInTransaction(async (dbSession) => {
    const workshop = await Workshop.findOne({ _id: workshopId, status: 'upcoming' }).session(dbSession)
    if (!workshop) throw new LedgerError('CLOSED', 'This class was already handled', 409)

    const held = await Enrollment.find({ workshop: workshopId, status: 'held', disputed: { $ne: true } })
      .select('_id attendee amount')
      .session(dbSession)

    const refunded = []
    for (const enrollment of held) {
      await refundEnrollment(enrollment._id, dbSession, { reason: 'auto_timeout' })
      refunded.push({ attendee: String(enrollment.attendee), amount: enrollment.amount })
    }

    const stillHeld = await Enrollment.countDocuments({ workshop: workshopId, status: 'held' }).session(dbSession)
    if (stillHeld === 0) {
      const paid = await Enrollment.countDocuments({ workshop: workshopId, status: 'released' }).session(dbSession)
      await Workshop.updateOne(
        { _id: workshopId, status: 'upcoming' },
        { $set: { status: paid > 0 ? 'completed' : 'cancelled', waitlist: [] } },
        { session: dbSession }
      )
    }

    return { workshop, refunded }
  })
}

async function settleStuckEscrow() {
  if (running) return
  running = true

  try {
    const enabled = process.env.ESCROW_AUTO_SETTLE === 'true'
    const now = Date.now()

    const releaseCutoff = new Date(now - ESCROW_POLICY.AUTO_RELEASE_AFTER_HOURS * HOUR_MS)
    const refundCutoffMs = now - ESCROW_POLICY.AUTO_REFUND_AFTER_DAYS * DAY_MS
    // The date string is only a coarse pre-filter (one day of slack); the exact check is in code.
    const datePrefilter = new Date(refundCutoffMs + DAY_MS).toISOString().slice(0, 10)

    // ---------- Sessions ----------
    const toRelease = await Session.find({
      escrowStatus: 'held',
      status: 'scheduled',
      disputed: { $ne: true },
      firstConfirmedAt: { $ne: null, $lte: releaseCutoff }
    }).limit(BATCH_LIMIT)

    const refundCandidates = await Session.find({
      escrowStatus: 'held',
      status: 'scheduled',
      disputed: { $ne: true },
      firstConfirmedAt: null,
      date: { $lte: datePrefilter }
    }).limit(BATCH_LIMIT)
    const toRefund = refundCandidates.filter(s => startOf(s).getTime() <= refundCutoffMs)

    // ---------- Classes ----------
    const completedWorkshops = await Workshop.find({
      status: 'completed',
      hostCompletedAt: { $ne: null, $lte: releaseCutoff }
    }).select('_id title').limit(BATCH_LIMIT)
    const titleById = new Map(completedWorkshops.map(w => [String(w._id), w.title]))

    const enrollmentsToRelease = completedWorkshops.length > 0
      ? await Enrollment.find({
          workshop: { $in: completedWorkshops.map(w => w._id) },
          status: 'held',
          disputed: { $ne: true }
        }).limit(BATCH_LIMIT * 2)
      : []

    const staleCandidates = await Workshop.find({ status: 'upcoming', date: { $lte: datePrefilter } })
      .select('_id date time title host')
      .sort({ date: 1 })
      .limit(BATCH_LIMIT)
    const staleWorkshops = staleCandidates.filter(w => startOf(w).getTime() <= refundCutoffMs)

    if (!enabled) {
      const total = toRelease.length + toRefund.length + enrollmentsToRelease.length + staleWorkshops.length
      if (total > 0) {
        console.log(
          `[escrow-settler] DRY RUN (ESCROW_AUTO_SETTLE is not "true"): sessions release ${toRelease.length}, refund ${toRefund.length}; class credits release ${enrollmentsToRelease.length}, abandoned classes ${staleWorkshops.length}`
        )
      }
      return
    }

    // ----- Rule S1 -----
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
        console.error(`[escrow-settler] session release failed for ${candidate._id}:`, error)
      }
    }

    // ----- Rule S2 -----
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
        console.error(`[escrow-settler] session refund failed for ${candidate._id}:`, error)
      }
    }

    // ----- Rule C1 -----
    for (const candidate of enrollmentsToRelease) {
      try {
        const settled = await runInTransaction((dbSession) =>
          releaseEnrollment(candidate._id, dbSession, { reason: 'auto_timeout' })
        )
        const title = titleById.get(String(settled.workshop)) || 'your class'
        await safeNotify({
          user: settled.attendee,
          type: 'session_completed',
          fromUser: settled.host,
          text: `Your held credit for "${title}" was released to the host automatically, because the class was completed and no problem was reported in time.`,
          link: '/wallet'
        })
        await safeNotify({
          user: settled.host,
          type: 'session_completed',
          fromUser: settled.attendee,
          text: `A student did not respond in time, so you received ${settled.amount} Time Credit${settled.amount > 1 ? 's' : ''} for "${title}".`,
          link: '/wallet'
        })
        console.log(`[escrow-settler] auto-released class enrollment ${settled._id}`)
      } catch (error) {
        if (error instanceof LedgerError) continue
        console.error(`[escrow-settler] class release failed for ${candidate._id}:`, error)
      }
    }

    // ----- Rule C2 -----
    for (const candidate of staleWorkshops) {
      try {
        const { workshop, refunded } = await refundAbandonedWorkshop(candidate._id)
        for (const item of refunded) {
          await safeNotify({
            user: item.attendee,
            type: 'session_cancelled',
            fromUser: workshop.host,
            text: `"${workshop.title}" was never marked as completed within ${ESCROW_POLICY.AUTO_REFUND_AFTER_DAYS} days, so your ${item.amount} held credit${item.amount > 1 ? 's were' : ' was'} refunded.`,
            link: '/wallet'
          })
        }
        if (refunded.length > 0) {
          await safeNotify({
            user: workshop.host,
            type: 'session_cancelled',
            fromUser: workshop.host,
            text: `"${workshop.title}" was not marked as completed within ${ESCROW_POLICY.AUTO_REFUND_AFTER_DAYS} days, so the held credits of ${refunded.length} student${refunded.length > 1 ? 's were' : ' was'} refunded.`,
            link: '/workshops'
          })
        }
        console.log(`[escrow-settler] closed abandoned class ${workshop._id}, refunded ${refunded.length}`)
      } catch (error) {
        if (error instanceof LedgerError) continue
        console.error(`[escrow-settler] abandoned class failed for ${candidate._id}:`, error)
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