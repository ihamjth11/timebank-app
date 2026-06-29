import ThemeToggle from '../components/ThemeToggle'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/dashboard.css'

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
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>),
    label: 'Messages', bg: 'rgba(255,209,102,0.15)', color: '#ffd166', path: '/messages'
  },
  {
    icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>),
    label: 'Profile', bg: 'rgba(124,111,255,0.15)', color: '#7c6fff', path: '/profile'
  },
]

const TXNS = [
  { icon: '💻', name: 'Coding Help', time: '2 hours ago', amount: '+2.0', type: 'earn', bg: 'rgba(111,255,212,0.1)' },
  { icon: '📚', name: 'Tamil Lesson', time: 'Yesterday', amount: '-1.0', type: 'spend', bg: 'rgba(255,111,176,0.1)' },
  { icon: '🎨', name: 'Design Review', time: '2 days ago', amount: '+1.5', type: 'earn', bg: 'rgba(124,111,255,0.1)' },
  { icon: '🍳', name: 'Cooking Class', time: '3 days ago', amount: '-1.0', type: 'spend', bg: 'rgba(255,209,102,0.1)' },
]

const SKILLS = [
  { name: 'Coding', color: '#7c6fff', bg: 'rgba(124,111,255,0.1)', border: 'rgba(124,111,255,0.3)' },
  { name: 'UI/UX Design', color: '#ff6fb0', bg: 'rgba(255,111,176,0.1)', border: 'rgba(255,111,176,0.3)' },
  { name: 'Python', color: '#6fffd4', bg: 'rgba(111,255,212,0.1)', border: 'rgba(111,255,212,0.3)' },
  { name: 'JavaScript', color: '#ffd166', bg: 'rgba(255,209,102,0.1)', border: 'rgba(255,209,102,0.3)' },
]

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState(0)

  const handleLogout = () => {
    logout()
    navigate('/')
  }
  const handleNavClick = (path) => {
  navigate(path)
}

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'MH'

  return (
    <div className="dash">

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
      background: activeNav === i ? item.bg : 'rgba(255,255,255,0.04)',
      color: activeNav === i ? item.color : '#8888aa'
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
            <h1 className="dash__header-title">
              Good day, {user?.name?.split(' ')[0] || 'Hamjath'} 👋
            </h1>
            <p className="dash__header-sub">Here's what's happening in your TimeBank</p>
          </div>
          <div className="dash__header-right">
              <ThemeToggle />
            <button className="dash__notif-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
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
            <div className="dash__stat-num">{user?.timeCredits || 5}</div>
            <div className="dash__stat-label">Time Credits</div>
            <div className="dash__stat-change up">+2 this week</div>
          </div>

          <div className="dash__stat-card">
            <div className="dash__stat-icon" style={{ background: 'rgba(111,255,212,0.1)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#6fffd4" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="9" cy="7" r="4" stroke="#6fffd4" strokeWidth="1.5"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#6fffd4" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="dash__stat-num">12</div>
            <div className="dash__stat-label">People Helped</div>
            <div className="dash__stat-change up">+3 this week</div>
          </div>

          <div className="dash__stat-card">
            <div className="dash__stat-icon" style={{ background: 'rgba(255,111,176,0.1)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" stroke="#ff6fb0" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="dash__stat-num">4.9</div>
            <div className="dash__stat-label">Impact Score</div>
            <div className="dash__stat-change up">Top 10%</div>
          </div>

          <div className="dash__stat-card">
            <div className="dash__stat-icon" style={{ background: 'rgba(255,209,102,0.1)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="3" stroke="#ffd166" strokeWidth="1.5"/>
                <path d="M2 10h20" stroke="#ffd166" strokeWidth="1.5"/>
              </svg>
            </div>
            <div className="dash__stat-num">8</div>
            <div className="dash__stat-label">Sessions Done</div>
            <div className="dash__stat-change neutral">This month</div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="dash__grid">

          {/* Wallet */}
          <div className="dash__wallet">
            <div className="dash__wallet-label">TIME BALANCE</div>
            <div className="dash__wallet-balance">{user?.timeCredits || 5}.0</div>
            <div className="dash__wallet-unit">Time Credits available</div>
            <div className="dash__wallet-actions">
              <button className="dash__wallet-btn primary">Offer Help</button>
              <button className="dash__wallet-btn secondary">Request Help</button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dash__actions">
            <div className="dash__section-title">Quick Actions</div>
            <div className="dash__action-grid">
              <div className="dash__action-btn">
                <div className="dash__action-icon" style={{ background: 'rgba(124,111,255,0.1)', color: '#7c6fff' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                Find Skills
              </div>
              <div className="dash__action-btn">
                <div className="dash__action-icon" style={{ background: 'rgba(111,255,212,0.1)', color: '#6fffd4' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                Post Skill
              </div>
              <div className="dash__action-btn">
                <div className="dash__action-icon" style={{ background: 'rgba(255,111,176,0.1)', color: '#ff6fb0' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                Messages
              </div>
              <div className="dash__action-btn">
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
              <span className="dash__section-link">View all</span>
            </div>
            {TXNS.map((txn, i) => (
              <div key={i} className="dash__txn">
                <div className="dash__txn-icon" style={{ background: txn.bg }}>
                  {txn.icon}
                </div>
                <div className="dash__txn-info">
                  <div className="dash__txn-name">{txn.name}</div>
                  <div className="dash__txn-time">{txn.time}</div>
                </div>
                <div className={`dash__txn-amount ${txn.type}`}>
                  {txn.amount}
                </div>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="dash__skills">
            <div className="dash__section-title">
              My Skills
              <span className="dash__section-link">Edit</span>
            </div>
            <div className="dash__skill-tags">
              {SKILLS.map((skill, i) => (
                <div
                  key={i}
                  className="dash__skill-tag"
                  style={{
                    color: skill.color,
                    background: skill.bg,
                    borderColor: skill.border
                  }}
                >
                  {skill.name}
                </div>
              ))}
              <button className="dash__skill-add">+ Add Skill</button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default Dashboard