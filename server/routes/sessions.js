const express = require('express')
const router = express.Router()
const Session = require('../models/Session')
const Transaction = require('../models/Transaction')
const User = require('../models/User')
const Notification = require('../models/Notification')
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

    const organizer = await User.findById(req.user.id).select('name')
    await Notification.create({
      user: participantId,
      type: 'session_scheduled',
      fromUser: req.user.id,
      fromName: organizer?.name || 'Someone',
      text: `${organizer?.name || 'Someone'} scheduled a session with you`,
      link: '/messages'
    })

    res.status(201).json({ success: true, session })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

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

// UPDATE (edit) a scheduled session — date, time, meeting link
router.put('/:id', auth, async (req, res) => {
  try {
    const { date, time, meetingLink } = req.body
    const userId = req.user.id
    const session = await Session.findById(req.params.id)

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' })
    }

    const isParty = session.organizer.toString() === userId || session.participant.toString() === userId
    if (!isParty) {
      return res.status(401).json({ success: false, message: 'Not part of this session' })
    }

    if (session.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot edit a completed session' })
    }

    if (date) session.date = date
    if (time) session.time = time
    if (meetingLink !== undefined) session.meetingLink = meetingLink

    // Editing the time re-arms both reminder flags so the new time
    // gets its own 15-minute-before and start notifications.
    session.reminder15Sent = false
    session.reminderStartSent = false

    await session.save()

    const otherUserId = session.organizer.toString() === userId ? session.participant : session.organizer
    const editor = await User.findById(userId).select('name')
    await Notification.create({
      user: otherUserId,
      type: 'session_scheduled',
      fromUser: userId,
      fromName: editor?.name || 'Someone',
      text: `${editor?.name || 'Someone'} updated your scheduled session`,
      link: '/messages'
    })

    res.json({ success: true, session })
  } catch (error) {
    console.error('Update session error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// DELETE (cancel) a scheduled session — instant, notifies the other person
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const session = await Session.findById(req.params.id)

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' })
    }

    const isParty = session.organizer.toString() === userId || session.participant.toString() === userId
    if (!isParty) {
      return res.status(401).json({ success: false, message: 'Not part of this session' })
    }

    if (session.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed session' })
    }

    const otherUserId = session.organizer.toString() === userId ? session.participant : session.organizer
    const canceller = await User.findById(userId).select('name')

    await Session.findByIdAndDelete(req.params.id)

    await Notification.create({
      user: otherUserId,
      type: 'session_cancelled',
      fromUser: userId,
      fromName: canceller?.name || 'Someone',
      text: `${canceller?.name || 'Someone'} cancelled the scheduled session`,
      link: '/messages'
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete session error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

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

    if (!session.helper) {
      session.helper = helperId
    } else if (session.helper.toString() !== helperId) {
      return res.status(400).json({
        success: false,
        message: 'Mismatch: the other person selected a different helper. Please agree on who helped.'
      })
    }

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

      await Notification.create({
        user: helperUserId,
        type: 'session_completed',
        fromUser: otherUserId,
        fromName: otherUser?.name || 'Someone',
        text: `Session completed! You earned 1 Time Credit`,
        link: '/wallet'
      })
      await Notification.create({
        user: otherUserId,
        type: 'session_completed',
        fromUser: helperUserId,
        fromName: helperUser?.name || 'Someone',
        text: `Session completed with ${helperUser?.name || 'someone'}`,
        link: '/wallet'
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