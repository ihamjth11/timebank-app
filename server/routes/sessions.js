// ===================================
// SESSIONS.JS — Booking, escrow, completion
//
// Money rules (see utils/ledger.js):
// - The person who books is the payer. Their credit is HELD at booking time.
// - Credits are released to the helper only when BOTH people confirm.
// - Cancelling a scheduled session refunds the held credit in full.
// - Booking requires both people to have sent at least one message (chat gate).
// ===================================

const express = require('express')
const mongoose = require('mongoose')
const rateLimit = require('express-rate-limit')
const jwt = require('jsonwebtoken')
const router = express.Router()
const Session = require('../models/Session')
const User = require('../models/User')
const Message = require('../models/Message')
const Notification = require('../models/Notification')
const {
  LedgerError,
  runInTransaction,
  debitUser,
  releaseEscrow,
  refundEscrow,
  settleLegacySession
} = require('../utils/ledger')

const SESSION_PRICE_CREDITS = 1 // credits per session (fixed for now)
const MAX_OCCURRENCES = 12
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const SESSION_UTC_OFFSET = '+05:30' // Sri Lanka time, same offset the client calendar link uses

// ---------- Auth ----------
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ success: false, message: 'No token' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (!isValidId(decoded.id)) return res.status(401).json({ success: false, message: 'Invalid token' })
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

// ---------- Rate limits (per user, run after auth) ----------
const limiterBase = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?.id || 'anonymous')
}
const bookingLimiter = rateLimit({
  ...limiterBase,
  max: 20,
  message: { success: false, message: 'Too many booking attempts. Please try again in a few minutes.' }
})
const completeLimiter = rateLimit({
  ...limiterBase,
  max: 60,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' }
})

// ---------- Helpers ----------
function isValidId(value) {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)
}

const sameId = (a, b) => String(a) === String(b)

const isParty = (session, userId) => sameId(session.organizer, userId) || sameId(session.participant, userId)

function sessionStart(date, time) {
  return new Date(`${date}T${time}:00${SESSION_UTC_OFFSET}`)
}

// Only https links are allowed. This blocks javascript: and data: links that
// could run code in another user's browser when they click "Join Meeting".
// Returns '' for empty, a clean URL string for valid, or null for invalid.
function sanitizeMeetingLink(value) {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value !== 'string' || value.length > 500) return null
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

