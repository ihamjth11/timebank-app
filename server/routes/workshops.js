// ===================================
// WORKSHOPS.JS — Classes with per-student escrow
//
// Money rules (see utils/enrollmentLedger.js):
// - A student's credits are HELD when they get a seat (waitlisted people pay
//   only when they are promoted to a seat).
// - Credits go to the host ONLY when the student confirms they attended.
// - Leaving before the class starts, or the host cancelling, refunds in full.
// - The host marking the class "completed" never moves credits by itself.
// - Seats are taken with atomic updates, so a class can never be overbooked.
// ===================================

const express = require('express')
const rateLimit = require('express-rate-limit')
const jwt = require('jsonwebtoken')
const router = express.Router()
const Workshop = require('../models/Workshop')
const Enrollment = require('../models/Enrollment')
const User = require('../models/User')
const Notification = require('../models/Notification')
const { LedgerError, runInTransaction } = require('../utils/ledger')
const { holdEnrollment, releaseEnrollment, refundEnrollment } = require('../utils/enrollmentLedger')

const CATEGORIES = ['Technology', 'Design', 'Education', 'Cooking', 'Music', 'Language', 'Business', 'Health', 'Other']
const MAX_CREDITS_PER_PERSON = 10
const MAX_OPEN_CLASSES_PER_HOST = 20
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const UTC_OFFSET = '+05:30' // Sri Lanka time, same offset used for sessions

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

// For public routes: a valid token personalises the answer, no token means a visitor
const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      if (isValidId(decoded.id)) req.user = decoded
    }
  } catch {
    // invalid token: treat as a visitor
  }
  next()
}

// ---------- Rate limits (per user, run after auth) ----------
const limiterBase = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?.id || 'anonymous')
}
const createLimiter = rateLimit({
  ...limiterBase,
  max: 10,
  message: { success: false, message: 'Too many classes created. Please try again in a few minutes.' }
})
const actionLimiter = rateLimit({
  ...limiterBase,
  max: 60,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' }
})

// ---------- Helpers ----------
function isValidId(value) {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)
}

const sameId = (a, b) => String(a) === String(b)
const includesId = (list, id) => (list || []).some(item => sameId(item, id))

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function readInt(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback
  const n = Number(value)
  return Number.isInteger(n) ? n : NaN
}

