const express = require('express')
const router = express.Router()
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

// GET notifications for logged in user
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30)
    res.json({ success: true, notifications })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST mark all as read
router.post('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router