const express = require('express')
const router = express.Router()
const Workshop = require('../models/Workshop')
const User = require('../models/User')
const Notification = require('../models/Notification')
const Transaction = require('../models/Transaction')
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

// GET /api/workshops — list upcoming workshops (optionally filtered by category)
router.get('/', async (req, res) => {
  try {
    const filter = { status: 'upcoming' }
    if (req.query.category && req.query.category !== 'All') filter.category = req.query.category

    const workshops = await Workshop.find(filter)
      .populate('host', 'name avatar location')
      .sort({ date: 1, time: 1 })

    const withCounts = workshops.map(w => ({
      _id: w._id,
      host: w.host,
      title: w.title,
      description: w.description,
      category: w.category,
      date: w.date,
      time: w.time,
      durationMinutes: w.durationMinutes,
      meetingLink: w.meetingLink,
      capacity: w.capacity,
      creditsPerPerson: w.creditsPerPerson,
      attendeeCount: w.attendees.length,
      waitlistCount: w.waitlist.length,
      waitlist: w.waitlist,
      attendees: w.attendees,
      status: w.status
    }))

    res.json({ success: true, workshops: withCounts })
  } catch (error) {
    console.error('List workshops error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET /api/workshops/mine — workshops the current user is hosting or attending
router.get('/mine', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const workshops = await Workshop.find({
      $or: [{ host: userId }, { attendees: userId }]
    }).populate('host', 'name avatar location').sort({ date: 1, time: 1 })

    res.json({ success: true, workshops })
  } catch (error) {
    console.error('My workshops error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST /api/workshops — host creates a new class/workshop
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, date, time, durationMinutes, meetingLink, capacity, creditsPerPerson } = req.body
    if (!title || !date || !time) {
      return res.status(400).json({ success: false, message: 'Title, date, and time are required' })
    }

    const workshop = await Workshop.create({
      host: req.user.id,
      title,
      description: description || '',
      category: category || 'Other',
      date,
      time,
      durationMinutes: durationMinutes || 60,
      meetingLink: meetingLink || '',
      capacity: capacity || 10,
      creditsPerPerson: creditsPerPerson || 1
    })

    res.status(201).json({ success: true, workshop })
  } catch (error) {
    console.error('Create workshop error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST /api/workshops/:id/join — attendee joins a class
router.post('/:id/join', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const workshop = await Workshop.findById(req.params.id)
    if (!workshop) return res.status(404).json({ success: false, message: 'Class not found' })

    if (workshop.host.toString() === userId) {
      return res.status(400).json({ success: false, message: "You can't join your own class" })
    }
    if (workshop.attendees.some(a => a.toString() === userId)) {
      return res.status(400).json({ success: false, message: 'Already joined' })
    }
    if (workshop.waitlist.some(a => a.toString() === userId)) {
      return res.status(400).json({ success: false, message: 'Already on the waitlist' })
    }

    const student = await User.findById(userId)
    const host = await User.findById(workshop.host).select('name')
    const isFull = workshop.attendees.length >= workshop.capacity

    if (isFull) {
      // Class is full — join the waitlist instead of the roster. No credits
      // are charged until a spot opens up and they're promoted.
      workshop.waitlist.push(userId)
      await workshop.save()

      await Notification.create({
        user: workshop.host,
        type: 'session_scheduled',
        fromUser: userId,
        fromName: student?.name || 'Someone',
        text: `${student?.name || 'Someone'} joined the waitlist for "${workshop.title}"`,
        link: '/workshops'
      })

      return res.json({ success: true, workshop, waitlisted: true })
    }

    if ((student.timeCredits || 0) < workshop.creditsPerPerson) {
      return res.status(400).json({ success: false, message: 'Not enough Time Credits to join' })
    }

    workshop.attendees.push(userId)
    await workshop.save()

    await Notification.create({
      user: workshop.host,
      type: 'session_scheduled',
      fromUser: userId,
      fromName: student?.name || 'Someone',
      text: `${student?.name || 'Someone'} joined your class "${workshop.title}"`,
      link: '/workshops'
    })

    res.json({ success: true, workshop, waitlisted: false })
  } catch (error) {
    console.error('Join workshop error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST /api/workshops/:id/leave — attendee or waitlisted user leaves.
// If a confirmed attendee leaves and there's a spot open, the next
// person on the waitlist is automatically promoted and notified.
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const workshop = await Workshop.findById(req.params.id)
    if (!workshop) return res.status(404).json({ success: false, message: 'Class not found' })

    const wasAttendee = workshop.attendees.some(a => a.toString() === userId)
    workshop.attendees = workshop.attendees.filter(a => a.toString() !== userId)
    workshop.waitlist = workshop.waitlist.filter(a => a.toString() !== userId)

    let promoted = null
    if (wasAttendee && workshop.waitlist.length > 0 && workshop.attendees.length < workshop.capacity) {
      promoted = workshop.waitlist.shift()
      workshop.attendees.push(promoted)
    }

    await workshop.save()

    if (promoted) {
      await Notification.create({
        user: promoted,
        type: 'session_scheduled',
        fromUser: workshop.host,
        fromName: 'TimeBank',
        text: `A spot opened up — you're now confirmed for "${workshop.title}"!`,
        link: '/workshops'
      })
    }

    res.json({ success: true, workshop })
  } catch (error) {
    console.error('Leave workshop error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST /api/workshops/:id/complete — host marks the class as done, settles credits
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const workshop = await Workshop.findById(req.params.id)
    if (!workshop) return res.status(404).json({ success: false, message: 'Class not found' })

    if (workshop.host.toString() !== userId) {
      return res.status(401).json({ success: false, message: 'Only the host can complete this class' })
    }
    if (workshop.creditsSettled) {
      return res.json({ success: true, workshop, message: 'Already settled' })
    }

    const host = await User.findById(workshop.host)
    let totalEarned = 0

    for (const attendeeId of workshop.attendees) {
      const attendee = await User.findById(attendeeId)
      if (!attendee || (attendee.timeCredits || 0) < workshop.creditsPerPerson) continue

      attendee.timeCredits -= workshop.creditsPerPerson
      await attendee.save()
      totalEarned += workshop.creditsPerPerson

      await Transaction.create({
        from: attendeeId,
        to: workshop.host,
        amount: workshop.creditsPerPerson
      })
    }

    host.timeCredits = (host.timeCredits || 0) + totalEarned
    await host.save()

    workshop.status = 'completed'
    workshop.creditsSettled = true
    await workshop.save()

    for (const attendeeId of workshop.attendees) {
      await Notification.create({
        user: attendeeId,
        type: 'session_completed',
        fromUser: workshop.host,
        fromName: host?.name || 'Host',
        text: `Class "${workshop.title}" completed`,
        link: '/workshops'
      })
    }

    res.json({ success: true, workshop })
  } catch (error) {
    console.error('Complete workshop error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// DELETE /api/workshops/:id — host cancels the class
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const workshop = await Workshop.findById(req.params.id)
    if (!workshop) return res.status(404).json({ success: false, message: 'Class not found' })

    if (workshop.host.toString() !== userId) {
      return res.status(401).json({ success: false, message: 'Only the host can cancel this class' })
    }

    const host = await User.findById(userId).select('name')
    for (const attendeeId of workshop.attendees) {
      await Notification.create({
        user: attendeeId,
        type: 'session_cancelled',
        fromUser: userId,
        fromName: host?.name || 'Host',
        text: `Class "${workshop.title}" was cancelled`,
        link: '/workshops'
      })
    }

    await Workshop.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Cancel workshop error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router