function isRealDate(date) {
  const d = new Date(`${date}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date
}

function workshopStart(date, time) {
  return new Date(`${date}T${time}:00${UTC_OFFSET}`)
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

function sendError(res, error, label) {
  if (error instanceof LedgerError) {
    return res.status(error.status).json({ success: false, code: error.code, message: error.message })
  }
  console.error(`${label}:`, error)
  res.status(500).json({ success: false, message: 'Server error' })
}

async function safeNotify(data) {
  try {
    await Notification.create({ read: false, ...data })
  } catch (error) {
    console.error('Workshop notification error:', error)
  }
}

// Validates and cleans the body of "create class"
function parseNewWorkshop(body) {
  const b = body || {}

  const title = cleanText(b.title)
  if (title.length < 3 || title.length > 120) return { error: 'Title must be 3 to 120 characters' }

  const description = cleanText(b.description)
  if (description.length > 2000) return { error: 'Description is too long (max 2000 characters)' }

  const category = CATEGORIES.includes(b.category) ? b.category : 'Other'

  const date = cleanText(b.date)
  const time = cleanText(b.time)
  if (!DATE_RE.test(date) || !TIME_RE.test(time) || !isRealDate(date)) return { error: 'Invalid date or time' }
  if (workshopStart(date, time).getTime() <= Date.now()) return { error: 'Please choose a future date and time' }

  const durationMinutes = readInt(b.durationMinutes, 60)
  if (!(durationMinutes >= 15 && durationMinutes <= 480)) return { error: 'Duration must be 15 to 480 minutes' }

  const capacity = readInt(b.capacity, 10)
  if (!(capacity >= 1 && capacity <= 100)) return { error: 'Capacity must be 1 to 100' }

  const creditsPerPerson = readInt(b.creditsPerPerson, 1)
  if (!(creditsPerPerson >= 1 && creditsPerPerson <= MAX_CREDITS_PER_PERSON)) {
    return { error: `Credits per student must be 1 to ${MAX_CREDITS_PER_PERSON}` }
  }

  const meetingLink = sanitizeMeetingLink(b.meetingLink)
  if (meetingLink === null) return { error: 'Meeting link must be a valid https:// link' }

  return {
    value: { title, description, category, date, time, durationMinutes, capacity, creditsPerPerson, meetingLink }
  }
}

// Fills free seats from the waitlist, in order. Each promoted person pays (credits
// are held) at that moment. Someone who cannot pay is removed from the waitlist and
// the next person is tried. Runs inside the caller's transaction.
async function promoteFromWaitlist(workshopId, dbSession) {
  const promoted = []
  const dropped = []

  for (let guard = 0; guard < 100; guard++) {
    const current = await Workshop.findById(workshopId).session(dbSession)
    if (!current || current.status !== 'upcoming') break
    if (current.attendees.length >= current.capacity || current.waitlist.length === 0) break

    const candidateId = String(current.waitlist[0])

    const seated = await Workshop.findOneAndUpdate(
      {
        _id: workshopId,
        status: 'upcoming',
        waitlist: candidateId,
        $expr: { $lt: [{ $size: '$attendees' }, '$capacity'] }
      },
      { $pull: { waitlist: candidateId }, $addToSet: { attendees: candidateId } },
      { new: true, session: dbSession }
    )
    if (!seated) break

    try {
      await holdEnrollment({ workshop: seated, attendeeId: candidateId }, dbSession)
      promoted.push(candidateId)
    } catch (error) {
      if (!(error instanceof LedgerError)) throw error
      // Cannot pay (or suspended): give the seat back and try the next person
      await Workshop.updateOne({ _id: workshopId }, { $pull: { attendees: candidateId } }, { session: dbSession })
      dropped.push(candidateId)
    }
  }

  return { promoted, dropped }
}

// ===================================
// LIST — GET /api/workshops   (public, personalised when a token is sent)
// ===================================
router.get('/', optionalAuth, async (req, res) => {
  try {
    const viewerId = req.user?.id || null
    const category = typeof req.query.category === 'string' ? req.query.category : ''
    const categoryFilter = category && category !== 'All' ? { category } : {}

    // The viewer's own held enrollments, so a finished class can show "Confirm attendance"
    const heldByWorkshop = new Map()
    if (viewerId) {
      const held = await Enrollment.find({ attendee: viewerId, status: 'held' }).select('workshop disputed')
      held.forEach(e => heldByWorkshop.set(String(e.workshop), e))
    }
    const heldIds = [...heldByWorkshop.keys()]

    const branches = [{ status: 'upcoming', ...categoryFilter }]
    if (heldIds.length > 0) {
      branches.push({ status: 'completed', _id: { $in: heldIds }, ...categoryFilter })
    }

    const workshops = await Workshop.find({ $or: branches })
      .populate('host', 'name avatar location')
      .sort({ date: 1, time: 1 })
      .limit(100)

    const now = Date.now()
    const result = workshops.map(w => {
      const isHost = viewerId ? sameId(w.host?._id || w.host, viewerId) : false
      const isJoined = viewerId ? includesId(w.attendees, viewerId) : false
      const isWaitlisted = viewerId ? includesId(w.waitlist, viewerId) : false
      const enrollment = heldByWorkshop.get(String(w._id))
      const hasStarted = now >= workshopStart(w.date, w.time).getTime()

      return {
        _id: w._id,
        host: w.host,
        title: w.title,
        description: w.description,
        category: w.category,
        date: w.date,
        time: w.time,
        durationMinutes: w.durationMinutes,
        capacity: w.capacity,
        creditsPerPerson: w.creditsPerPerson,
        status: w.status,
        attendeeCount: w.attendees.length,
        waitlistCount: w.waitlist.length,
        // The meeting link is only sent to the host and to people who joined
        meetingLink: isHost || isJoined ? w.meetingLink : '',
        // Only facts about the viewer are sent, never other people's ids
        viewer: {
          isHost,
          isJoined,
          isWaitlisted,
          hasStarted,
          enrollmentStatus: enrollment ? 'held' : null,
          canConfirm: !!enrollment && !enrollment.disputed && hasStarted
        }
      }
    })

    res.json({ success: true, workshops: result })
  } catch (error) {
    sendError(res, error, 'List workshops error')
  }
})

// ===================================
// MINE — GET /api/workshops/mine
// ===================================
router.get('/mine', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const workshops = await Workshop.find({
      status: { $ne: 'cancelled' },
      $or: [{ host: userId }, { attendees: userId }]
    }).populate('host', 'name avatar location').sort({ date: 1, time: 1 })

    res.json({ success: true, workshops })
  } catch (error) {
    sendError(res, error, 'My workshops error')
  }
})

// ===================================
// CREATE — POST /api/workshops
// ===================================
router.post('/', auth, createLimiter, async (req, res) => {
  try {
    const parsed = parseNewWorkshop(req.body)
    if (parsed.error) return res.status(400).json({ success: false, message: parsed.error })

    const host = await User.findById(req.user.id).select('isActive')
    if (!host || host.isActive === false) {
      return res.status(403).json({ success: false, message: 'Your account cannot host classes' })
    }

    const openClasses = await Workshop.countDocuments({ host: req.user.id, status: 'upcoming' })
    if (openClasses >= MAX_OPEN_CLASSES_PER_HOST) {
      return res.status(400).json({
        success: false,
        message: `You can have at most ${MAX_OPEN_CLASSES_PER_HOST} upcoming classes at a time`
      })
    }

    const workshop = await Workshop.create({ host: req.user.id, ...parsed.value })
    res.status(201).json({ success: true, workshop })
  } catch (error) {
    sendError(res, error, 'Create workshop error')
  }
})

// ===================================
// JOIN — POST /api/workshops/:id/join
// Gets a seat (credits held in escrow) or joins the waitlist (nothing held yet).
// ===================================
router.post('/:id/join', auth, actionLimiter, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid class' })
    }
    const userId = req.user.id

    const outcome = await runInTransaction(async (dbSession) => {
      const workshop = await Workshop.findById(req.params.id).session(dbSession)

      if (!workshop) throw new LedgerError('NOT_FOUND', 'Class not found', 404)
      if (workshop.status !== 'upcoming') throw new LedgerError('CLOSED', 'This class is no longer open', 409)
      if (sameId(workshop.host, userId)) throw new LedgerError('OWN_CLASS', "You can't join your own class", 400)
      if (Date.now() >= workshopStart(workshop.date, workshop.time).getTime()) {
        throw new LedgerError('STARTED', 'This class has already started', 400)
      }
      if (includesId(workshop.attendees, userId)) throw new LedgerError('JOINED', 'Already joined', 400)
      if (includesId(workshop.waitlist, userId)) throw new LedgerError('WAITLISTED', 'Already on the waitlist', 400)

      const [student, host] = await Promise.all([
        User.findById(userId).select('name isActive blockedUsers').session(dbSession),
        User.findById(workshop.host).select('name isActive blockedUsers').session(dbSession)
      ])
      if (!student || student.isActive === false) throw new LedgerError('ACCOUNT', 'Your account cannot join classes', 403)
      if (!host || host.isActive === false) throw new LedgerError('HOST', 'This class is not available', 409)

      const blocked =
        (student.blockedUsers || []).some(id => sameId(id, workshop.host)) ||
        (host.blockedUsers || []).some(id => sameId(id, userId))
      if (blocked) throw new LedgerError('BLOCKED', 'You cannot join this class', 403)

      // Take a seat with ONE atomic update that also checks the capacity
      const seated = await Workshop.findOneAndUpdate(
        {
          _id: workshop._id,
          status: 'upcoming',
          attendees: { $ne: userId },
          waitlist: { $ne: userId },
          $expr: { $lt: [{ $size: '$attendees' }, '$capacity'] }
        },
        { $addToSet: { attendees: userId } },
        { new: true, session: dbSession }
      )

      if (seated) {
        // Hold the credits. If the balance is too low this throws and the seat is undone.
        const { balanceAfter } = await holdEnrollment({ workshop: seated, attendeeId: userId }, dbSession)
        return { waitlisted: false, student, workshop: seated, balanceAfter, heldCredits: seated.creditsPerPerson }
      }

      if (workshop.attendees.length < workshop.capacity) {
        throw new LedgerError('CONFLICT', 'The class just changed. Please try again.', 409)
      }

      // Class is full: join the waitlist. No credits are held until a seat opens up.
      const waitlisted = await Workshop.findOneAndUpdate(
        { _id: workshop._id, status: 'upcoming', attendees: { $ne: userId }, waitlist: { $ne: userId } },
        { $addToSet: { waitlist: userId } },
        { new: true, session: dbSession }
      )
      if (!waitlisted) throw new LedgerError('CONFLICT', 'The class just changed. Please try again.', 409)
      return { waitlisted: true, student, workshop: waitlisted }
    })

    await safeNotify({
      user: outcome.workshop.host,
      type: 'session_scheduled',
      fromUser: userId,
      fromName: outcome.student?.name || 'Someone',
      text: outcome.waitlisted
        ? `${outcome.student?.name || 'Someone'} joined the waitlist for "${outcome.workshop.title}"`
        : `${outcome.student?.name || 'Someone'} joined your class "${outcome.workshop.title}"`,
      link: '/workshops'
    })

    res.json({
      success: true,
      waitlisted: outcome.waitlisted,
      heldCredits: outcome.heldCredits || 0,
      timeCredits: typeof outcome.balanceAfter === 'number' ? outcome.balanceAfter : null
    })
  } catch (error) {
    sendError(res, error, 'Join workshop error')
  }
})

// ===================================
// LEAVE — POST /api/workshops/:id/leave
// Before the class starts: full refund, and the waitlist moves up.
// After it started a student cannot leave (confirm attendance instead).
// ===================================
router.post('/:id/leave', auth, actionLimiter, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid class' })
    }
    const userId = req.user.id

    const outcome = await runInTransaction(async (dbSession) => {
      const workshop = await Workshop.findById(req.params.id).session(dbSession)
      if (!workshop) throw new LedgerError('NOT_FOUND', 'Class not found', 404)

      const isAttendee = includesId(workshop.attendees, userId)
      const isWaitlisted = includesId(workshop.waitlist, userId)
      if (!isAttendee && !isWaitlisted) throw new LedgerError('NOT_IN_CLASS', 'You are not in this class', 400)
      if (workshop.status !== 'upcoming') throw new LedgerError('CLOSED', 'This class is no longer open', 409)

      if (isWaitlisted) {
        await Workshop.updateOne({ _id: workshop._id }, { $pull: { waitlist: userId } }, { session: dbSession })
        return { workshop, refunded: false, promoted: [], dropped: [] }
      }

      if (Date.now() >= workshopStart(workshop.date, workshop.time).getTime()) {
        throw new LedgerError(
          'STARTED',
          'The class has already started, so you can no longer leave. Confirm your attendance when it is done.',
          409
        )
      }

      // Classes joined before escrow existed have no enrollment (nothing was charged)
      const enrollment = await Enrollment.findOne({ workshop: workshop._id, attendee: userId, status: 'held' }).session(dbSession)
      if (enrollment) await refundEnrollment(enrollment._id, dbSession, { reason: 'cancelled' })

      await Workshop.updateOne({ _id: workshop._id }, { $pull: { attendees: userId } }, { session: dbSession })

      const { promoted, dropped } = await promoteFromWaitlist(workshop._id, dbSession)
      return { workshop, refunded: !!enrollment, promoted, dropped }
    })

    for (const promotedId of outcome.promoted) {
      await safeNotify({
        user: promotedId,
        type: 'session_scheduled',
        fromUser: outcome.workshop.host,
        fromName: 'TimeBank',
        text: `A spot opened up. You're now confirmed for "${outcome.workshop.title}" and ${outcome.workshop.creditsPerPerson} credit${outcome.workshop.creditsPerPerson > 1 ? 's were' : ' was'} held from your balance.`,
        link: '/workshops'
      })
    }
    for (const droppedId of outcome.dropped) {
      await safeNotify({
        user: droppedId,
        type: 'session_cancelled',
        fromUser: outcome.workshop.host,
        fromName: 'TimeBank',
        text: `A spot opened up in "${outcome.workshop.title}", but your balance was too low, so you were removed from the waitlist.`,
        link: '/workshops'
      })
    }

    res.json({ success: true, refunded: outcome.refunded })
  } catch (error) {
    sendError(res, error, 'Leave workshop error')
  }
})

