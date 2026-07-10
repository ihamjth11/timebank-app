const express = require('express')
const router = express.Router()
const Session = require('../models/Session')
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

// POST create/schedule a session
router.post('/', auth, async (req, res) => {
  try {
    const { participantId, date, time, meetingLink } = req.body
    if (!participantId || !date || !time) {
      return res.status(400).json({ success: false, message: 'Missing fields' })
    }

    const session = new Session({
      organizer: req.user.id,
      participant: participantId,
      date,
      time,
      meetingLink: meetingLink || ''
    })

    await session.save()
    res.status(201).json({ success: true, session })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET sessions between logged in user and another user
router.get('/:otherUserId', auth, async (req, res) => {
  try {
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

module.exports = router