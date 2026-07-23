const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const rateLimit = require('express-rate-limit')
const dotenv = require('dotenv')
const connectDB = require('./config/db')
const { startReminderChecker } = require('./utils/reminderChecker')

dotenv.config()
connectDB()

const app = express()

// Render/Vercel sit behind a reverse proxy — this is required for
// express-rate-limit (and req.ip) to see the real client IP instead of
// the proxy's IP for every request.
app.set('trust proxy', 1)

// Security headers (hides X-Powered-By, sets sensible defaults for
// XSS/clickjacking/MIME-sniffing protection, etc.)
app.use(helmet())

// Only the actual TimeBank frontend (and localhost during development)
// may call this API — replaces the previous wide-open cors().
const allowedOrigins = [
  'https://timebank-app.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
]
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

app.use(express.json({ limit: '5mb' }))

// Strips out any MongoDB query operators (like $gt, $ne) from user input
// so req.body/req.query/req.params can't be used to inject NoSQL queries.
app.use(mongoSanitize())

// General API-wide rate limit — a looser ceiling than the auth-specific
// limiter, just to blunt abusive scripts/scrapers hitting the API hard.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' }
})
app.use('/api', apiLimiter)

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/skills', require('./routes/skills'))
app.use('/api/messages', require('./routes/messages'))
app.use('/api/sessions', require('./routes/sessions'))
app.use('/api/transactions', require('./routes/transactions'))
app.use('/api/notifications', require('./routes/notifications'))
app.use('/api/push', require('./routes/push'))
app.use('/api/reviews', require('./routes/reviews'))
app.use('/api/badges', require('./routes/badges'))
app.use('/api/leaderboard', require('./routes/leaderboard'))
app.use('/api/workshops', require('./routes/workshops'))
app.use('/api/moderation', require('./routes/moderation'))
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TimeBank API Running!',
    version: '1.0.0'
  })
})

// Catch-all error handler — never leak stack traces or internals to the
// client, even if something upstream throws unexpectedly.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'Not allowed' })
  }
  res.status(500).json({ success: false, message: 'Server error' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  startReminderChecker()
})