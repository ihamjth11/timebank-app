import MobileNav from '../components/MobileNav'
import ThemeToggle from '../components/ThemeToggle'
import OnboardingTour from '../components/OnboardingTour'
import NotificationBell from '../components/NotificationBell'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import '../styles/dashboard.css'

const API = 'https://timebank-app.onrender.com/api'

const NAV_ITEMS = [
  {
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>),
    label: 'Dashboard', bg: 'rgba(124,111,255,0.15)', color: '#7c6fff', path: '/dashboard'
  },
  {
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>),
    label: 'Time Wallet', bg: 'rgba(111,255,212,0.15)', color: '#6fffd4', path: '/wallet'
  },
  {
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>),
    label: 'Find Skills', bg: 'rgba(255,111,176,0.15)', color: '#ff6fb0', path: '/skills'
  },
  {
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 4h10v4a5 5 0 01-10 0V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7 5H4a2 2 0 002 4M17 5h3a2 2 0 01-2 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 13v4M9 21h6M10 17h4v4h-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>),
    label: 'Leaderboard', bg: 'rgba(255,209,102,0.15)', color: '#ffd166', path: '/leaderboard'
  },
  {
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>),
    label: 'Messages', bg: 'rgba(255,209,102,0.15)', color: '#ffd166', path: '/messages'
  },
  {
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>),
    label: 'Profile', bg: 'rgba(124,111,255,0.15)', color: '#7c6fff', path: '/profile'
  },
]

