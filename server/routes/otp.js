const express = require('express')
const router = express.Router()
const Otp = require('../models/Otp')
const User = require('../models/User')
const { generateOTP, sendOTPEmail } = require('../utils/emailHelper')

const OTP_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes
const RESEND_COOLDOWN_MS = 30 * 1000 // 30 seconds between sends per email
const MAX_ATTEMPTS = 5 // wrong guesses allowed per OTP

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

// Send OTP (used by both registration and forgot-password flows)
router.post('/send', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    if (!email) return res.status(400).json({ message: 'Email is required' })

    // Block email bombing: one OTP per cooldown window
    const recent = await Otp.findOne({ email }).sort({ createdAt: -1 })
    if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      return res.status(429).json({ message: 'Please wait a few seconds before requesting another code' })
    }

    // Remove any old OTPs for this email
    await Otp.deleteMany({ email })

    const otp = generateOTP()
    const record = await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS)
    })

    try {
      await sendOTPEmail(email, otp)
    } catch (mailErr) {
      // Email failed: remove the OTP so the user can retry immediately
      await Otp.deleteOne({ _id: record._id })
      console.error('Send OTP email error:', mailErr.message)
      return res.status(502).json({ message: 'Could not send the email. Please try again in a moment.' })
    }

    res.json({ success: true, message: 'OTP sent to your email' })
  } catch (err) {
    console.error('Send OTP error:', err)
    res.status(500).json({ message: 'Failed to send OTP' })
  }
})

// Verify OTP
router.post('/verify', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const otp = String(req.body.otp || '').trim()
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' })

    const record = await Otp.findOne({ email })
    if (!record) {
      return res.status(400).json({ message: 'No active code found. Please request a new one.' })
    }

    if (record.expiresAt < new Date()) {
      await Otp.deleteMany({ email })
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' })
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await Otp.deleteMany({ email })
      return res.status(429).json({ message: 'Too many wrong attempts. Please request a new code.' })
    }

    if (record.otp !== otp) {
      record.attempts += 1
      await record.save()
      return res.status(400).json({ message: 'Invalid OTP' })
    }

    // Keep the record and mark it verified. The register and reset-password
    // routes check this flag, then delete the record after use.
    record.verified = true
    record.expiresAt = new Date(Date.now() + OTP_EXPIRY_MS)
    await record.save()

    // If the user already exists, mark the email as verified
    await User.findOneAndUpdate({ email }, { emailVerified: true })

    res.json({ success: true, message: 'Email verified successfully!' })
  } catch (err) {
    console.error('Verify OTP error:', err)
    res.status(500).json({ message: 'Failed to verify OTP' })
  }
})

module.exports = router