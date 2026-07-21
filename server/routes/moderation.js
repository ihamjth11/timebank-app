const express = require('express')
const router = express.Router()
const Report = require('../models/Report')
const User = require('../models/User')
const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ success: false, message: 'No token' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

const requireAdmin = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('isAdmin')
  if (!user?.isAdmin) {
    return res.status(403).json({ success: false, message: 'Admin access required' })
  }
  next()
}

// ===== REPORTS =====

// POST /api/moderation/reports — file a report against a user
router.post('/reports', auth, async (req, res) => {
  try {
    const { reportedUserId, reason, details } = req.body
    if (!reportedUserId || !reason) {
      return res.status(400).json({ success: false, message: 'Missing fields' })
    }
    if (reportedUserId === req.user.id) {
      return res.status(400).json({ success: false, message: "You can't report yourself" })
    }

    const report = await Report.create({
      reporter: req.user.id,
      reportedUser: reportedUserId,
      reason,
      details: details || ''
    })

    res.status(201).json({ success: true, report })
  } catch (error) {
    console.error('Create report error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET /api/moderation/reports — admin only, list all reports (newest first)
router.get('/reports', auth, requireAdmin, async (req, res) => {
  try {
    const filter = {}
    if (req.query.status) filter.status = req.query.status

    const reports = await Report.find(filter)
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .sort({ createdAt: -1 })

    res.json({ success: true, reports })
  } catch (error) {
    console.error('List reports error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/moderation/reports/:id — admin only, update report status
router.put('/reports/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body
    if (!['pending', 'reviewed', 'dismissed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' })
    }

    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' })

    res.json({ success: true, report })
  } catch (error) {
    console.error('Update report error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ===== BLOCK / UNBLOCK =====

// POST /api/moderation/block/:userId
router.post('/block/:userId', auth, async (req, res) => {
  try {
    const targetId = req.params.userId
    if (targetId === req.user.id) {
      return res.status(400).json({ success: false, message: "You can't block yourself" })
    }

    const user = await User.findById(req.user.id)
    if (!user.blockedUsers.some(id => id.toString() === targetId)) {
      user.blockedUsers.push(targetId)
      await user.save()
    }

    res.json({ success: true, blockedUsers: user.blockedUsers })
  } catch (error) {
    console.error('Block user error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST /api/moderation/unblock/:userId
router.post('/unblock/:userId', auth, async (req, res) => {
  try {
    const targetId = req.params.userId
    const user = await User.findById(req.user.id)
    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== targetId)
    await user.save()

    res.json({ success: true, blockedUsers: user.blockedUsers })
  } catch (error) {
    console.error('Unblock user error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET /api/moderation/blocked — list users the current account has blocked
router.get('/blocked', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('blockedUsers', 'name avatar location')
    res.json({ success: true, blockedUsers: user.blockedUsers })
  } catch (error) {
    console.error('List blocked users error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/moderation/users/:userId/suspend — admin only, deactivate an account.
// Suspended accounts are blocked at login (see auth.js). Existing active
// sessions/tokens remain valid until they naturally expire.
router.put('/users/:userId/suspend', auth, requireAdmin, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId)
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' })

    targetUser.isActive = false
    await targetUser.save()

    res.json({ success: true, message: `${targetUser.name} has been suspended` })
  } catch (error) {
    console.error('Suspend user error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/moderation/users/:userId/reactivate — admin only, restore an account
router.put('/users/:userId/reactivate', auth, requireAdmin, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId)
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' })

    targetUser.isActive = true
    await targetUser.save()

    res.json({ success: true, message: `${targetUser.name} has been reactivated` })
  } catch (error) {
    console.error('Reactivate user error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router