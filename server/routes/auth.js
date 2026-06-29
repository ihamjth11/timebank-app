// ===================================
// AUTH.JS — Register & Login Routes
// ===================================

const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

// ===================================
// REGISTER — POST /api/auth/register
// ===================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    // 1. all fields-check
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please fill all fields' 
      })
    }

    // 2. Email already exist -check
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already registered' 
      })
    }

    // 3. Password hash
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // 4. New user create 
    const user = new User({
      name,
      email,
      password: hashedPassword
    })

    await user.save()

    // 5. JWT token create 
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // 6. Response
    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        timeCredits: user.timeCredits
      }
    })

  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    })
  }
})

// ===================================
// LOGIN — POST /api/auth/login
// ===================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // 1. Fields check
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please fill all fields' 
      })
    }

    // 2. User exist -check
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      })
    }

    // 3. Password match -check
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      })
    }

    // 4. JWT token create 
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // 5. Response
    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        timeCredits: user.timeCredits,
        skills: user.skills,
        avatar: user.avatar,
        location: user.location
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    })
  }
})

// ===================================
// GET ME — GET /api/auth/me
// ===================================
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token' 
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')

    res.json({ success: true, user })

  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    })
  }
})

module.exports = router