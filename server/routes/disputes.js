// ===================================
// DISPUTES.JS — Report a problem with an escrowed session
//
// - Either person can open ONE dispute per session once it has started.
// - An open dispute freezes the session (no confirm, cancel or auto-settlement).
// - Only an admin can settle it: release to the helper, or refund to the payer.
// - Every decision is saved with the admin's id and a written note.
// ===================================

const express = require('express')
const mongoose = require('mongoose')
const rateLimit = require('express-rate-limit')
const jwt = require('jsonwebtoken')
const router = express.Router()
const Session = require('../models/Session')
const Dispute = require('../models/Dispute')
const User = require('../models/User')
const Notification = require('../models/Notification')
const {
  LedgerError,
  runInTransaction,
  releaseEscrow,
  refundEscrow
} = require('../utils/ledger')

const SESSION_UTC_OFFSET = '+05:30' // Sri Lanka time, same offset used for sessions

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

// Admin status is always read fresh from the database, never from the token
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('isAdmin isActive')
    if (!user || !user.isAdmin || user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }
    next()
  } catch (error) {
    console.error('Admin check error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ---------- Rate limits (per user) ----------
const limiterBase = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?.id || 'anonymous')
}
const openLimiter = rateLimit({
  ...limiterBase,
  max: 10,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' }
})
const adminLimiter = rateLimit({
  ...limiterBase,
  max: 120,
  message: { success: false, message: 'Too many requests. Please slow down.' }
})

// ---------- Helpers ----------
function isValidId(value) {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)
}

const sameId = (a, b) => String(a) === String(b)

const isParty = (session, userId) => sameId(session.organizer, userId) || sameId(session.participant, userId)

function sessionStart(session) {
  return new Date(`${session.date}T${session.time}:00${SESSION_UTC_OFFSET}`)
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function sendError(res, error, label) {
  if (error instanceof LedgerError) {
    return res.status(error.status).json({ success: false, code: error.code, message: error.message })
  }
  // Unique index: a dispute is already open for this session
  if (error && error.code === 11000) {
    return res.status(409).json({ success: false, message: 'This session already has an open dispute' })
  }
  console.error(`${label}:`, error)
  res.status(500).json({ success: false, message: 'Server error' })
}

async function safeNotify(data) {
  try {
    await Notification.create({ read: false, ...data })
  } catch (error) {
    console.error('Dispute notification error:', error)
  }
}

// ===================================
// OPEN — POST /api/disputes   { sessionId, reason }
// ===================================
router.post('/', auth, openLimiter, async (req, res) => {
  try {
    const userId = req.user.id
    const sessionId = (req.body || {}).sessionId
    const reason = cleanText((req.body || {}).reason)

    if (!isValidId(sessionId)) {
      return res.status(400).json({ success: false, message: 'Invalid session' })
    }
    if (reason.length < 10 || reason.length > 1000) {
      return res.status(400).json({ success: false, message: 'Please describe the problem in 10 to 1000 characters' })
    }

    const result = await runInTransaction(async (dbSession) => {
      const session = await Session.findById(sessionId).session(dbSession)

      if (!session) throw new LedgerError('NOT_FOUND', 'Session not found', 404)
      if (!isParty(session, userId)) throw new LedgerError('FORBIDDEN', 'Not part of this session', 403)
      if (session.escrowStatus !== 'held' || session.status !== 'scheduled') {
        throw new LedgerError('NOT_DISPUTABLE', 'Only a session with credits still in escrow can be reported', 409)
      }
      if (session.disputed) {
        throw new LedgerError('ALREADY_DISPUTED', 'This session is already under review', 409)
      }
      if (Date.now() < sessionStart(session).getTime()) {
        throw new LedgerError(
          'TOO_EARLY',
          'You can report a problem once the session has started. Before that, cancel the session for a full refund.',
          400
        )
      }

      // Freeze the session
      const frozen = await Session.findOneAndUpdate(
        { _id: session._id, escrowStatus: 'held', status: 'scheduled', disputed: { $ne: true } },
        { $set: { disputed: true } },
        { new: true, session: dbSession }
      )
      if (!frozen) throw new LedgerError('CONFLICT', 'This session was just updated. Please try again.', 409)

      const [dispute] = await Dispute.create([{
        session: session._id,
        openedBy: userId,
        payer: session.payer,
        helper: session.helper,
        amount: session.escrowAmount,
        reason
      }], { session: dbSession })

      return { dispute, session: frozen }
    })

    // Tell the other person and every admin
    const opener = await User.findById(userId).select('name')
    const otherId = sameId(result.session.organizer, userId) ? result.session.participant : result.session.organizer

    await safeNotify({
      user: otherId,
      type: 'session_scheduled',
      fromUser: userId,
      fromName: opener?.name || 'Someone',
      text: `${opener?.name || 'Someone'} reported a problem with your session. The escrowed credit is frozen until the TimeBank team reviews it. You can add your side of the story.`,
      link: '/messages'
    })

    const admins = await User.find({ isAdmin: true }).select('_id')
    await Promise.all(admins.map(admin => safeNotify({
      user: admin._id,
      type: 'report_received',
      fromUser: userId,
      fromName: opener?.name || 'Someone',
      text: 'A session dispute needs your review',
      link: '/admin/moderation'
    })))

    res.status(201).json({ success: true, dispute: result.dispute })
  } catch (error) {
    sendError(res, error, 'Open dispute error')
  }
})

// ===================================
// RESPOND — POST /api/disputes/:id/respond   { message }
// The OTHER person adds their side of the story.
// ===================================
router.post('/:id/respond', auth, openLimiter, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid dispute' })
    }
    const message = cleanText((req.body || {}).message)
    if (message.length < 5 || message.length > 1000) {
      return res.status(400).json({ success: false, message: 'Please write 5 to 1000 characters' })
    }

    const dispute = await Dispute.findById(req.params.id)
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' })

    const userId = req.user.id
    const isInvolved = sameId(dispute.payer, userId) || sameId(dispute.helper, userId)
    if (!isInvolved) return res.status(403).json({ success: false, message: 'Not part of this dispute' })
    if (sameId(dispute.openedBy, userId)) {
      return res.status(400).json({ success: false, message: 'You opened this dispute. Only the other person can respond.' })
    }
    if (dispute.status !== 'open') {
      return res.status(409).json({ success: false, message: 'This dispute is already resolved' })
    }

    const updated = await Dispute.findOneAndUpdate(
      { _id: dispute._id, status: 'open' },
      { $set: { response: message, respondedAt: new Date() } },
      { new: true }
    )
    if (!updated) return res.status(409).json({ success: false, message: 'This dispute is already resolved' })

    res.json({ success: true, dispute: updated })
  } catch (error) {
    sendError(res, error, 'Respond to dispute error')
  }
})

