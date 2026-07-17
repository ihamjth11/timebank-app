const express = require('express')
const router = express.Router()
const Session = require('../models/Session')
const Review = require('../models/Review')
const User = require('../models/User')

// Returns a "YYYY-Www" key for the ISO week a date falls in, so we can
// group sessions by calendar week regardless of exact day/time.
function getISOWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${weekNo}`
}

router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId

    const completedSessions = await Session.find({
      status: 'completed',
      $or: [{ organizer: userId }, { participant: userId }]
    })

    const reviews = await Review.find({ to: userId })
    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    const user = await User.findById(userId).select('referralCount')

    const sessionCount = completedSessions.length
    const badges = []

    if (sessionCount >= 1) badges.push({ id: 'first_steps', name: 'First Steps', icon: '🌱', desc: 'Completed your first session' })
    if (sessionCount >= 5) badges.push({ id: 'getting_started', name: 'Getting Started', icon: '🔥', desc: 'Completed 5+ sessions' })
    if (sessionCount >= 15) badges.push({ id: 'timebank_champion', name: 'TimeBank Champion', icon: '🏆', desc: 'Completed 15+ sessions' })
    if (reviews.length >= 3 && avgRating >= 4.5) badges.push({ id: 'highly_rated', name: 'Highly Rated', icon: '⭐', desc: '4.5+ average rating' })
    if ((user?.referralCount || 0) >= 3) badges.push({ id: 'community_builder', name: 'Community Builder', icon: '🎁', desc: 'Referred 3+ friends' })

    // Weekly streak: consecutive weeks (counting back from this week)
    // that had at least one completed session.
    const weekSet = new Set(completedSessions.map(s => getISOWeekKey(new Date(s.updatedAt || s.createdAt))))
    let streak = 0
    let cursor = new Date()
    while (weekSet.has(getISOWeekKey(cursor))) {
      streak++
      cursor.setDate(cursor.getDate() - 7)
    }

    res.json({
      success: true,
      badges,
      streak,
      sessionCount,
      avgRating: Math.round(avgRating * 10) / 10
    })
  } catch (error) {
    console.error('Badges error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router