// Weekly occurrences starting at `date`. Returns null if `date` is not a real calendar date.
function buildOccurrenceDates(date, count) {
  const base = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(base.getTime()) || base.toISOString().slice(0, 10) !== date) return null
  const dates = []
  for (let i = 0; i < count; i++) {
    const d = new Date(base.getTime())
    d.setUTCDate(d.getUTCDate() + i * 7)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

function sendError(res, error, label) {
  if (error instanceof LedgerError) {
    return res.status(error.status).json({ success: false, code: error.code, message: error.message })
  }
  console.error(`${label}:`, error)
  res.status(500).json({ success: false, message: 'Server error' })
}

async function notifySettlement(session) {
  try {
    const amount = session.escrowAmount > 0 ? session.escrowAmount : 1
    const [helper, payer] = await Promise.all([
      User.findById(session.helper).select('name'),
      User.findById(session.payer).select('name')
    ])
    await Notification.create({
      user: session.helper,
      type: 'session_completed',
      fromUser: session.payer,
      fromName: payer?.name || 'Someone',
      text: `Session completed! You earned ${amount} Time Credit${amount > 1 ? 's' : ''}`,
      link: '/wallet'
    })
    await Notification.create({
      user: session.payer,
      type: 'session_completed',
      fromUser: session.helper,
      fromName: helper?.name || 'Someone',
      text: `Session completed with ${helper?.name || 'someone'}`,
      link: '/wallet'
    })
  } catch (error) {
    console.error('Settlement notification error:', error)
  }
}

// ===================================
// CREATE — POST /api/sessions
// The person who books is the payer; the other person is the helper.
// ===================================
router.post('/', auth, bookingLimiter, async (req, res) => {
  try {
    const organizerId = req.user.id
    const { participantId, date, time, meetingLink, repeatWeeks } = req.body || {}

    if (!isValidId(participantId)) {
      return res.status(400).json({ success: false, message: 'Invalid participant' })
    }
    if (sameId(participantId, organizerId)) {
      return res.status(400).json({ success: false, message: 'You cannot book a session with yourself' })
    }
    if (typeof date !== 'string' || typeof time !== 'string' || !DATE_RE.test(date) || !TIME_RE.test(time)) {
      return res.status(400).json({ success: false, message: 'Invalid date or time' })
    }

    const cleanLink = sanitizeMeetingLink(meetingLink)
    if (cleanLink === null) {
      return res.status(400).json({ success: false, message: 'Meeting link must be a valid https:// link' })
    }

    // repeatWeeks: how many total weekly occurrences to create (1 = no repeat).
    const occurrences = Math.min(Math.max(parseInt(repeatWeeks, 10) || 1, 1), MAX_OCCURRENCES)
    const dates = buildOccurrenceDates(date, occurrences)
    if (!dates) {
      return res.status(400).json({ success: false, message: 'Invalid date' })
    }
    if (sessionStart(dates[0], time).getTime() <= Date.now()) {
      return res.status(400).json({ success: false, message: 'Please choose a future date and time' })
    }

    const [organizer, participant] = await Promise.all([
      User.findById(organizerId).select('name blockedUsers isActive'),
      User.findById(participantId).select('name blockedUsers isActive')
    ])
    if (!organizer || organizer.isActive === false) {
      return res.status(403).json({ success: false, message: 'Your account cannot book sessions' })
    }
    if (!participant || participant.isActive === false) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const blocked =
      (organizer.blockedUsers || []).some(id => sameId(id, participantId)) ||
      (participant.blockedUsers || []).some(id => sameId(id, organizerId))
    if (blocked) {
      return res.status(403).json({ success: false, message: 'You cannot book a session with this user' })
    }

    // Chat gate: both people must have sent at least one message
    const [sentByOrganizer, sentByParticipant] = await Promise.all([
      Message.exists({ sender: organizerId, receiver: participantId }),
      Message.exists({ sender: participantId, receiver: organizerId })
    ])
    if (!sentByOrganizer || !sentByParticipant) {
      return res.status(403).json({
        success: false,
        code: 'CHAT_REQUIRED',
        message: 'Chat first. You both need to send at least one message before booking a paid session.'
      })
    }

    // Block accidental duplicates (for example a double click)
    const duplicate = await Session.exists({
      status: 'scheduled',
      time,
      date: { $in: dates },
      $or: [
        { organizer: organizerId, participant: participantId },
        { organizer: participantId, participant: organizerId }
      ]
    })
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'You already have a session booked at this time with this person'
      })
    }

    // Hold the credits and create the sessions in ONE transaction
    const totalCredits = SESSION_PRICE_CREDITS * occurrences
    let balanceAfter = null

    const sessions = await runInTransaction(async (dbSession) => {
      const created = []
      for (const dateStr of dates) {
        const session = new Session({
          organizer: organizerId,
          participant: participantId,
          date: dateStr,
          time,
          meetingLink: cleanLink,
          payer: organizerId,
          helper: participantId,
          escrowAmount: SESSION_PRICE_CREDITS,
          escrowStatus: 'held'
        })

        balanceAfter = await debitUser({
          userId: organizerId,
          amount: SESSION_PRICE_CREDITS,
          type: 'escrow_hold',
          sessionId: session._id,
          counterpartyId: participantId,
          key: `hold:${session._id}`,
          insufficientMessage: `You need ${totalCredits} Time Credit${totalCredits > 1 ? 's' : ''} to book this, but your balance is too low.`
        }, dbSession)

        await session.save({ session: dbSession })
        created.push(session)
      }
      return created
    })

    try {
      await Notification.create({
        user: participantId,
        type: 'session_scheduled',
        fromUser: organizerId,
        fromName: organizer.name || 'Someone',
        text: occurrences > 1
          ? `${organizer.name || 'Someone'} booked ${occurrences} weekly sessions with you`
          : `${organizer.name || 'Someone'} booked a session with you`,
        link: '/messages'
      })
    } catch (notifyError) {
      console.error('Booking notification error:', notifyError)
    }

    res.status(201).json({
      success: true,
      session: sessions[0],
      sessions,
      heldCredits: totalCredits,
      timeCredits: balanceAfter
    })
  } catch (error) {
    sendError(res, error, 'Create session error')
  }
})

