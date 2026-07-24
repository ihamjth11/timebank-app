const webpush = require('web-push')
const PushSubscription = require('../models/PushSubscription')

let pushEnabled = false

// Configure web-push once, shared across every route file that needs to
// send a real OS-level push notification (not just an in-app one).
// Safe to call more than once; never crashes the server if keys are
// missing or invalid — push notifications just stay disabled.
function initPush() {
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
    console.warn('⚠️  VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set — browser push notifications disabled, in-app notifications still work.')
    pushEnabled = false
  }
  return pushEnabled
}

// Sends a real OS-level push notification (the kind that shows up even
// when the app is closed, like WhatsApp/Instagram) to every device the
// user has subscribed from.
async function sendPushToUser(userId, payload) {
  if (!pushEnabled) return
  try {
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
  } catch (err) {
    console.error('sendPushToUser error:', err.message)
  }
}

module.exports = { initPush, sendPushToUser, isPushEnabled: () => pushEnabled }