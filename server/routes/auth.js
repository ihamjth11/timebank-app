// ===================================
// AUTH.JS — Register & Login Routes
// ===================================

const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const rateLimit = require('express-rate-limit')
const User = require('../models/User')

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// Limits login/register/Google-login attempts per IP — slows down
// brute-force and credential-stuffing attacks.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' }
})

const REFERRAL_BONUS = 2 // credits given to both the new user and the referrer

async function generateUniqueReferralCode() {
  let code
  let exists = true
  while (exists) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase()
    exists = await User.findOne({ referralCode: code })
  }
  return code
}

// ===================================
// REGISTER — POST /api/auth/register
// ===================================
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, refCode } = req.body

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
    const referralCode = await generateUniqueReferralCode()

    const user = new User({
      name,
      email,
      password: hashedPassword,
      referralCode
    })

    // If a valid referral code was supplied, link the accounts and
    // award a signup bonus to the new user.
    let referrer = null
    if (refCode) {
      referrer = await User.findOne({ referralCode: refCode.toUpperCase() })
      if (referrer) {
        user.referredBy = referrer._id
        user.timeCredits = (user.timeCredits ?? 5) + REFERRAL_BONUS
      }
    }

    await user.save()

    // Reward the referrer separately, after the new user is saved.
    if (referrer) {
      referrer.timeCredits = (referrer.timeCredits || 0) + REFERRAL_BONUS
      referrer.referralCount = (referrer.referralCount || 0) + 1
      await referrer.save()
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        timeCredits: user.timeCredits,
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        isAdmin: user.isAdmin || false,
        blockedUsers: user.blockedUsers || []
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

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please fill all fields' 
      })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user || !user.password) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      })
    }

    // Account-level lockout: after too many wrong passwords, block further
    // attempts on THIS account for a cooldown period, even from other IPs.
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000)
      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000)
        user.failedLoginAttempts = 0
      }
      await user.save()

      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      })
    }

    // Successful password match — clear any lockout state
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      user.failedLoginAttempts = 0
      user.lockUntil = null
      await user.save()
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended. Contact TimeBank support if you think this is a mistake.'
      })
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
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
        location: user.location,
        bio: user.bio,
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        isAdmin: user.isAdmin || false,
        blockedUsers: user.blockedUsers || []
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
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { credential, refCode } = req.body
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
    let referrer = null

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId
        if (!user.avatar) user.avatar = picture
        await user.save()
      }
    } else {
      const referralCode = await generateUniqueReferralCode()
      user = new User({
        name,
        email,
        googleId,
        avatar: picture,
        referralCode
      })

      if (refCode) {
        referrer = await User.findOne({ referralCode: refCode.toUpperCase() })
        if (referrer) {
          user.referredBy = referrer._id
          user.timeCredits = (user.timeCredits ?? 5) + REFERRAL_BONUS
        }
      }

      await user.save()

      if (referrer) {
        referrer.timeCredits = (referrer.timeCredits || 0) + REFERRAL_BONUS
        referrer.referralCount = (referrer.referralCount || 0) + 1
        await referrer.save()
      }
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended. Contact TimeBank support if you think this is a mistake.'
      })
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
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
        location: user.location,
        bio: user.bio,
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        isAdmin: user.isAdmin || false,
        blockedUsers: user.blockedUsers || []
      }
    })

  } catch (error) {
    console.error('Google login error:', error)
    res.status(401).json({ success: false, message: 'Google authentication failed' })
  }
})

// ===================================
// UPDATE PROFILE — PUT /api/auth/profile
// ===================================
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const { name, bio, location, avatar } = req.body

    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (name) user.name = name
    if (bio !== undefined) user.bio = bio
    if (location) user.location = location
    if (avatar !== undefined) user.avatar = avatar

    await user.save()

    res.json({
      success: true,
      message: 'Profile updated!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        timeCredits: user.timeCredits,
        skills: user.skills,
        avatar: user.avatar,
        location: user.location,
        bio: user.bio,
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        isAdmin: user.isAdmin || false,
        blockedUsers: user.blockedUsers || []
      }
    })

  } catch (error) {
    console.error('Update profile error:', error)
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0]
      return res.status(400).json({ success: false, message: firstError?.message || 'Invalid profile data' })
    }
    res.status(500).json({ success: false, message: 'Server error' })
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

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        timeCredits: user.timeCredits,
        skills: user.skills,
        avatar: user.avatar,
        location: user.location,
        bio: user.bio,
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        isAdmin: user.isAdmin || false,
        blockedUsers: user.blockedUsers || []
      }
    })

  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    })
  }
})

// GET PUBLIC PROFILE — GET /api/auth/user/:id
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email -googleId')
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    res.json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router