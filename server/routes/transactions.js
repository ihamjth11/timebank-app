const express = require('express')
const router = express.Router()
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

// GET transaction history for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id

    const txns = await Transaction.find({
      $or: [{ from: userId }, { to: userId }]
    }).sort({ createdAt: -1 })

    const otherIds = [...new Set(txns.map(t =>
      t.from.toString() === userId ? t.to.toString() : t.from.toString()
    ))]
    const users = await User.find({ _id: { $in: otherIds } }).select('name')

    const result = txns.map(t => {
      const isEarn = t.to.toString() === userId
      const otherId = isEarn ? t.from.toString() : t.to.toString()
      const otherUser = users.find(u => u._id.toString() === otherId)
      return {
        _id: t._id,
        type: isEarn ? 'earn' : 'spend',
        amount: t.amount,
        otherName: otherUser?.name || 'Unknown',
        createdAt: t.createdAt
      }
    })

    res.json({ success: true, transactions: result })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router