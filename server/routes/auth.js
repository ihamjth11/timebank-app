// ===================================
// AUTH.JS — Register & Login Routes
// ===================================

const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const User = require('../models/User')

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// ===================================
// REGISTER — POST /api/auth/register
// ===================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please fill all fields' 
      })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already registered' 
      })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = new User({
      name,
      email,
      password: hashedPassword
    })

    await user.save()

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

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

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please fill all fields' 
      })
    }

    const user = await User.findOne({ email })
    if (!user || !user.password) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      })
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

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
// GOOGLE LOGIN — POST /api/auth/google
// ===================================
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body
    if (!credential) {
      return res.status(400).json({ success: false, message: 'No credential provided' })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    const { sub: googleId, email, name, picture } = payload

    let user = await User.findOne({ email })

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId
        if (!user.avatar) user.avatar = picture
        await user.save()
      }
    } else {
      user = new User({
        name,
        email,
        googleId,
        avatar: picture
      })
      await user.save()
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      message: 'Google login successful!',
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
    console.error('Google login error:', error)
    res.status(401).json({ success: false, message: 'Google authentication failed' })
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