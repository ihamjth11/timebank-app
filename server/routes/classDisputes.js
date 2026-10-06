// ===================================
// CLASSDISPUTES.JS — Report a problem with a class
//
// - A student with credits held for a class can report a problem once it started.
// - Only THAT student's credits are frozen (the class and other students go on).
// - The host can add their side of the story.
// - Only an admin can settle it: release to the host, or refund to the student.
// - Every decision is saved with the admin's id and a written note.
// ===================================

const express = require('express')
const rateLimit = require('express-rate-limit')
const jwt = require('jsonwebtoken')
const router = express.Router()
const Workshop = require('../models/Workshop')
const Enrollment = require('../models/Enrollment')
const ClassDispute = require('../models/ClassDispute')
const User = require('../models/User')
const Notification = require('../models/Notification')
const { LedgerError, runInTransaction } = require('../utils/ledger')
const { releaseEnrollment, refundEnrollment } = require('../utils/enrollmentLedger')

const UTC_OFFSET = '+05:30' // Sri Lanka time, same offset used for classes

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

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function workshopStart(workshop) {
  return new Date(`${workshop.date}T${workshop.time}:00${UTC_OFFSET}`)
}

function sendError(res, error, label) {
  if (error instanceof LedgerError) {
    return res.status(error.status).json({ success: false, code: error.code, message: error.message })
  }
  // Unique index: a dispute is already open for this enrollment
  if (error && error.code === 11000) {
    return res.status(409).json({ success: false, message: 'You already reported a problem with this class' })
  }
  console.error(`${label}:`, error)
  res.status(500).json({ success: false, message: 'Server error' })
}

async function safeNotify(data) {
  try {
    await Notification.create({ read: false, ...data })
  } catch (error) {
    console.error('Class dispute notification error:', error)
  }
}

// ===================================
// OPEN — POST /api/class-disputes   { workshopId, reason }
// ===================================
router.post('/', auth, openLimiter, async (req, res) => {
  try {
    const userId = req.user.id
    const workshopId = (req.body || {}).workshopId
    const reason = cleanText((req.body || {}).reason)

    if (!isValidId(workshopId)) {
      return res.status(400).json({ success: false, message: 'Invalid class' })
    }
    if (reason.length < 10 || reason.length > 1000) {
      return res.status(400).json({ success: false, message: 'Please describe the problem in 10 to 1000 characters' })
    }

    const outcome = await runInTransaction(async (dbSession) => {
      const workshop = await Workshop.findById(workshopId).session(dbSession)
      if (!workshop) throw new LedgerError('NOT_FOUND', 'Class not found', 404)
      if (workshop.status === 'cancelled') {
        throw new LedgerError('NOT_DISPUTABLE', 'This class was cancelled and your credits were refunded', 409)
      }
      if (Date.now() < workshopStart(workshop).getTime()) {
        throw new LedgerError(
          'TOO_EARLY',
          'You can report a problem once the class has started. Before that, leave the class for a full refund.',
          400
        )
      }

      const enrollment = await Enrollment.findOne({ workshop: workshop._id, attendee: userId, status: 'held' })
        .session(dbSession)
      if (!enrollment) {
        throw new LedgerError('NOT_DISPUTABLE', 'You have no credits held for this class', 409)
      }
      if (enrollment.disputed) {
        throw new LedgerError('ALREADY_DISPUTED', 'This class is already under review for you', 409)
      }

      // Freeze this student's credits
      const frozen = await Enrollment.findOneAndUpdate(
        { _id: enrollment._id, status: 'held', disputed: { $ne: true } },
        { $set: { disputed: true } },
        { new: true, session: dbSession }
      )
      if (!frozen) throw new LedgerError('CONFLICT', 'This class was just updated. Please try again.', 409)

      const [dispute] = await ClassDispute.create([{
        workshop: workshop._id,
        enrollment: frozen._id,
        student: userId,
        host: workshop.host,
        amount: frozen.amount,
        reason
      }], { session: dbSession })

      return { dispute, workshop }
    })

    // Tell the host and every admin
    const student = await User.findById(userId).select('name')
    await safeNotify({
      user: outcome.workshop.host,
      type: 'session_scheduled',
      fromUser: userId,
      fromName: 'TimeBank',
      text: `A student reported a problem with "${outcome.workshop.title}". That student's credits are frozen until the TimeBank team reviews it. You can add your side of the story.`,
      link: '/workshops'
    })

    const admins = await User.find({ isAdmin: true }).select('_id')
    await Promise.all(admins.map(admin => safeNotify({
      user: admin._id,
      type: 'report_received',
      fromUser: userId,
      fromName: student?.name || 'A student',
      text: 'A class dispute needs your review',
      link: '/admin/moderation'
    })))

    res.status(201).json({ success: true, dispute: outcome.dispute })
  } catch (error) {
    sendError(res, error, 'Open class dispute error')
  }
})