// Waving hand as a clean stroke-based SVG (replaces the 👋 emoji) with a
// gentle CSS wave animation defined via inline keyframes below.
function WaveIcon() {
  return (
    <span style={{ display: 'inline-flex', transformOrigin: '70% 70%', animation: 'tb-wave 2.2s ease-in-out infinite' }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M8 12.5V6a1.5 1.5 0 013 0v5M11 11V4.5a1.5 1.5 0 013 0V11M14 11.2V6a1.5 1.5 0 013 0v7M17 13V9.5a1.5 1.5 0 013 0V15c0 3.5-2.5 6.5-6 6.5h-2c-2 0-3.5-.7-4.7-2.2L4 15.5c-.6-.8-.4-1.9.4-2.4.7-.4 1.6-.3 2.2.3L8 15" stroke="#ffd166" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <style>{`
        @keyframes tb-wave {
          0%, 60%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
        }
      `}</style>
    </span>
  )
}

function Dashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState(0)
  const [mySkills, setMySkills] = useState([])
  const [loadingSkills, setLoadingSkills] = useState(true)
  const [badgeData, setBadgeData] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(
    !localStorage.getItem('tb_onboarding_seen')
  )

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }
  const handleNavClick = (path) => {
    navigate(path)
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'MH'

  useEffect(() => {
    const fetchMySkills = async () => {
      if (!user?.id) return
      try {
        const res = await axios.get(`${API}/skills`)
        const all = res.data.skills || []
        const mine = all.filter(s => s.user === user.id)
        setMySkills(mine)
      } catch (err) {
        console.error('Failed to fetch skills:', err)
      } finally {
        setLoadingSkills(false)
      }
    }
    fetchMySkills()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    const fetchBadges = async () => {
      if (!user?.id) return
      try {
        const res = await axios.get(`${API}/badges/${user.id}`)
        setBadgeData(res.data)
      } catch (err) {
        console.error('Failed to fetch badges:', err)
      }
    }
    fetchBadges()
  }, [user?.id])

  const sessionCount = badgeData?.sessionCount ?? 0
  const memberStatus =
    sessionCount >= 15 ? 'Champion' :
    sessionCount >= 5 ? 'Regular' :
    sessionCount >= 1 ? 'Active' : 'New'

  const SKILL_COLORS = [
    { color: '#7c6fff', bg: 'rgba(124,111,255,0.1)', border: 'rgba(124,111,255,0.3)' },
    { color: '#ff6fb0', bg: 'rgba(255,111,176,0.1)', border: 'rgba(255,111,176,0.3)' },
    { color: '#6fffd4', bg: 'rgba(111,255,212,0.1)', border: 'rgba(111,255,212,0.3)' },
    { color: '#ffd166', bg: 'rgba(255,209,102,0.1)', border: 'rgba(255,209,102,0.3)' },
  ]

  return (
    <div className="dash">

      {showOnboarding && (
        <OnboardingTour onClose={() => setShowOnboarding(false)} />
      )}

      {/* SIDEBAR */}
      <aside className="dash__sidebar">

        <Link to="/" className="dash__sidebar-logo">
          <div className="dash__sidebar-logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5"/>
              <path d="M12 6v6l4 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="dash__sidebar-logo-text">TimeBank</span>
        </Link>

        <nav className="dash__nav">
          <div className="dash__nav-label">Main Menu</div>
          {NAV_ITEMS.map((item, i) => (
            <div
              key={i}
              className={`dash__nav-item ${activeNav === i ? 'active' : ''}`}
              onClick={() => {
                setActiveNav(i)
                handleNavClick(item.path)
              }}
            >
              <div className="dash__nav-item-icon" style={{
                background: activeNav === i ? item.bg : 'var(--input-bg)',
                color: activeNav === i ? item.color : 'var(--text-secondary)'
              }}>
                {item.icon}
              </div>
              {item.label}
            </div>
          ))}

          <div className="dash__nav-label">Account</div>
          <div className="dash__nav-item" onClick={handleLogout}>
            <div className="dash__nav-item-icon" style={{ background: 'rgba(255,80,80,0.1)', color: '#ff8080' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            Logout
          </div>
        </nav>

        <div className="dash__sidebar-bottom">
          <div className="dash__sidebar-user">
            <div className="dash__sidebar-avatar">{initials}</div>
            <div>
              <div className="dash__sidebar-user-name">{user?.name || 'Mohamed Hamjath'}</div>
              <div className="dash__sidebar-user-credits">
                {user?.timeCredits || 5} Time Credits
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dash__main">

        {/* Header */}
        <div className="dash__header">
          <div>
            <h1 className="dash__header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Good day, {user?.name?.split(' ')[0] || 'Hamjath'} <WaveIcon />
            </h1>
            <p className="dash__header-sub">Here's what's happening in your TimeBank</p>
          </div>
          <div className="dash__header-right">
          <ThemeToggle />
          <NotificationBell />
          </div>
        </div>

        {/* Stats */}
        <div className="dash__stats">
          <div className="dash__stat-card">
            <div className="dash__stat-icon" style={{ background: 'rgba(124,111,255,0.1)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#7c6fff" strokeWidth="1.5"/>
                <path d="M12 6v6l4 2" stroke="#7c6fff" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="dash__stat-num">{user?.timeCredits ?? 5}</div>
            <div className="dash__stat-label">Time Credits</div>
          </div>

          <div className="dash__stat-card">
            <div className="dash__stat-icon" style={{ background: 'rgba(111,255,212,0.1)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#6fffd4" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="9" cy="7" r="4" stroke="#6fffd4" strokeWidth="1.5"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#6fffd4" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="dash__stat-num">{mySkills.length}</div>
            <div className="dash__stat-label">Skills Posted</div>
          </div>

          <div className="dash__stat-card">
            <div className="dash__stat-icon" style={{ background: 'rgba(255,111,176,0.1)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" stroke="#ff6fb0" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="dash__stat-num">{memberStatus}</div>
            <div className="dash__stat-label">Member Status</div>
          </div>

          <div className="dash__stat-card">
            <div className="dash__stat-icon" style={{ background: 'rgba(255,209,102,0.1)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="3" stroke="#ffd166" strokeWidth="1.5"/>
                <path d="M2 10h20" stroke="#ffd166" strokeWidth="1.5"/>
              </svg>
            </div>
            <div className="dash__stat-num">{sessionCount}</div>
            <div className="dash__stat-label">Sessions Done</div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="dash__grid">

          {/* Wallet */}
          <div className="dash__wallet">
            <div className="dash__wallet-label">TIME BALANCE</div>
            <div className="dash__wallet-balance">{user?.timeCredits ?? 5}.0</div>
            <div className="dash__wallet-unit">Time Credits available</div>
            <div className="dash__wallet-actions">
              <button className="dash__wallet-btn primary" onClick={() => navigate('/skills')}>Offer Help</button>
              <button className="dash__wallet-btn secondary" onClick={() => navigate('/skills')}>Request Help</button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dash__actions">
            <div className="dash__section-title">Quick Actions</div>
            <div className="dash__action-grid">
              <div className="dash__action-btn" onClick={() => navigate('/skills')}>
                <div className="dash__action-icon" style={{ background: 'rgba(124,111,255,0.1)', color: '#7c6fff' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                Find Skills
              </div>
              <div className="dash__action-btn" onClick={() => navigate('/skills')}>
                <div className="dash__action-icon" style={{ background: 'rgba(111,255,212,0.1)', color: '#6fffd4' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                Post Skill
              </div>
              <div className="dash__action-btn" onClick={() => navigate('/messages')}>
                <div className="dash__action-icon" style={{ background: 'rgba(255,111,176,0.1)', color: '#ff6fb0' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                Messages
              </div>
              <div className="dash__action-btn" onClick={() => navigate('/profile')}>
                <div className="dash__action-icon" style={{ background: 'rgba(255,209,102,0.1)', color: '#ffd166' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                Profile
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="dash__txns">
            <div className="dash__section-title">
              Recent Transactions
              <span className="dash__section-link" onClick={() => navigate('/wallet')}>View all</span>
            </div>
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '13px' }}>No transactions yet</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Start helping others to see activity here</div>
            </div>
          </div>

          {/* Skills */}
          <div className="dash__skills">
            <div className="dash__section-title">
              My Skills
              <span className="dash__section-link" onClick={() => navigate('/skills')}>Edit</span>
            </div>
            <div className="dash__skill-tags">
              {loadingSkills ? (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading...</span>
              ) : mySkills.length === 0 ? (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>You haven't posted any skills yet</span>
              ) : (
                mySkills.map((skill, i) => {
                  const c = SKILL_COLORS[i % SKILL_COLORS.length]
                  return (
                    <div key={skill._id} className="dash__skill-tag" style={{ color: c.color, background: c.bg, borderColor: c.border }}>
                      {skill.title}
                    </div>
                  )
                })
              )}
              <button className="dash__skill-add" onClick={() => navigate('/skills')}>+ Add Skill</button>
            </div>
          </div>

        </div>
      </main>
      <MobileNav />
    </div>
  )
}

export default Dashboard