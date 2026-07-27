// Lightweight Google Analytics 4 helper — call these functions from
// anywhere in the app to track page views and key engagement events.
// Safe to import even before GA is fully configured; it silently no-ops
// if window.gtag isn't available yet (e.g. during local dev).

export function trackPageView(path) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_location: window.location.href
    })
  }
}

export function trackEvent(eventName, params = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params)
  }
}

// Convenience wrappers for the events that matter most for TimeBank —
// call these at the exact point each action succeeds in your code.
export const analytics = {
  signUp: (method = 'email') => trackEvent('sign_up', { method }),
  login: (method = 'email') => trackEvent('login', { method }),
  skillPosted: (type, category) => trackEvent('skill_posted', { skill_type: type, category }),
  sessionScheduled: () => trackEvent('session_scheduled'),
  sessionCompleted: () => trackEvent('session_completed'),
  classHosted: () => trackEvent('class_hosted'),
  classJoined: () => trackEvent('class_joined'),
  messageSent: (type = 'text') => trackEvent('message_sent', { message_type: type }),
  referralShared: () => trackEvent('referral_shared')
}