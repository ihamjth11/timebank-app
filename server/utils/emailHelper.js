const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // port 587 uses STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP email
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: `"TimeBank" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your TimeBank Verification Code',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f8ff; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="background: linear-gradient(135deg, #7c6fff, #ff6fb0); width: 56px; height: 56px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 24px;">⏰</span>
          </div>
          <h2 style="color: #1a1040; margin: 12px 0 4px;">TimeBank</h2>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">Your Time Is Your Currency</p>
        </div>

        <h3 style="color: #1a1040; text-align: center; margin-bottom: 8px;">Email Verification</h3>
        <p style="color: #6b7280; text-align: center; font-size: 14px; margin-bottom: 24px;">
          Use the code below to verify your email address. This code expires in <strong>10 minutes</strong>.
        </p>

        <div style="background: white; border: 2px solid #7c6fff; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #7c6fff;">${otp}</span>
        </div>

        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          If you didn't request this, please ignore this email.<br/>
          This code is valid for 10 minutes only.
        </p>

        <div style="border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 16px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © 2026 TimeBank · <a href="https://timebank-app.vercel.app" style="color: #7c6fff;">timebank-app.vercel.app</a>
          </p>
        </div>
      </div>
    `
  }

  await transporter.sendMail(mailOptions)
}

module.exports = { generateOTP, sendOTPEmail }