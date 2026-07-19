import MobileNav from '../components/MobileNav'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import '../styles/dashboard.css'

const API = 'https://timebank-app.onrender.com/api'

const PERIODS = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' }
]

const MEDAL = ['🥇', '🥈', '🥉']

function RankSkeleton() {
  return (
    <div className="skeleton-row" style={{ padding: '14px 0' }}>
      <span className="skeleton" style={{ width: '28px', height: '18px' }} />
      <span className="skeleton-avatar skeleton" />
      <div style={{ flex: 1 }}>
        <div className="skeleton skeleton-line" style={{ width: '40%', marginBottom: '6px' }} />
        <div className="skeleton skeleton-line" style={{ width: '25%' }} />
      </div>
      <span className="skeleton" style={{ width: '50px', height: '20px', borderRadius: '20px' }} />
    </div>
  )
}

function Leaderboard() {
  const { user } = useAuth()
  const [period, setPeriod] = useState('week')
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      try {
        const res = await axios.get(`${API}/leaderboard`, { params: { period } })
        setLeaderboard(res.data.leaderboard || [])
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err)
        setLeaderboard([])
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [period])

  const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'

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
          <a href="/dashboard" className="dash__nav-item">
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>
            </div>
            Dashboard
          </a>
          <a href="/wallet" className="dash__nav-item">
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            Time Wallet
          </a>
          <a href="/skills" className="dash__nav-item">
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            Find Skills
          </a>
          <a href="/messages" className="dash__nav-item">
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            </div>
            Messages
          </a>
          <a href="/leaderboard" className="dash__nav-item active">
            <div className="dash__nav-item-icon" style={{ background: 'rgba(255,209,102,0.15)', color: '#ffd166' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 4h10v4a5 5 0 01-10 0V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7 5H4a2 2 0 002 4M17 5h3a2 2 0 01-2 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 13v4M9 21h6M10 17h4v4h-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            </div>
            Leaderboard
          </a>
          <a href="/profile" className="dash__nav-item">
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            Profile
          </a>
        </nav>

        <div className="dash__sidebar-bottom">
          <div className="dash__sidebar-user">
            <div className="dash__sidebar-avatar" style={user?.avatar ? { background: 'transparent', overflow: 'hidden', padding: 0 } : {}}>
              {user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9px' }} /> : initials(user?.name)}
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
            <h1 className="dash__header-title">Leaderboard</h1>
            <p className="dash__header-sub">Top helpers in the TimeBank community</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              style={{
                padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', border: period === p.key ? 'none' : '1px solid var(--border2)',
                background: period === p.key ? 'linear-gradient(135deg, #7c6fff, #ff6fb0)' : 'var(--card)',
                color: period === p.key ? '#fff' : 'var(--text-secondary)',
                boxShadow: period === p.key ? '0 3px 10px rgba(124,111,255,0.35)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="dash__txns">
          {loading ? (
            <>
              {[...Array(6)].map((_, i) => <RankSkeleton key={i} />)}
            </>
          ) : leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>No completed sessions yet</div>
              <div style={{ fontSize: '13px' }}>Be the first to help someone and top the leaderboard!</div>
            </div>
          ) : (
            leaderboard.map((entry, i) => {
              const isMe = user?.id === String(entry.userId)
              return (
                <div key={entry.userId} style={{
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 12px',
                  borderRadius: '14px', marginBottom: '4px',
                  background: isMe ? 'rgba(124,111,255,0.08)' : 'transparent',
                  border: isMe ? '1px solid rgba(124,111,255,0.25)' : '1px solid transparent',
                  transition: 'background 0.2s'
                }}>
                  <div style={{ width: '30px', textAlign: 'center', fontSize: i < 3 ? '20px' : '14px', fontWeight: 800, color: i < 3 ? undefined : 'var(--text-muted)' }}>
                    {i < 3 ? MEDAL[i] : `#${i + 1}`}
                  </div>
                  <div
                    onClick={() => { window.location.href = '/profile/' + entry.userId }}
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer',
                      background: entry.avatar ? 'transparent' : 'linear-gradient(135deg, #7c6fff, #ff6fb0)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      color: '#fff', fontWeight: 700, fontSize: '13px'
                    }}
                  >
                    {entry.avatar ? <img src={entry.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(entry.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {entry.name} {isMe && <span style={{ color: 'var(--accent)', fontWeight: 600 }}>(You)</span>}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{entry.location}</div>
                  </div>
                  <div style={{
                    padding: '5px 14px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 700,
                    background: 'rgba(124,111,255,0.1)', color: '#7c6fff', whiteSpace: 'nowrap'
                  }}>
                    {entry.sessionsHelped} helped
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}

export default Leaderboard