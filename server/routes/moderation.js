const express = require('express')
const rateLimit = require('express-rate-limit')
const router = express.Router()
const Report = require('../models/Report')
const User = require('../models/User')
const Notification = require('../models/Notification')
const { sendPushToUser } = require('../utils/pushHelper')
const { invalidateActiveUser } = require('../utils/activeUserGuard')
const jwt = require('jsonwebtoken')

const REPORT_REASONS = ['spam', 'harassment', 'inappropriate_content', 'no_show', 'fraud', 'other']
const REPORT_STATUSES = ['pending', 'reviewed', 'dismissed']

function isValidId(value) {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)
}

const sameId = (a, b) => String(a) === String(b)

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

// ---------- Rate limits (per user, run after auth) ----------
const limiterBase = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?.id || 'anonymous')
}
// A report alerts every admin, so it is limited tightly
const reportLimiter = rateLimit({
  ...limiterBase,
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'You have sent too many reports. Please try again later.' }
})
const blockLimiter = rateLimit({
  ...limiterBase,
  max: 30,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' }
})
const adminLimiter = rateLimit({
  ...limiterBase,
  max: 120,
  message: { success: false, message: 'Too many requests. Please slow down.' }
})

function serverError(res, label, error) {
  console.error(`${label}:`, error)
  res.status(500).json({ success: false, message: 'Server error' })
}

// ===== REPORTS =====

// POST /api/moderation/reports — file a report against a user
router.post('/reports', auth, reportLimiter, async (req, res) => {
  try {
    const { reportedUserId, reason, details } = req.body || {}

    if (!isValidId(reportedUserId) || !REPORT_REASONS.includes(reason)) {
      return res.status(400).json({ success: false, message: 'Please choose a user and a valid reason' })
    }
    if (sameId(reportedUserId, req.user.id)) {
      return res.status(400).json({ success: false, message: "You can't report yourself" })
    }
    const cleanDetails = typeof details === 'string' ? details.trim() : ''
    if (cleanDetails.length > 1000) {
      return res.status(400).json({ success: false, message: 'Details are too long (max 1000 characters)' })
    }

    const reportedUser = await User.findById(reportedUserId).select('name')
    if (!reportedUser) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // One open report per person per user is enough
    const duplicate = await Report.findOne({ reporter: req.user.id, reportedUser: reportedUserId, status: 'pending' })
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'You already reported this user. Our team will review it.' })
    }

    const report = await Report.create({
      reporter: req.user.id,
      reportedUser: reportedUserId,
      reason,
      details: cleanDetails
    })

    // Confirm to the reporter that it went through, and alert every admin
    // so reports don't sit unnoticed until someone checks the panel.
    const reporter = await User.findById(req.user.id).select('name')
    await Notification.create({
      user: req.user.id,
      type: 'report_filed',
      fromUser: req.user.id,
      fromName: reporter?.name || 'You',
      text: 'Your report was submitted. Our team will review it shortly.',
      link: '/profile'
    })

    const admins = await User.find({ isAdmin: true }).select('_id')
    await Promise.all(admins.map(admin => Notification.create({
      user: admin._id,
      type: 'report_received',
      fromUser: req.user.id,
      fromName: reporter?.name || 'Someone',
      text: `${reporter?.name || 'Someone'} filed a new report — review it in Moderation`,
      link: '/admin/moderation'
    })))
    await Promise.all(admins.map(admin => sendPushToUser(admin._id, {
      title: 'TimeBank Moderation',
      body: `${reporter?.name || 'Someone'} filed a new report`,
      link: '/admin/moderation'
    })))

    res.status(201).json({ success: true, report })
  } catch (error) {
    serverError(res, 'Create report error', error)
  }
})

// GET /api/moderation/reports — admin only, list reports (newest first)
router.get('/reports', auth, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const filter = {}
    if (typeof req.query.status === 'string' && REPORT_STATUSES.includes(req.query.status)) {
      filter.status = req.query.status
    }

    const reports = await Report.find(filter)
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .sort({ createdAt: -1 })
      .limit(200)

    res.json({ success: true, reports })
  } catch (error) {
    serverError(res, 'List reports error', error)
  }
})

// PUT /api/moderation/reports/:id — admin only, update report status
router.put('/reports/:id', auth, requireAdmin, adminLimiter, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid report' })
    }
    const status = (req.body || {}).status
    if (!REPORT_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' })
    }

    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' })

    res.json({ success: true, report })
  } catch (error) {
    serverError(res, 'Update report error', error)
  }
})