// GET /api/sessions/mine — every session (any status) this user is part of,
// across all conversations. Must be defined before the /:otherUserId route
// so Express doesn't treat "mine" as a user id param.
router.get('/mine', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const sessions = await Session.find({
      $or: [{ organizer: userId }, { participant: userId }]
    })
      .populate('organizer', 'name avatar')
      .populate('participant', 'name avatar')
      .sort({ date: 1, time: 1 })

    res.json({ success: true, sessions })
  } catch (error) {
    console.error('My sessions error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.get('/:otherUserId', auth, async (req, res) => {
  try {
    if (!isValidId(req.params.otherUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid user' })
    }
    const userId = req.user.id
    const otherId = req.params.otherUserId

    const sessions = await Session.find({
      $or: [
        { organizer: userId, participant: otherId },
        { organizer: otherId, participant: userId }
      ]
    }).sort({ createdAt: -1 })

    res.json({ success: true, sessions })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ===================================
// UPDATE (edit) a scheduled session — date, time, meeting link
// Editing never changes the escrow.
// ===================================
router.put('/:id', auth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid session' })
    }
    const { date, time, meetingLink } = req.body || {}
    const userId = req.user.id
    const session = await Session.findById(req.params.id)

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' })
    }
    if (!isParty(session, userId)) {
      return res.status(403).json({ success: false, message: 'Not part of this session' })
    }
    if (session.status !== 'scheduled') {
      return res.status(400).json({ success: false, message: 'Only scheduled sessions can be edited' })
    }

    const newDate = date || session.date
    const newTime = time || session.time
    if (typeof newDate !== 'string' || typeof newTime !== 'string' || !DATE_RE.test(newDate) || !TIME_RE.test(newTime)) {
      return res.status(400).json({ success: false, message: 'Invalid date or time' })
    }
    if (buildOccurrenceDates(newDate, 1) === null) {
      return res.status(400).json({ success: false, message: 'Invalid date' })
    }

    const timeChanged = newDate !== session.date || newTime !== session.time
    if (timeChanged && sessionStart(newDate, newTime).getTime() <= Date.now()) {
      return res.status(400).json({ success: false, message: 'Please choose a future date and time' })
    }

    const updates = { date: newDate, time: newTime }

    if (meetingLink !== undefined) {
      const cleanLink = sanitizeMeetingLink(meetingLink)
      if (cleanLink === null) {
        return res.status(400).json({ success: false, message: 'Meeting link must be a valid https:// link' })
      }
      updates.meetingLink = cleanLink
    }

    // Editing the time re-arms both reminder flags so the new time
    // gets its own 15-minute-before and start notifications.
    if (timeChanged) {
      updates.reminder15Sent = false
      updates.reminderStartSent = false
    }

    const updated = await Session.findOneAndUpdate(
      { _id: session._id, status: 'scheduled' },
      { $set: updates },
      { new: true }
    )
    if (!updated) {
      return res.status(409).json({ success: false, message: 'This session was just updated. Please refresh.' })
    }

    const otherUserId = sameId(session.organizer, userId) ? session.participant : session.organizer
    const editor = await User.findById(userId).select('name')
    try {
      await Notification.create({
        user: otherUserId,
        type: 'session_scheduled',
        fromUser: userId,
        fromName: editor?.name || 'Someone',
        text: `${editor?.name || 'Someone'} updated your scheduled session`,
        link: '/messages'
      })
    } catch (notifyError) {
      console.error('Edit notification error:', notifyError)
    }

    res.json({ success: true, session: updated })
  } catch (error) {
    sendError(res, error, 'Update session error')
  }
})

