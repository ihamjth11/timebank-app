import { useState, useEffect } from 'react'
import { subscribeToPush } from '../utils/pushNotifications'

function EnableNotifications({ token }) {
  const [status, setStatus] = useState('checking') // checking | prompt | granted | denied | unsupported
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    setStatus(Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'prompt')
  }, [])

  const handleEnable = async () => {
    setLoading(true)
    // This call happens directly inside a tap/click handler, which is
    // required on iOS Safari and many Android browsers for the
    // permission prompt to actually appear — requesting it automatically
    // on page load (without a user gesture) gets silently ignored on
    // mobile even though it works fine on desktop.
    await subscribeToPush(token)
    setLoading(false)
    setStatus(Notification.permission === 'granted' ? 'granted' : 'denied')
  }

  if (status === 'checking' || status === 'unsupported' || status === 'granted') return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', borderRadius: '16px', padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', color: '#fff',
      boxShadow: '0 6px 20px rgba(124,111,255,0.3)'
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/>
          <path d="M13.73 21a2 2 0 01-3.46 0" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13.5px', fontWeight: 700 }}>
          {status === 'denied' ? 'Notifications blocked' : 'Turn on notifications'}
        </div>
        <div style={{ fontSize: '11.5px', opacity: 0.9 }}>
          {status === 'denied'
            ? 'Enable them in your phone/browser settings for this site'
            : 'Get notified instantly for new messages and sessions'}
        </div>
      </div>
      {status !== 'denied' && (
        <button onClick={handleEnable} disabled={loading} style={{
          background: '#fff', color: '#7c6fff', border: 'none', borderRadius: '10px',
          padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap'
        }}>{loading ? '...' : 'Enable'}</button>
      )}
    </div>
  )
}

export default EnableNotifications