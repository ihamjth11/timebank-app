const express = require('express')
const router = express.Router()
const Message = require('../models/Message')
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

router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).sort({ createdAt: -1 })

    const convoMap = {}

    for (const msg of messages) {
      const otherId = msg.sender.toString() === userId ? msg.receiver.toString() : msg.sender.toString()
      if (!convoMap[otherId]) {
        convoMap[otherId] = {
          otherUserId: otherId,
          lastMessage: msg.text,
          lastTime: msg.createdAt,
          unread: 0
        }
      }
      if (msg.receiver.toString() === userId && !msg.read) {
        convoMap[otherId].unread += 1
      }
    }

    const otherIds = Object.keys(convoMap)
    const users = await User.find({ _id: { $in: otherIds } }).select('name email')

    const conversations = otherIds.map(id => {
      const u = users.find(u => u._id.toString() === id)
      return {
        ...convoMap[id],
        name: u?.name || 'Unknown User',
        email: u?.email || ''
      }
    }).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime))

    res.json({ success: true, conversations })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.get('/:userId', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const otherId = req.params.userId

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherId },
        { sender: otherId, receiver: userId }
      ]
    }).sort({ createdAt: 1 })

    await Message.updateMany(
      { sender: otherId, receiver: userId, read: false },
      { read: true }
    )

    res.json({ success: true, messages })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, text } = req.body
    if (!receiverId || !text) {
      return res.status(400).json({ success: false, message: 'Missing fields' })
    }

    const message = new Message({
      sender: req.user.id,
      receiver: receiverId,
      text
    })

    await message.save()

    const sender = await User.findById(req.user.id).select('name')
    await Notification.create({
      user: receiverId,
      type: 'message',
      fromUser: req.user.id,
      fromName: sender?.name || 'Someone',
      text: `${sender?.name || 'Someone'} sent you a message`,
      link: '/messages'
    })

    res.status(201).json({ success: true, message })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.delete('/:otherUserId', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const otherId = req.params.otherUserId

    await Message.deleteMany({
      $or: [
        { sender: userId, receiver: otherId },
        { sender: otherId, receiver: userId }
      ]
    })

    res.json({ success: true, message: 'Conversation deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.delete('/single/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId)
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' })
    }
    if (message.sender.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' })
    }
    await message.deleteOne()
    res.json({ success: true, message: 'Message deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router