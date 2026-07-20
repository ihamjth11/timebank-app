import MobileNav from '../components/MobileNav'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import '../styles/dashboard.css'

const API = 'https://timebank-app.onrender.com/api'

function EventSkeleton() {
  return (
    <div className="skeleton-row" style={{ padding: '14px 0' }}>
      <span className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '12px' }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton skeleton-line" style={{ width: '55%', marginBottom: '6px' }} />
        <div className="skeleton skeleton-line" style={{ width: '35%' }} />
      </div>
      <span className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '20px' }} />
    </div>
  )
}

function Calendar() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('upcoming')

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      try {
        const [sessionsRes, workshopsRes] = await Promise.all([
          axios.get(`${API}/sessions/mine`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/workshops/mine`, { headers: { Authorization: `Bearer ${token}` } })
        ])

        const sessionEvents = (sessionsRes.data.sessions || []).map(s => {
          const otherPerson = String(s.organizer._id || s.organizer) === String(user?.id) ? s.participant : s.organizer
          return {
            id: s._id,
            kind: 'session',
            title: `Session with ${otherPerson?.name || 'someone'}`,
            date: s.date,
            time: s.time,
            status: s.status,
            meetingLink: s.meetingLink,
            otherName: otherPerson?.name,
            otherAvatar: otherPerson?.avatar
          }
        })

        const workshopEvents = (workshopsRes.data.workshops || []).map(w => {
          const isHost = String(w.host._id || w.host) === String(user?.id)
          return {
            id: w._id,
            kind: 'workshop',
            title: w.title,
            date: w.date,
            time: w.time,
            status: w.status,
            meetingLink: w.meetingLink,
            isHost,
            hostName: w.host?.name,
            attendeeCount: w.attendees?.length || 0
          }
        })

        const combined = [...sessionEvents, ...workshopEvents].sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time || '00:00'}`)
          const dateB = new Date(`${b.date}T${b.time || '00:00'}`)
          return dateA - dateB
        })

        setEvents(combined)
      } catch (err) {
        console.error('Failed to fetch calendar events:', err)
      } finally {
        setLoading(false)
      }
    }
    if (token) fetchEvents()
  }, [token, user?.id])

  const now = new Date()
  const filtered = events.filter(e => {
    const eventDate = new Date(`${e.date}T${e.time || '00:00'}`)
    if (filter === 'upcoming') return eventDate >= now && e.status !== 'cancelled'
    if (filter === 'past') return eventDate < now || e.status === 'completed'
    return true
  })

  const groupedByDate = filtered.reduce((groups, event) => {
    const key = event.date
    if (!groups[key]) groups[key] = []
    groups[key].push(event)
    return groups
  }, {})

  const formatDateHeader = (dateStr) => {
    const d = new Date(`${dateStr}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffDays = Math.round((d - today) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'MH'

  return (
    <div className="dash">
      <aside className="dash__sidebar">
        <a href="/" className="dash__sidebar-logo">
          <div className="dash__sidebar-logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
              <path d="M12 6v6l4 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="dash__sidebar-logo-text">TimeBank</span>
        </a>

        <nav className="dash__nav">
          <div className="dash__nav-label">Main Menu</div>
          <div className="dash__nav-item" onClick={() => navigate('/dashboard')}>
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>
            </div>
            Dashboard
          </div>
          <div className="dash__nav-item" onClick={() => navigate('/wallet')}>
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            Time Wallet
          </div>
          <div className="dash__nav-item" onClick={() => navigate('/skills')}>
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            Find Skills
          </div>
          <div className="dash__nav-item" onClick={() => navigate('/workshops')}>
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            </div>
            Classes
          </div>
          <div className="dash__nav-item active">
            <div className="dash__nav-item-icon" style={{ background: 'rgba(255,111,176,0.15)', color: '#ff6fb0' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            Calendar
          </div>
          <div className="dash__nav-item" onClick={() => navigate('/leaderboard')}>
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 4h10v4a5 5 0 01-10 0V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7 5H4a2 2 0 002 4M17 5h3a2 2 0 01-2 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 13v4M9 21h6M10 17h4v4h-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            </div>
            Leaderboard
          </div>
          <div className="dash__nav-item" onClick={() => navigate('/messages')}>
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            </div>
            Messages
          </div>
          <div className="dash__nav-item" onClick={() => navigate('/profile')}>
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            Profile
          </div>
        </nav>

        <div className="dash__sidebar-bottom">
          <div className="dash__sidebar-user">
            <div className="dash__sidebar-avatar" style={user?.avatar ? { background: 'transparent', overflow: 'hidden', padding: 0 } : {}}>
              {user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9px' }} /> : initials}
            </div>
            <div>
              <div className="dash__sidebar-user-name">{user?.name || 'Mohamed Hamjath'}</div>
              <div className="dash__sidebar-user-credits">{user?.timeCredits ?? 5} Time Credits</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="dash__main">
        <div className="dash__header">
          <div>
            <h1 className="dash__header-title">Calendar</h1>
            <p className="dash__header-sub">All your sessions and classes in one place</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'past', label: 'Past' },
            { key: 'all', label: 'All' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', border: filter === f.key ? 'none' : '1px solid var(--border2)',
                background: filter === f.key ? 'linear-gradient(135deg, #7c6fff, #ff6fb0)' : 'var(--card)',
                color: filter === f.key ? '#fff' : 'var(--text-secondary)',
                boxShadow: filter === f.key ? '0 3px 10px rgba(124,111,255,0.35)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="dash__txns">
          {loading ? (
            <>{[...Array(5)].map((_, i) => <EventSkeleton key={i} />)}</>
          ) : Object.keys(groupedByDate).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                No {filter === 'upcoming' ? 'upcoming' : filter === 'past' ? 'past' : ''} events
              </div>
              <div style={{ fontSize: '13px' }}>Schedule a session or join a class to see it here</div>
            </div>
          ) : (
            Object.entries(groupedByDate).map(([date, dayEvents]) => (
              <div key={date} style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '2px' }}>
                  {formatDateHeader(date)}
                </div>
                {dayEvents.map(event => (
                  <div
                    key={`${event.kind}-${event.id}`}
                    onClick={() => navigate(event.kind === 'session' ? '/messages' : '/workshops')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px', padding: '12px',
                      borderRadius: '14px', cursor: 'pointer', marginBottom: '4px',
                      border: '1px solid var(--border2)', transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--input-bg)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                      background: event.kind === 'workshop' ? 'rgba(111,255,212,0.12)' : 'rgba(124,111,255,0.12)',
                      color: event.kind === 'workshop' ? '#00b894' : '#7c6fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {event.kind === 'workshop' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {event.title}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {event.time} {event.kind === 'workshop' && `• ${event.attendeeCount} attending`}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap',
                      background: event.status === 'completed' ? 'rgba(0,184,148,0.1)' : event.status === 'cancelled' ? 'rgba(255,80,80,0.1)' : 'rgba(255,209,102,0.12)',
                      color: event.status === 'completed' ? '#00b894' : event.status === 'cancelled' ? '#ff5050' : '#ffb700'
                    }}>
                      {event.status === 'completed' ? 'Done' : event.status === 'cancelled' ? 'Cancelled' : event.kind === 'workshop' ? 'Class' : 'Session'}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}

export default Calendar