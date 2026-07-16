import axios from 'axios'

const API = 'https://timebank-app.onrender.com/api'
const VAPID_PUBLIC_KEY = 'BEFQ0s-dE6hMoaCK7kBFLjBHpNELFAtTWAX04xy5cYZ9P2GYLhxYeuN5iIms4sXKm0rKHKG9En90_9AJTSOr1ho'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

// Call this once after the user is logged in (token available).
// Safe to call every time the app loads — it reuses the existing
// subscription if one already exists instead of creating duplicates.
export async function subscribeToPush(token) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
  if (!token) return

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const registration = await navigator.serviceWorker.register('/sw.js')
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })
    }

    await axios.post(`${API}/push/subscribe`, subscription.toJSON(), {
      headers: { Authorization: `Bearer ${token}` }
    })
  } catch (err) {
    console.error('Push subscription failed:', err)
  }
}