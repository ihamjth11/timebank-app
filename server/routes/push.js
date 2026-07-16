const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const PushSubscription = require('../models/PushSubscription')

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

router.post('/subscribe', auth, async (req, res) => {
  try {
    const { endpoint, keys } = req.body
    if (!endpoint || !keys) {
      return res.status(400).json({ success: false, message: 'Invalid subscription' })
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { user: req.user.id, endpoint, keys },
      { upsert: true, new: true }
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Push subscribe error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.delete('/unsubscribe', auth, async (req, res) => {
  try {
    const { endpoint } = req.body
    if (endpoint) await PushSubscription.deleteOne({ endpoint })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router