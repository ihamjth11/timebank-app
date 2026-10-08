import MobileNav from '../components/MobileNav'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import '../styles/dashboard.css'
import '../styles/wallet.css'

const API = 'https://timebank-app.onrender.com/api'

function Wallet() {
  const { user, token, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [txns, setTxns] = useState([])
  const [sessions, setSessions] = useState([])
  const [classHolds, setClassHolds] = useState({ asStudent: [], asHost: [] })
  const [loading, setLoading] = useState(true)

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'MH'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` }
        const [txnRes, sessionRes, enrollRes] = await Promise.all([
          axios.get(`${API}/transactions`, { headers }),
          // A failure in the escrow requests must never hide the transaction history
          axios.get(`${API}/sessions/mine`, { headers }).catch(() => ({ data: { sessions: [] } })),
          axios.get(`${API}/enrollments/mine`, { headers }).catch(() => ({ data: { asStudent: [], asHost: [] } }))
        ])
        setTxns(txnRes.data.transactions || [])
        setSessions(sessionRes.data.sessions || [])
        setClassHolds({
          asStudent: enrollRes.data.asStudent || [],
          asHost: enrollRes.data.asHost || []
        })
      } catch (err) {
        console.error('Failed to fetch wallet data:', err)
      } finally {
        setLoading(false)
      }
    }
    if (token) {
      fetchData()
      // Make sure the balance on screen is the latest one from the server
      if (typeof refreshUser === 'function') refreshUser()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const earned = txns.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.amount, 0)
  const spent = txns.filter(t => t.type === 'spend').reduce((sum, t) => sum + t.amount, 0)

  // Escrow: credits you paid that are still waiting, and credits you will receive
  const myId = String(user?.id || '')
  const activeEscrow = sessions.filter(s => s.escrowStatus === 'held' && s.status === 'scheduled')
  const heldByMe = activeEscrow.filter(s => String(s.payer) === myId)
  const incomingForMe = activeEscrow.filter(s => String(s.helper) === myId)

  const sessionHeldTotal = heldByMe.reduce((sum, s) => sum + (s.escrowAmount || 0), 0)
  const sessionIncomingTotal = incomingForMe.reduce((sum, s) => sum + (s.escrowAmount || 0), 0)
  const classHeldTotal = classHolds.asStudent.reduce((sum, e) => sum + (e.amount || 0), 0)
  const classIncomingTotal = classHolds.asHost.reduce((sum, r) => sum + (r.amount || 0), 0)

  const heldTotal = sessionHeldTotal + classHeldTotal
  const incomingTotal = sessionIncomingTotal + classIncomingTotal
  const hasEscrow = heldByMe.length + incomingForMe.length + classHolds.asStudent.length + classHolds.asHost.length > 0

  const otherPersonName = (session) => {
    const organizerId = String(session.organizer?._id || session.organizer || '')
    const other = organizerId === myId ? session.participant : session.organizer
    return other?.name || 'someone'
  }

  const escrowStateLabel = (session) => {
    if (session.disputed) return 'Under review'
    if (session.firstConfirmedAt) return 'Waiting for confirmation'
    return 'Scheduled'
  }

  const studentClassState = (enrollment) => {
    if (enrollment.disputed) return 'Under review'
    if (enrollment.workshop.status === 'completed') return 'Waiting for your confirmation'
    return 'Scheduled'
  }

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
          <div className="dash__nav-item active">
            <div className="dash__nav-item-icon" style={{ background: 'rgba(111,255,212,0.15)', color: '#6fffd4' }}>
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
          <div className="dash__nav-item" onClick={() => navigate('/calendar')}>
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
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
          <div className="dash__nav-label">Account</div>
          <div className="dash__nav-item" onClick={() => { logout(); navigate('/') }}>
            <div className="dash__nav-item-icon" style={{ background: 'rgba(255,80,80,0.1)', color: '#ff8080' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            Logout
          </div>
        </nav>

        <div className="dash__sidebar-bottom">
          <div className="dash__sidebar-user">
            <div className="dash__sidebar-avatar">{initials}</div>
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
            <h1 className="dash__header-title">Time Wallet</h1>
            <p className="dash__header-sub">Track your time credits and transactions</p>
          </div>
        </div>

        <div className="wallet__card">
          <div className="wallet__card-left">
            <div className="wallet__card-label">AVAILABLE BALANCE</div>
            <div className="wallet__card-balance">{user?.timeCredits ?? 5}.0</div>
            <div className="wallet__card-unit">Time Credits</div>
            {heldTotal > 0 && (
              <div style={{ fontSize: '12.5px', color: '#ffd166', fontWeight: 600, marginTop: '6px' }}>
                + {heldTotal}.0 on hold in escrow
              </div>
            )}
            <div className="wallet__card-stats">
              <div className="wallet__card-stat">
                <div className="wallet__card-stat-num" style={{ color: '#6fffd4' }}>+{earned}.0</div>
                <div className="wallet__card-stat-label">Earned</div>
              </div>
              <div className="wallet__card-stat">
                <div className="wallet__card-stat-num" style={{ color: '#ff6fb0' }}>-{spent}.0</div>
                <div className="wallet__card-stat-label">Spent</div>
              </div>
              <div className="wallet__card-stat">
                <div className="wallet__card-stat-num" style={{ color: '#ffd166' }}>{txns.length}</div>
                <div className="wallet__card-stat-label">Sessions</div>
              </div>
            </div>
          </div>
          <div className="wallet__card-right">
            <div className="wallet__card-ring">
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke="url(#walletGrad)" strokeWidth="10"
                  strokeDasharray="314" strokeDashoffset="94" strokeLinecap="round"
                  transform="rotate(-90 60 60)"/>
                <defs>
                  <linearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c6fff"/>
                    <stop offset="100%" stopColor="#6fffd4"/>
                  </linearGradient>
                </defs>
                <text x="60" y="55" textAnchor="middle" fill="white" fontSize="18" fontWeight="800">{user?.timeCredits ?? 5}</text>
                <text x="60" y="72" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">credits</text>
              </svg>
            </div>
          </div>
        </div>

        {hasEscrow && (
          <div className="dash__txns" style={{ marginTop: '20px' }}>
            <div className="dash__section-title">Escrow</div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
              Credits for booked sessions and joined classes are held safely until they are confirmed. {heldTotal > 0 ? `${heldTotal} credit${heldTotal > 1 ? 's' : ''} you paid ${heldTotal > 1 ? 'are' : 'is'} on hold. ` : ''}
              {incomingTotal > 0 ? `${incomingTotal} credit${incomingTotal > 1 ? 's' : ''} will reach you after confirmation.` : ''}
            </p>

            {heldByMe.map(s => (
              <div key={s._id} className="dash__txn">
                <div className="dash__txn-icon" style={{ background: 'rgba(255,209,102,0.12)' }}>🔒</div>
                <div className="dash__txn-info">
                  <div className="dash__txn-name">On hold for your session with {otherPersonName(s)}</div>
                  <div className="dash__txn-time">{s.date} at {s.time} · {escrowStateLabel(s)}</div>
                </div>
                <div className="dash__txn-amount spend">{s.escrowAmount}.0</div>
              </div>
            ))}

            {classHolds.asStudent.map(e => (
              <div key={e._id} className="dash__txn">
                <div className="dash__txn-icon" style={{ background: 'rgba(255,209,102,0.12)' }}>🔒</div>
                <div className="dash__txn-info">
                  <div className="dash__txn-name">On hold for class "{e.workshop.title}"</div>
                  <div className="dash__txn-time">{e.workshop.date} at {e.workshop.time} · {studentClassState(e)}</div>
                </div>
                <div className="dash__txn-amount spend">{e.amount}.0</div>
              </div>
            ))}

            {incomingForMe.map(s => (
              <div key={s._id} className="dash__txn">
                <div className="dash__txn-icon" style={{ background: 'rgba(111,255,212,0.1)' }}>⏳</div>
                <div className="dash__txn-info">
                  <div className="dash__txn-name">Incoming from {otherPersonName(s)}</div>
                  <div className="dash__txn-time">{s.date} at {s.time} · {escrowStateLabel(s)}</div>
                </div>
                <div className="dash__txn-amount earn">+{s.escrowAmount}.0</div>
              </div>
            ))}

            {classHolds.asHost.map(r => (
              <div key={String(r.workshopId)} className="dash__txn">
                <div className="dash__txn-icon" style={{ background: 'rgba(111,255,212,0.1)' }}>⏳</div>
                <div className="dash__txn-info">
                  <div className="dash__txn-name">Incoming from {r.count} student{r.count > 1 ? 's' : ''} for "{r.title}"</div>
                  <div className="dash__txn-time">{r.date} at {r.time} · {r.status === 'completed' ? 'Waiting for students to confirm' : 'Scheduled'}</div>
                </div>
                <div className="dash__txn-amount earn">+{r.amount}.0</div>
              </div>
            ))}
          </div>
        )}

        <div className="wallet__how">
          <h3 className="dash__section-title" style={{ marginBottom: '16px' }}>How Time Credits Work</h3>
          <div className="wallet__how-grid">
            <div className="wallet__how-card">
              <div className="wallet__how-icon" style={{ background: 'rgba(111,255,212,0.1)', color: '#6fffd4' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="wallet__how-title">Earn Credits</div>
              <div className="wallet__how-desc">Help someone with your skill for 1 hour → get 1 Time Credit</div>
            </div>
            <div className="wallet__how-card">
              <div className="wallet__how-icon" style={{ background: 'rgba(255,111,176,0.1)', color: '#ff6fb0' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 12V22H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="wallet__how-title">Spend Credits</div>
              <div className="wallet__how-desc">Use 1 credit to get 1 hour of help from anyone in the community</div>
            </div>
            <div className="wallet__how-card">
              <div className="wallet__how-icon" style={{ background: 'rgba(255,209,102,0.1)', color: '#ffd166' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="wallet__how-title">Equal Value</div>
              <div className="wallet__how-desc">Everyone's 1 hour = 1 credit. Doctor or farmer — all equal!</div>
            </div>
            <div className="wallet__how-card">
              <div className="wallet__how-icon" style={{ background: 'rgba(124,111,255,0.1)', color: '#7c6fff' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="wallet__how-title">Gift Credits</div>
              <div className="wallet__how-desc">Donate your credits to elderly or disabled community members</div>
            </div>
          </div>
        </div>

        <div className="dash__txns" style={{ marginTop: '20px' }}>
          <div className="dash__section-title">
            Transaction History
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>Loading...</div>
          ) : txns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.4 }}>📋</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                No transactions yet
              </div>
              <div style={{ fontSize: '13px' }}>
                Complete a scheduled session to earn your first credit
              </div>
            </div>
          ) : (
            txns.map((txn) => (
              <div key={txn._id} className="dash__txn">
                <div className="dash__txn-icon" style={{ background: txn.type === 'earn' ? 'rgba(111,255,212,0.1)' : 'rgba(255,111,176,0.1)' }}>
                  {txn.type === 'earn' ? '💰' : '🤝'}
                </div>
                <div className="dash__txn-info">
                  <div className="dash__txn-name">{txn.type === 'earn' ? `Helped ${txn.otherName}` : `Helped by ${txn.otherName}`}</div>
                  <div className="dash__txn-time">{new Date(txn.createdAt).toLocaleDateString()}</div>
                </div>
                <div className={`dash__txn-amount ${txn.type}`}>
                  {txn.type === 'earn' ? '+' : '-'}{txn.amount}.0
                </div>
              </div>
            ))
          )}
        </div>

      </main>
      <MobileNav />
    </div>
  )
}

export default Wallet