// ===================================
// CONFIRM — POST /api/workshops/:id/confirm
// The STUDENT confirms they attended. Their escrowed credits go to the host.
// ===================================
router.post('/:id/confirm', auth, actionLimiter, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid class' })
    }
    const userId = req.user.id

    const outcome = await runInTransaction(async (dbSession) => {
      const workshop = await Workshop.findById(req.params.id).session(dbSession)
      if (!workshop) throw new LedgerError('NOT_FOUND', 'Class not found', 404)
      if (workshop.status === 'cancelled') throw new LedgerError('CLOSED', 'This class was cancelled', 409)
      if (Date.now() < workshopStart(workshop.date, workshop.time).getTime()) {
        throw new LedgerError('TOO_EARLY', 'You can confirm once the class has started', 400)
      }

      const enrollment = await Enrollment.findOne({ workshop: workshop._id, attendee: userId })
        .sort({ createdAt: -1 })
        .session(dbSession)
      if (!enrollment) {
        throw new LedgerError('NO_HOLD', 'There are no held credits for you in this class', 404)
      }
      if (enrollment.status === 'released') return { workshop, already: true }
      if (enrollment.status !== 'held') throw new LedgerError('INVALID_STATE', 'This enrollment is not active', 409)
      if (enrollment.disputed) {
        throw new LedgerError('DISPUTED', 'Your credits are frozen while the TimeBank team reviews a problem report', 409)
      }

      const released = await releaseEnrollment(enrollment._id, dbSession, { reason: 'attendee_confirmation' })
      return { workshop, enrollment: released }
    })

    if (!outcome.already) {
      const student = await User.findById(userId).select('name')
      await safeNotify({
        user: outcome.workshop.host,
        type: 'session_completed',
        fromUser: userId,
        fromName: student?.name || 'A student',
        text: `${student?.name || 'A student'} confirmed attendance in "${outcome.workshop.title}". You received ${outcome.enrollment.amount} Time Credit${outcome.enrollment.amount > 1 ? 's' : ''}.`,
        link: '/wallet'
      })
    }

    res.json({ success: true, ...(outcome.already ? { message: 'Already confirmed' } : {}) })
  } catch (error) {
    sendError(res, error, 'Confirm attendance error')
  }
})

