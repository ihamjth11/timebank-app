const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDB = require('./config/db')

dotenv.config()
connectDB()

const app = express()

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/skills', require('./routes/skills'))
app.use('/api/messages', require('./routes/messages'))
app.use('/api/sessions', require('./routes/sessions'))

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
})