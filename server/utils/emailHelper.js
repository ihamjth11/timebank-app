const crypto = require('crypto')

// Render free plan blocks SMTP ports (25, 465, 587), so we send email through
// the Gmail API over HTTPS (port 443) using an OAuth2 refresh token.
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'
const REQUEST_TIMEOUT_MS = 10000 // fail fast instead of hanging forever

// In-memory access token cache (access tokens last about 1 hour)
let cachedToken = null
let cachedTokenExpiresAt = 0

// Generate a cryptographically secure 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString()
}

// fetch() with a hard timeout
async function fetchWithTimeout(url, options) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

// Exchange the refresh token for a short-lived access token
async function getAccessToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt - 60 * 1000) {
    return cachedToken
  }

  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = process.env
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    throw new Error(
      'Gmail API not configured: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET or GMAIL_REFRESH_TOKEN is missing'
    )
  }

  const response = await fetchWithTimeout(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Google token error ${response.status}: ${errorBody}`)
  }

  const data = await response.json()
  cachedToken = data.access_token
  cachedTokenExpiresAt = Date.now() + data.expires_in * 1000
  return cachedToken
}

// Encode a header value so non-ASCII characters are safe
function encodeHeader(value) {
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`
}

// Build a raw RFC 2822 message, base64url encoded for the Gmail API
function buildRawMessage({ from, to, subject, html }) {
  const bodyBase64 = Buffer.from(html, 'utf8')
    .toString('base64')
    .replace(/(.{76})/g, '$1\r\n')

  const message = [
    `From: ${encodeHeader('TimeBank')} <${from}>`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    bodyBase64
  ].join('\r\n')

  return Buffer.from(message, 'utf8').toString('base64url')
}

// Low-level sender: throws on any failure or timeout
async function sendEmail({ to, subject, html }) {
  const from = process.env.EMAIL_USER
  if (!from) throw new Error('Email service not configured: EMAIL_USER is missing')

  // Prevent header injection through the recipient address
  if (/[\r\n<>,;]/.test(to)) throw new Error('Invalid recipient address')

  const accessToken = await getAccessToken()

  const response = await fetchWithTimeout(SEND_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ raw: buildRawMessage({ from, to, subject, html }) })
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Gmail API error ${response.status}: ${errorBody}`)
  }
}

// Send OTP email
async function sendOTPEmail(email, otp) {
  const html = `
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

  await sendEmail({
    to: email,
    subject: 'Your TimeBank Verification Code',
    html
  })
}

module.exports = { generateOTP, sendOTPEmail }