// ===================================
// MINE — GET /api/class-disputes/mine   (as student or as host)
// ===================================
router.get('/mine', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const disputes = await ClassDispute.find({ $or: [{ student: userId }, { host: userId }] })
      .select('workshop student host amount reason response status decision resolutionNote createdAt resolvedAt')
      .sort({ createdAt: -1 })
      .limit(100)

    res.json({ success: true, disputes })
  } catch (error) {
    sendError(res, error, 'My class disputes error')
  }
})

// ===================================
// RESPOND — POST /api/class-disputes/:id/respond   { message }
// The HOST adds their side of the story.
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

    const dispute = await ClassDispute.findById(req.params.id)
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' })
    if (!sameId(dispute.host, req.user.id)) {
      return res.status(403).json({ success: false, message: 'Only the host can respond to this report' })
    }
    if (dispute.status !== 'open') {
      return res.status(409).json({ success: false, message: 'This dispute is already resolved' })
    }

    const updated = await ClassDispute.findOneAndUpdate(
      { _id: dispute._id, status: 'open' },
      { $set: { response: message, respondedAt: new Date() } },
      { new: true }
    )
    if (!updated) return res.status(409).json({ success: false, message: 'This dispute is already resolved' })

    res.json({ success: true, dispute: updated })
  } catch (error) {
    sendError(res, error, 'Respond to class dispute error')
  }
})

// ===================================
// ADMIN LIST — GET /api/class-disputes?status=open|resolved
// ===================================
router.get('/', auth, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const status = req.query.status === 'resolved' ? 'resolved' : 'open'

    const disputes = await ClassDispute.find({ status })
      .populate('workshop', 'title date time status capacity')
      .populate('student', 'name email')
      .populate('host', 'name email')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: status === 'open' ? 1 : -1 })
      .limit(100)

    res.json({ success: true, disputes })
  } catch (error) {
    sendError(res, error, 'List class disputes error')
  }
})

// ===================================
// ADMIN RESOLVE — PUT /api/class-disputes/:id/resolve   { decision: 'release'|'refund', note }
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

    const outcome = await runInTransaction(async (dbSession) => {
      const current = await ClassDispute.findById(req.params.id).session(dbSession)
      if (!current) throw new LedgerError('NOT_FOUND', 'Dispute not found', 404)
      if (current.status !== 'open') throw new LedgerError('NOT_OPEN', 'This dispute is already resolved', 409)
      if (sameId(current.student, adminId) || sameId(current.host, adminId)) {
        throw new LedgerError('CONFLICT_OF_INTEREST', 'You cannot resolve a dispute you are part of', 403)
      }

      const dispute = await ClassDispute.findOneAndUpdate(
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
      const enrollment = decision === 'release'
        ? await releaseEnrollment(dispute.enrollment, dbSession, options)
        : await refundEnrollment(dispute.enrollment, dbSession, options)

      return { dispute, enrollment }
    })

    const { dispute } = outcome
    const text = decision === 'release'
      ? 'Dispute resolved. After review, the held credits were released to the host.'
      : 'Dispute resolved. After review, the held credits were refunded to the student.'
    const type = decision === 'release' ? 'session_completed' : 'session_cancelled'

    await safeNotify({ user: dispute.student, type, fromUser: adminId, fromName: 'TimeBank', text, link: '/wallet' })
    await safeNotify({ user: dispute.host, type, fromUser: adminId, fromName: 'TimeBank', text, link: '/wallet' })

    res.json({ success: true, dispute: outcome.dispute })
  } catch (error) {
    sendError(res, error, 'Resolve class dispute error')
  }
})

module.exports = router