// ===================================
// ENROLLMENTS.JS — Read-only view of class credits held in escrow
//
// GET /api/enrollments/mine
//   asStudent: credits I paid that are still held, per class
//   asHost:    credits students paid me that are still held, grouped per class
// ===================================

const express = require('express')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const router = express.Router()
const Enrollment = require('../models/Enrollment')
const Workshop = require('../models/Workshop')

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ success: false, message: 'No token' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (typeof decoded.id !== 'string' || !/^[a-f\d]{24}$/i.test(decoded.id)) {
      return res.status(401).json({ success: false, message: 'Invalid token' })
    }
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

router.get('/mine', auth, async (req, res) => {
  try {
    const userId = req.user.id

    const studentDocs = await Enrollment.find({ attendee: userId, status: 'held' })
      .select('amount disputed workshop')
      .populate('workshop', 'title date time status')
      .sort({ createdAt: -1 })
      .limit(100)

    const asStudent = studentDocs
      .filter(e => e.workshop)
      .map(e => ({
        _id: e._id,
        amount: e.amount,
        disputed: !!e.disputed,
        workshop: {
          _id: e.workshop._id,
          title: e.workshop.title,
          date: e.workshop.date,
          time: e.workshop.time,
          status: e.workshop.status
        }
      }))

    const hostRows = await Enrollment.aggregate([
      { $match: { host: new mongoose.Types.ObjectId(userId), status: 'held' } },
      { $group: { _id: '$workshop', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
      { $limit: 100 }
    ])
    const hostWorkshops = await Workshop.find({ _id: { $in: hostRows.map(r => r._id) } })
      .select('title date time status')
    const workshopById = new Map(hostWorkshops.map(w => [String(w._id), w]))

    const asHost = hostRows
      .filter(r => workshopById.has(String(r._id)))
      .map(r => {
        const w = workshopById.get(String(r._id))
        return {
          workshopId: w._id,
          title: w.title,
          date: w.date,
          time: w.time,
          status: w.status,
          count: r.count,
          amount: r.amount
        }
      })

    res.json({ success: true, asStudent, asHost })
  } catch (error) {
    console.error('My enrollments error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router