// ===================================
// COMPLETE — POST /api/workshops/:id/complete
// The host says the class was held. This moves NO credits by itself:
// every student must confirm, then their own credits are released.
// ===================================
router.post('/:id/complete', auth, actionLimiter, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid class' })
    }
    const userId = req.user.id

    const outcome = await runInTransaction(async (dbSession) => {
      const workshop = await Workshop.findById(req.params.id).session(dbSession)
      if (!workshop) throw new LedgerError('NOT_FOUND', 'Class not found', 404)
      if (!sameId(workshop.host, userId)) throw new LedgerError('FORBIDDEN', 'Only the host can complete this class', 403)
      if (workshop.status === 'completed') return { workshop, already: true, confirmIds: [] }
      if (workshop.status !== 'upcoming') throw new LedgerError('CLOSED', 'This class is no longer open', 409)
      if (Date.now() < workshopStart(workshop.date, workshop.time).getTime()) {
        throw new LedgerError('TOO_EARLY', 'You can mark the class as completed once it has started', 400)
      }

      // Students who joined before escrow existed were never charged: hold their
      // credits now, so they confirm (or report a problem) like everyone else.
      const existing = await Enrollment.find({
        workshop: workshop._id,
        status: { $in: ['held', 'released'] }
      }).select('attendee').session(dbSession)
      const covered = new Set(existing.map(e => String(e.attendee)))

      for (const attendeeId of workshop.attendees) {
        if (covered.has(String(attendeeId))) continue
        try {
          await holdEnrollment({ workshop, attendeeId }, dbSession)
        } catch (error) {
          if (!(error instanceof LedgerError)) throw error // could not pay: skip this student
        }
      }

      const completed = await Workshop.findOneAndUpdate(
        { _id: workshop._id, host: userId, status: 'upcoming' },
        { $set: { status: 'completed', hostCompletedAt: new Date(), waitlist: [] } },
        { new: true, session: dbSession }
      )
      if (!completed) throw new LedgerError('CONFLICT', 'This class was just updated. Please try again.', 409)

      const stillHeld = await Enrollment.find({ workshop: workshop._id, status: 'held' }).select('attendee').session(dbSession)
      return { workshop: completed, confirmIds: stillHeld.map(e => String(e.attendee)) }
    })

    if (!outcome.already) {
      const host = await User.findById(userId).select('name')
      for (const attendeeId of outcome.confirmIds) {
        await safeNotify({
          user: attendeeId,
          type: 'session_reminder',
          fromUser: userId,
          fromName: host?.name || 'Host',
          text: `"${outcome.workshop.title}" was marked as completed. Please confirm you attended so your credit can be released to the host. If something went wrong, report a problem instead.`,
          link: '/workshops'
        })
      }
    }

    res.json({ success: true, workshop: outcome.workshop, ...(outcome.already ? { message: 'Already completed' } : {}) })
  } catch (error) {
    sendError(res, error, 'Complete workshop error')
  }
})