// ===================================
// MINE — GET /api/disputes/mine
// ===================================
router.get('/mine', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const disputes = await Dispute.find({ $or: [{ payer: userId }, { helper: userId }] })
      .select('session openedBy amount reason response status decision resolutionNote createdAt resolvedAt')
      .sort({ createdAt: -1 })
      .limit(50)

    res.json({ success: true, disputes })
  } catch (error) {
    sendError(res, error, 'My disputes error')
  }
})

// ===================================
// ADMIN LIST — GET /api/disputes?status=open|resolved
// ===================================
router.get('/', auth, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const status = req.query.status === 'resolved' ? 'resolved' : 'open'

    const disputes = await Dispute.find({ status })
      .populate('session', 'date time escrowAmount completionConfirmedBy firstConfirmedAt meetingLink')
      .populate('openedBy', 'name email')
      .populate('payer', 'name email')
      .populate('helper', 'name email')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: status === 'open' ? 1 : -1 })
      .limit(100)

    res.json({ success: true, disputes })
  } catch (error) {
    sendError(res, error, 'List disputes error')
  }
})

// ===================================
// ADMIN RESOLVE — PUT /api/disputes/:id/resolve   { decision: 'release'|'refund', note }
// ===================================
router.put('/:id/resolve', auth, requireAdmin, adminLimiter, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid dispute' })
    }
    const adminId = req.user.id
    const decision = (req.body || {}).decision
    const note = cleanText((req.body || {}).note)

    if (!['release', 'refund'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Decision must be "release" or "refund"' })
    }
    if (note.length < 5 || note.length > 1000) {
      return res.status(400).json({ success: false, message: 'Add a short note (5 to 1000 characters) explaining your decision' })
    }

    const result = await runInTransaction(async (dbSession) => {
      const current = await Dispute.findById(req.params.id).session(dbSession)
      if (!current) throw new LedgerError('NOT_FOUND', 'Dispute not found', 404)
      if (current.status !== 'open') throw new LedgerError('NOT_OPEN', 'This dispute is already resolved', 409)
      if (sameId(current.payer, adminId) || sameId(current.helper, adminId)) {
        throw new LedgerError('CONFLICT_OF_INTEREST', 'You cannot resolve a dispute you are part of', 403)
      }

      const dispute = await Dispute.findOneAndUpdate(
        { _id: current._id, status: 'open' },
        {
          $set: {
            status: 'resolved',
            decision,
            resolvedBy: adminId,
            resolutionNote: note,
            resolvedAt: new Date()
          }
        },
        { new: true, session: dbSession }
      )
      if (!dispute) throw new LedgerError('NOT_OPEN', 'This dispute is already resolved', 409)

      const options = { reason: 'admin_decision', allowDisputed: true }
      const session = decision === 'release'
        ? await releaseEscrow(dispute.session, dbSession, options)
        : await refundEscrow(dispute.session, dbSession, options)

      return { dispute, session }
    })

    const { dispute } = result
    const releasedText = 'After review, the escrowed credit was released to the helper.'
    const refundedText = 'After review, the escrowed credit was refunded to the person who booked.'

    await safeNotify({
      user: dispute.helper,
      type: decision === 'release' ? 'session_completed' : 'session_cancelled',
      fromUser: adminId,
      fromName: 'TimeBank',
      text: `Dispute resolved. ${decision === 'release' ? releasedText : refundedText}`,
      link: '/wallet'
    })
    await safeNotify({
      user: dispute.payer,
      type: decision === 'release' ? 'session_completed' : 'session_cancelled',
      fromUser: adminId,
      fromName: 'TimeBank',
      text: `Dispute resolved. ${decision === 'release' ? releasedText : refundedText}`,
      link: '/wallet'
    })

    res.json({ success: true, dispute: result.dispute, session: result.session })
  } catch (error) {
    sendError(res, error, 'Resolve dispute error')
  }
})

module.exports = router