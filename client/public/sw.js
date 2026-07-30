self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data.json()
  } catch (e) {
    data = { title: 'TimeBank', body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'TimeBank'
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { link: data.link || '/messages' }
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      // Set app icon badge count (iOS 16.4+ Safari PWA and Android Chrome support this)
      navigator.setAppBadge
        ? navigator.setAppBadge(data.badgeCount || 1)
        : Promise.resolve()
    ])
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = event.notification.data?.link || '/messages'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(link) && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(link)
    })
  )
})

// Clear badge when user opens the app
self.addEventListener('notificationclose', () => {
  if (navigator.clearAppBadge) navigator.clearAppBadge()
})