const express = require('express')
const router = express.Router()
const Session = require('../models/Session')
const Transaction = require('../models/Transaction')
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

// POST mark a session as completed (requires both users to confirm the same helper)
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const { helperId } = req.body
    const userId = req.user.id
    const session = await Session.findById(req.params.id)

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' })
    }

    const isParty = session.organizer.toString() === userId || session.participant.toString() === userId
    if (!isParty) {
      return res.status(401).json({ success: false, message: 'Not part of this session' })
    }

    if (session.creditsTransferred) {
      return res.json({ success: true, session, message: 'Already completed' })
    }

    // Set or verify helper agreement
    if (!session.helper) {
      session.helper = helperId
    } else if (session.helper.toString() !== helperId) {
      return res.status(400).json({
        success: false,
        message: 'Mismatch: the other person selected a different helper. Please agree on who helped.'
      })
    }

    // Add this user's confirmation if not already added
    const alreadyConfirmed = session.completionConfirmedBy.some(id => id.toString() === userId)
    if (!alreadyConfirmed) {
      session.completionConfirmedBy.push(userId)
    }

    const bothConfirmed =
      session.completionConfirmedBy.some(id => id.toString() === session.organizer.toString()) &&
      session.completionConfirmedBy.some(id => id.toString() === session.participant.toString())

    if (bothConfirmed && !session.creditsTransferred) {
      const helperUserId = session.helper.toString()
      const otherUserId = helperUserId === session.organizer.toString()
        ? session.participant.toString()
        : session.organizer.toString()

      const helperUser = await User.findById(helperUserId)
      const otherUser = await User.findById(otherUserId)

      helperUser.timeCredits = (helperUser.timeCredits || 0) + 1
      otherUser.timeCredits = (otherUser.timeCredits || 0) - 1

      await helperUser.save()
      await otherUser.save()

      await Transaction.create({
        from: otherUserId,
        to: helperUserId,
        session: session._id,
        amount: 1
      })

      session.status = 'completed'
      session.creditsTransferred = true
    }

    await session.save()
    res.json({ success: true, session })
  } catch (error) {
    console.error('Complete session error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router