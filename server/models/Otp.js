const mongoose = require('mongoose')

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    // SHA-256 hash of the one-time verification token handed to the client
    // after a successful OTP check (required by reset-password)
    tokenHash: { type: String, default: null }
  },
  { timestamps: true }
)

// TTL index: MongoDB automatically deletes the document once expiresAt passes
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('Otp', otpSchema)