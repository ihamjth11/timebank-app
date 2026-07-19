const express = require('express')
const router = express.Router()
const Session = require('../models/Session')
const User = require('../models/User')

// GET /api/leaderboard?period=week|month|all
// Ranks members by how many sessions they've completed as the helper.
router.get('/', async (req, res) => {
  try {
    const period = req.query.period || 'all'
    let dateFilter = {}
    const now = new Date()

    if (period === 'week') {
      const weekAgo = new Date(now)
      weekAgo.setDate(now.getDate() - 7)
      dateFilter = { updatedAt: { $gte: weekAgo } }
    } else if (period === 'month') {
      const monthAgo = new Date(now)
      monthAgo.setMonth(now.getMonth() - 1)
      dateFilter = { updatedAt: { $gte: monthAgo } }
    }

    const sessions = await Session.find({
      status: 'completed',
      creditsTransferred: true,
      helper: { $ne: null },
      ...dateFilter
    }).select('helper')

    const counts = {}
    sessions.forEach(s => {
      const id = s.helper.toString()
      counts[id] = (counts[id] || 0) + 1
    })

    const userIds = Object.keys(counts)
    if (userIds.length === 0) {
      return res.json({ success: true, leaderboard: [], period })
    }

    const users = await User.find({ _id: { $in: userIds } }).select('name avatar location')

    const leaderboard = users
      .map(u => ({
        userId: u._id,
        name: u.name,
        avatar: u.avatar,
        location: u.location,
        sessionsHelped: counts[u._id.toString()] || 0
      }))
      .sort((a, b) => b.sessionsHelped - a.sessionsHelped)
      .slice(0, 20)

    res.json({ success: true, leaderboard, period })
  } catch (error) {
    console.error('Leaderboard error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router