import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = 'https://timebank-app.onrender.com/api'

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function NotificationBell() {
  const { token } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const ref = useRef(null)

  const fetchNotifications = async () => {
    if (!token) return
    try {
      const res = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(res.data.notifications || [])
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleOpen = async () => {
    setOpen(!open)
    if (!open && unreadCount > 0) {
      try {
        await axios.post(`${API}/notifications/read-all`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setNotifications(notifications.map(n => ({ ...n, read: true })))
      } catch (err) {
        console.error('Failed to mark as read:', err)
      }
    }
  }

  const handleClickNotif = (link) => {
    setOpen(false)
    window.location.href = link
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={handleOpen}
        className="dash__notif-btn"
        style={{ position: 'relative' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#ff5050', color: '#fff', fontSize: '10px', fontWeight: 700,
            borderRadius: '50%', minWidth: '16px', height: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', border: '2px solid var(--bg)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: '320px', maxHeight: '400px', overflowY: 'auto',
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: '16px', boxShadow: 'var(--shadow-lg)', zIndex: 500
        }}>
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid var(--border)',
            fontWeight: 700, fontSize: '14px', color: 'var(--text)'
          }}>
            Notifications
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => handleClickNotif(n.link)}
                style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--border2)',
                  cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start',
                  background: n.read ? 'transparent' : 'rgba(124,111,255,0.05)'
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700
                }}>
                  {n.fromName ? n.fromName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12.5px', color: 'var(--text)', lineHeight: '1.4' }}>{n.text}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{timeAgo(n.createdAt)}</div>
                </div>
                {!n.read && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: '4px' }} />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell