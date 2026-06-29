const express = require('express')
const router = express.Router()
const Skill = require('../models/Skill')
const jwt = require('jsonwebtoken')

// Auth middleware
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

// GET all skills
router.get('/', async (req, res) => {
  try {
    const { category, type, search } = req.query
    let query = { isActive: true }

    if (category) query.category = category
    if (type) query.type = type
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    const skills = await Skill.find(query).sort({ createdAt: -1 })
    res.json({ success: true, skills })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST create skill
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, type, credits, location, tags } = req.body

    const User = require('../models/User')
    const user = await User.findById(req.user.id)

    const skill = new Skill({
      user: req.user.id,
      userName: user.name,
      title,
      description,
      category,
      type,
      credits: credits || 1,
      location: location || 'Online',
      tags: tags || []
    })

    await skill.save()
    res.status(201).json({ success: true, skill })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET single skill
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' })
    skill.views += 1
    await skill.save()
    res.json({ success: true, skill })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// DELETE skill
router.delete('/:id', auth, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' })
    if (skill.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' })
    }
    await skill.deleteOne()
    res.json({ success: true, message: 'Skill deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router