// ===================================
// CANCEL — DELETE /api/workshops/:id   (host only)
// Every credit still in escrow is refunded in the same transaction.
// ===================================
router.delete('/:id', auth, actionLimiter, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid class' })
    }
    const userId = req.user.id

    const outcome = await runInTransaction(async (dbSession) => {
      const workshop = await Workshop.findById(req.params.id).session(dbSession)
      if (!workshop) throw new LedgerError('NOT_FOUND', 'Class not found', 404)
      if (!sameId(workshop.host, userId)) throw new LedgerError('FORBIDDEN', 'Only the host can cancel this class', 403)
      if (workshop.status !== 'upcoming') {
        throw new LedgerError('CLOSED', 'Only upcoming classes can be cancelled', 409)
      }

      const held = await Enrollment.find({ workshop: workshop._id, status: 'held' }).select('_id').session(dbSession)
      for (const enrollment of held) {
        await refundEnrollment(enrollment._id, dbSession, { reason: 'cancelled' })
      }

      const cancelled = await Workshop.findOneAndUpdate(
        { _id: workshop._id, host: userId, status: 'upcoming' },
        { $set: { status: 'cancelled' } },
        { new: true, session: dbSession }
      )
      if (!cancelled) throw new LedgerError('CONFLICT', 'This class was just updated. Please try again.', 409)

      return {
        workshop: cancelled,
        attendeeIds: workshop.attendees.map(String),
        waitlistIds: workshop.waitlist.map(String)
      }
    })

    const host = await User.findById(userId).select('name')
    for (const attendeeId of outcome.attendeeIds) {
      await safeNotify({
        user: attendeeId,
        type: 'session_cancelled',
        fromUser: userId,
        fromName: host?.name || 'Host',
        text: `Class "${outcome.workshop.title}" was cancelled. Any credits held for it were refunded.`,
        link: '/workshops'
      })
    }
    for (const waitlistedId of outcome.waitlistIds) {
      await safeNotify({
        user: waitlistedId,
        type: 'session_cancelled',
        fromUser: userId,
        fromName: host?.name || 'Host',
        text: `Class "${outcome.workshop.title}" was cancelled.`,
        link: '/workshops'
      })
    }

    res.json({ success: true })
  } catch (error) {
    sendError(res, error, 'Cancel workshop error')
  }
})

module.exports = router