const webpush = require('web-push')
const Session = require('../models/Session')
const Notification = require('../models/Notification')
const PushSubscription = require('../models/PushSubscription')

const REMINDER_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const CHECK_INTERVAL_MS = 60 * 1000 // check every 1 minute

let pushEnabled = false

// session.date is a "YYYY-MM-DD" string and session.time is "HH:MM",
// both entered as the user's local Sri Lanka time (UTC+5:30). The server
// itself may run in UTC (Render), so we explicitly attach the +05:30
// offset here to get the correct absolute moment in time.
function getSessionDateTime(session) {
  return new Date(`${session.date}T${session.time}:00+05:30`)
}

async function sendPushToUser(userId, payload) {
  if (!pushEnabled) return
  const subs = await PushSubscription.find({ user: userId })
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify(payload)
      )
    } catch (err) {
      // Subscription expired or the user revoked permission — clean it up
      if (err.statusCode === 410 || err.statusCode === 404) {
        await PushSubscription.deleteOne({ _id: sub._id })
      } else {
        console.error('Push send error:', err.message)
      }
    }
  }
}

async function notifyBoth(session, { type, text, link }) {
  await Notification.create({
    user: session.organizer,
    type,
    fromUser: session.participant,
    fromName: 'TimeBank',
    text,
    link,
    read: false
  })
  await Notification.create({
    user: session.participant,
    type,
    fromUser: session.organizer,
    fromName: 'TimeBank',
    text,
    link,
    read: false
  })

  const pushPayload = { title: 'TimeBank', body: text, link }
  await sendPushToUser(session.organizer, pushPayload)
  await sendPushToUser(session.participant, pushPayload)
}

async function checkSessionReminders() {
  try {
    const sessions = await Session.find({ status: 'scheduled' })
    const now = new Date()

    for (const session of sessions) {
      const sessionTime = getSessionDateTime(session)
      const msUntilStart = sessionTime - now

      // 15-minute-before reminder
      if (!session.reminder15Sent && msUntilStart > 0 && msUntilStart <= REMINDER_WINDOW_MS) {
        await notifyBoth(session, {
          type: 'session_reminder',
          text: 'Your session starts in 15 minutes!',
          link: '/messages'
        })
        session.reminder15Sent = true
        await session.save()
      }

      // Session start reminder (fires once the scheduled time has arrived)
      if (!session.reminderStartSent && msUntilStart <= 0 && msUntilStart > -CHECK_INTERVAL_MS * 2) {
        await notifyBoth(session, {
          type: 'session_starting',
          text: 'Your session is starting now!',
          link: '/messages'
        })
        session.reminderStartSent = true
        await session.save()
      }
    }
  } catch (err) {
    console.error('Session reminder check failed:', err)
  }
}

function startReminderChecker() {
  // Configure web-push only now (after dotenv has definitely loaded),
  // and never let a missing/misconfigured key crash the whole server.
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    try {
      webpush.setVapidDetails(
        'mailto:hamjath11@gmail.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      )
      pushEnabled = true
    } catch (err) {
      console.error('⚠️  Failed to configure web-push, push notifications disabled:', err.message)
      pushEnabled = false
    }
  } else {
    console.warn('⚠️  VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set — browser push notifications disabled, in-app reminders still work.')
    pushEnabled = false
  }

  checkSessionReminders() // run once immediately on server startup
  setInterval(checkSessionReminders, CHECK_INTERVAL_MS)
  console.log('✅ Session reminder checker started (runs every 1 minute)')
}

module.exports = { startReminderChecker }