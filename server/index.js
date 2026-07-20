const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDB = require('./config/db')
const { startReminderChecker } = require('./utils/reminderChecker')

dotenv.config()
connectDB()

const app = express()

app.use(cors())
app.use(express.json({ limit: '5mb' }))

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

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  startReminderChecker()
})