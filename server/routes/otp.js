const express = require('express')
const router = express.Router()
const Otp = require('../models/Otp')
const User = require('../models/User')
const { generateOTP, sendOTPEmail } = require('../utils/emailHelper')

// Send OTP
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })

    // Check if email already verified
    const existingUser = await User.findOne({ email })
    if (existingUser?.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' })
    }

    // Delete old OTPs for this email
    await Otp.deleteMany({ email })

    // Generate and save new OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await Otp.create({ email, otp, expiresAt })

    // Send email
    await sendOTPEmail(email, otp)

    res.json({ success: true, message: 'OTP sent to your email' })
  } catch (err) {
    console.error('Send OTP error:', err)
    res.status(500).json({ message: 'Failed to send OTP' })
  }
})

// Verify OTP
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' })

    const record = await Otp.findOne({ email, otp })

    if (!record) return res.status(400).json({ message: 'Invalid OTP' })
    if (record.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired. Please request a new one.' })

    // Mark email as verified
    await User.findOneAndUpdate({ email }, { emailVerified: true })

    // Delete used OTP
    await Otp.deleteMany({ email })

    res.json({ success: true, message: 'Email verified successfully!' })
  } catch (err) {
    console.error('Verify OTP error:', err)
    res.status(500).json({ message: 'Failed to verify OTP' })
  }
})

module.exports = router