// ===== BLOCK / UNBLOCK =====

// POST /api/moderation/block/:userId
router.post('/block/:userId', auth, blockLimiter, async (req, res) => {
  try {
    const targetId = req.params.userId
    if (!isValidId(targetId)) {
      return res.status(400).json({ success: false, message: 'Invalid user' })
    }
    if (sameId(targetId, req.user.id)) {
      return res.status(400).json({ success: false, message: "You can't block yourself" })
    }

    const blockedPerson = await User.findById(targetId).select('name')
    if (!blockedPerson) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // $addToSet is atomic: no duplicates, even with two quick taps
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { blockedUsers: targetId } },
      { new: true }
    ).select('name blockedUsers')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    await Notification.create({
      user: req.user.id,
      type: 'user_blocked',
      fromUser: req.user.id,
      fromName: user.name,
      text: `You blocked ${blockedPerson.name || 'this user'}. They can no longer message you.`,
      link: '/profile'
    })

    // Also let the other person know, worded neutrally rather than
    // announcing "you were blocked" to keep things low-conflict.
    await Notification.create({
      user: targetId,
      type: 'user_blocked',
      fromUser: req.user.id,
      fromName: 'TimeBank',
      text: `You can no longer message ${user.name} or see their listings.`,
      link: '/messages'
    })

    res.json({ success: true, blockedUsers: user.blockedUsers })
  } catch (error) {
    serverError(res, 'Block user error', error)
  }
})

// POST /api/moderation/unblock/:userId
router.post('/unblock/:userId', auth, blockLimiter, async (req, res) => {
  try {
    const targetId = req.params.userId
    if (!isValidId(targetId)) {
      return res.status(400).json({ success: false, message: 'Invalid user' })
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { blockedUsers: targetId } },
      { new: true }
    ).select('name blockedUsers')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    const unblockedPerson = await User.findById(targetId).select('name')
    await Notification.create({
      user: req.user.id,
      type: 'user_blocked',
      fromUser: req.user.id,
      fromName: user.name,
      text: `You unblocked ${unblockedPerson?.name || 'this user'}.`,
      link: '/profile'
    })

    res.json({ success: true, blockedUsers: user.blockedUsers })
  } catch (error) {
    serverError(res, 'Unblock user error', error)
  }
})

// GET /api/moderation/blocked — list users the current account has blocked
router.get('/blocked', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('blockedUsers', 'name avatar location')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    res.json({ success: true, blockedUsers: user.blockedUsers })
  } catch (error) {
    serverError(res, 'List blocked users error', error)
  }
})

// ===== SUSPEND / REACTIVATE (admin only) =====

// PUT /api/moderation/users/:userId/suspend — deactivate an account.
// A suspended account is refused on login AND on every API call that still
// carries an old token (see utils/activeUserGuard.js).
router.put('/users/:userId/suspend', auth, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const targetId = req.params.userId
    if (!isValidId(targetId)) {
      return res.status(400).json({ success: false, message: 'Invalid user' })
    }
    if (sameId(targetId, req.user.id)) {
      return res.status(400).json({ success: false, message: "You can't suspend your own account" })
    }

    const targetUser = await User.findById(targetId).select('name isAdmin')
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' })
    if (targetUser.isAdmin) {
      return res.status(403).json({ success: false, message: 'An admin account cannot be suspended here' })
    }

    // updateOne changes only this field (a full save() would re-validate the whole user)
    await User.updateOne({ _id: targetId }, { $set: { isActive: false } })
    invalidateActiveUser(targetId)
    console.log(`[moderation] admin ${req.user.id} suspended user ${targetId}`)

    res.json({ success: true, message: `${targetUser.name} has been suspended` })
  } catch (error) {
    serverError(res, 'Suspend user error', error)
  }
})

// PUT /api/moderation/users/:userId/reactivate — restore an account
router.put('/users/:userId/reactivate', auth, requireAdmin, adminLimiter, async (req, res) => {
  try {
    const targetId = req.params.userId
    if (!isValidId(targetId)) {
      return res.status(400).json({ success: false, message: 'Invalid user' })
    }

    const targetUser = await User.findById(targetId).select('name')
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' })

    await User.updateOne({ _id: targetId }, { $set: { isActive: true } })
    invalidateActiveUser(targetId)
    console.log(`[moderation] admin ${req.user.id} reactivated user ${targetId}`)

    res.json({ success: true, message: `${targetUser.name} has been reactivated` })
  } catch (error) {
    serverError(res, 'Reactivate user error', error)
  }
})

module.exports = router