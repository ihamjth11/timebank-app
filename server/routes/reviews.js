const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Review = require('../models/Review')
const Session = require('../models/Session')

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

// Create a review for a completed session
router.post('/', auth, async (req, res) => {
  try {
    const { sessionId, rating, comment } = req.body
    const userId = req.user.id

    if (!sessionId || !rating) {
      return res.status(400).json({ success: false, message: 'Missing fields' })
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' })
    }

    const session = await Session.findById(sessionId)
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' })
    }
    if (session.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Session is not completed yet' })
    }

    const isOrganizer = session.organizer.toString() === userId
    const isParticipant = session.participant.toString() === userId
    if (!isOrganizer && !isParticipant) {
      return res.status(401).json({ success: false, message: 'Not part of this session' })
    }

    const toUserId = isOrganizer ? session.participant : session.organizer

    const existing = await Review.findOne({ session: sessionId, from: userId })
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already rated this session' })
    }

    const review = await Review.create({
      session: sessionId,
      from: userId,
      to: toUserId,
      rating,
      comment: comment || ''
    })

    res.status(201).json({ success: true, review })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You already rated this session' })
    }
    console.error('Create review error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Get all reviews received by a user, plus their average rating
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ to: req.params.userId })
      .populate('from', 'name')
      .sort({ createdAt: -1 })

    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    res.json({
      success: true,
      reviews,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length
    })
  } catch (error) {
    console.error('Get reviews error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Check whether the current user has already reviewed a given session
router.get('/session/:sessionId/mine', auth, async (req, res) => {
  try {
    const existing = await Review.findOne({ session: req.params.sessionId, from: req.user.id })
    res.json({ success: true, reviewed: !!existing })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router