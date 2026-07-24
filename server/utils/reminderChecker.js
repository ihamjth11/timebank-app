const Session = require('../models/Session')
const Notification = require('../models/Notification')
const { initPush, sendPushToUser } = require('./pushHelper')

const REMINDER_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const CHECK_INTERVAL_MS = 60 * 1000 // check every 1 minute

// session.date is a "YYYY-MM-DD" string and session.time is "HH:MM",
// both entered as the user's local Sri Lanka time (UTC+5:30). The server
// itself may run in UTC (Render), so we explicitly attach the +05:30
// offset here to get the correct absolute moment in time.
function getSessionDateTime(session) {
  return new Date(`${session.date}T${session.time}:00+05:30`)
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
  initPush() // configure web-push once, shared with every route file

  checkSessionReminders() // run once immediately on server startup
  setInterval(checkSessionReminders, CHECK_INTERVAL_MS)
  console.log('✅ Session reminder checker started (runs every 1 minute)')
}

module.exports = { startReminderChecker }