// ===================================
// DELETE (cancel) a scheduled session
// Escrowed credits are refunded to the payer in the same transaction.
// ===================================
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid session' })
    }
    const userId = req.user.id

    const result = await runInTransaction(async (dbSession) => {
      const session = await Session.findById(req.params.id).session(dbSession)

      if (!session) throw new LedgerError('NOT_FOUND', 'Session not found', 404)
      if (!isParty(session, userId)) throw new LedgerError('FORBIDDEN', 'Not part of this session', 403)
      if (session.status === 'completed') throw new LedgerError('INVALID_STATE', 'Cannot cancel a completed session', 400)

      const refunded = session.escrowStatus === 'held'
      if (refunded) await refundEscrow(session._id, dbSession)

      await Session.deleteOne({ _id: session._id }, { session: dbSession })
      return { session, refunded }
    })

    const otherUserId = sameId(result.session.organizer, userId) ? result.session.participant : result.session.organizer
    try {
      const canceller = await User.findById(userId).select('name')
      await Notification.create({
        user: otherUserId,
        type: 'session_cancelled',
        fromUser: userId,
        fromName: canceller?.name || 'Someone',
        text: `${canceller?.name || 'Someone'} cancelled the scheduled session${result.refunded ? '. The escrowed credit was refunded.' : ''}`,
        link: '/messages'
      })
    } catch (notifyError) {
      console.error('Cancel notification error:', notifyError)
    }

    res.json({ success: true, refunded: result.refunded })
  } catch (error) {
    sendError(res, error, 'Delete session error')
  }
})

// ===================================
// COMPLETE — both people confirm, then the escrow is released
// ===================================
router.post('/:id/complete', auth, completeLimiter, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid session' })
    }
    const userId = req.user.id
    // helperId is only used for old sessions (booked before escrow existed)
    const requestedHelperId = (req.body || {}).helperId

    const outcome = await runInTransaction(async (dbSession) => {
      const existing = await Session.findById(req.params.id).session(dbSession)

      if (!existing) throw new LedgerError('NOT_FOUND', 'Session not found', 404)
      if (!isParty(existing, userId)) throw new LedgerError('FORBIDDEN', 'Not part of this session', 403)
      if (existing.status === 'completed') return { session: existing, settled: false, already: true }
      if (existing.status !== 'scheduled') throw new LedgerError('INVALID_STATE', 'This session is not active', 400)

      const isEscrow = existing.escrowStatus === 'held'

      if (isEscrow && Date.now() < sessionStart(existing.date, existing.time).getTime()) {
        throw new LedgerError('TOO_EARLY', 'You can confirm completion once the session has started', 400)
      }

      let helperId
      if (isEscrow) {
        // Escrow sessions: the helper was fixed at booking time
        helperId = String(existing.helper)
      } else {
        // Old sessions: the helper is chosen at completion, both people must agree
        const validHelper =
          isValidId(requestedHelperId) &&
          (sameId(requestedHelperId, existing.organizer) || sameId(requestedHelperId, existing.participant))
        if (!validHelper) {
          throw new LedgerError('INVALID_HELPER', 'Please choose who helped in this session', 400)
        }
        if (existing.helper) {
          if (!sameId(existing.helper, requestedHelperId)) {
            throw new LedgerError(
              'HELPER_MISMATCH',
              'Mismatch: the other person selected a different helper. Please agree on who helped.',
              400
            )
          }
        } else {
          await Session.updateOne(
            { _id: existing._id, helper: null },
            { $set: { helper: requestedHelperId } },
            { session: dbSession }
          )
        }
        helperId = String(requestedHelperId)
      }

      // Record this person's confirmation (safe to repeat)
      const updated = await Session.findOneAndUpdate(
        { _id: existing._id, status: 'scheduled' },
        { $addToSet: { completionConfirmedBy: userId } },
        { new: true, session: dbSession }
      )
      if (!updated) throw new LedgerError('CONFLICT', 'This session was just updated. Please try again.', 409)

      const confirmed = updated.completionConfirmedBy.map(String)
      const bothConfirmed =
        confirmed.includes(String(updated.organizer)) && confirmed.includes(String(updated.participant))

      if (!bothConfirmed) return { session: updated, settled: false }

      let settledSession
      if (isEscrow) {
        settledSession = await releaseEscrow(updated._id, dbSession)
      } else {
        const payerId = sameId(helperId, updated.organizer) ? updated.participant : updated.organizer
        settledSession = await settleLegacySession(updated._id, helperId, payerId, dbSession)
      }
      return { session: settledSession, settled: true }
    })

    if (outcome.settled) await notifySettlement(outcome.session)

    res.json({
      success: true,
      session: outcome.session,
      ...(outcome.already ? { message: 'Already completed' } : {})
    })
  } catch (error) {
    sendError(res, error, 'Complete session error')
  }
})

module.exports = router