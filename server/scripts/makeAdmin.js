// One-time script to make your account an admin — run this locally
// using the same MongoDB connection string your server already uses.
// This completely bypasses the MongoDB Atlas website login, since it
// connects directly using your database credentials.
//
// USAGE:
//   1. Save this file as server/scripts/makeAdmin.js
//   2. Edit YOUR_EMAIL below to your TimeBank account's email
//   3. Run: node scripts/makeAdmin.js
//   4. Delete this file afterwards (optional, but tidy)

require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')

const YOUR_EMAIL = 'm.hamjath11@gmail.com' // 👈 change this if needed

// Supports either env variable name — your .env uses MONGO_URI, but this
// also falls back to MONGODB_URI in case that's what your setup uses.
const connectionString = process.env.MONGO_URI || process.env.MONGODB_URI

async function run() {
  try {
    if (!connectionString) {
      console.log('❌ No MongoDB connection string found in .env')
      console.log('   Checked both MONGO_URI and MONGODB_URI — neither is set.')
      console.log('   Open server/.env and confirm the exact variable name used there.')
      process.exit(1)
    }

    await mongoose.connect(connectionString)
    console.log('Connected to MongoDB')

    const user = await User.findOne({ email: YOUR_EMAIL.toLowerCase().trim() })
    if (!user) {
      console.log(`❌ No user found with email: ${YOUR_EMAIL}`)
      process.exit(1)
    }

    user.isAdmin = true
    await user.save()
    console.log(`✅ Success! ${user.name} (${user.email}) is now an admin.`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

run()