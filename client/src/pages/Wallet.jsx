import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import '../styles/dashboard.css'
import '../styles/wallet.css'

function Wallet() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'MH'

  const TXNS = [
    { icon: '💻', name: 'Coding Help Given', time: '2 hours ago', amount: '+2.0', type: 'earn', bg: 'rgba(111,255,212,0.1)', desc: 'Helped with React project' },
    { icon: '📚', name: 'Tamil Lesson Received', time: 'Yesterday', amount: '-1.0', type: 'spend', bg: 'rgba(255,111,176,0.1)', desc: 'Language learning session' },
    { icon: '🎨', name: 'Design Review Given', time: '2 days ago', amount: '+1.5', type: 'earn', bg: 'rgba(124,111,255,0.1)', desc: 'UI feedback session' },
    { icon: '🍳', name: 'Cooking Class Attended', time: '3 days ago', amount: '-1.0', type: 'spend', bg: 'rgba(255,209,102,0.1)', desc: 'Sri Lankan recipes' },
    { icon: '🎸', name: 'Guitar Lesson Given', time: '5 days ago', amount: '+1.0', type: 'earn', bg: 'rgba(111,255,212,0.1)', desc: 'Basic chords session' },
  ]

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
            <div className="dash__nav-item-icon" style={{ background: 'rgba(255,255,255,0.04)', color: '#8888aa' }}>
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
            <div className="dash__nav-item-icon" style={{ background: 'rgba(255,255,255,0.04)', color: '#8888aa' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            Find Skills
          </div>
          <div className="dash__nav-item" onClick={() => navigate('/messages')}>
            <div className="dash__nav-item-icon" style={{ background: 'rgba(255,255,255,0.04)', color: '#8888aa' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            </div>
            Messages
          </div>
          <div className="dash__nav-item" onClick={() => navigate('/profile')}>
            <div className="dash__nav-item-icon" style={{ background: 'rgba(255,255,255,0.04)', color: '#8888aa' }}>
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
              <div className="dash__sidebar-user-credits">{user?.timeCredits || 5} Time Credits</div>
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

        {/* Wallet Card */}
        <div className="wallet__card">
          <div className="wallet__card-left">
            <div className="wallet__card-label">TOTAL BALANCE</div>
            <div className="wallet__card-balance">{user?.timeCredits || 5}.0</div>
            <div className="wallet__card-unit">Time Credits</div>
            <div className="wallet__card-stats">
              <div className="wallet__card-stat">
                <div className="wallet__card-stat-num" style={{ color: '#6fffd4' }}>+4.5</div>
                <div className="wallet__card-stat-label">Earned</div>
              </div>
              <div className="wallet__card-stat">
                <div className="wallet__card-stat-num" style={{ color: '#ff6fb0' }}>-2.0</div>
                <div className="wallet__card-stat-label">Spent</div>
              </div>
              <div className="wallet__card-stat">
                <div className="wallet__card-stat-num" style={{ color: '#ffd166' }}>8</div>
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
                <text x="60" y="55" textAnchor="middle" fill="white" fontSize="18" fontWeight="800">{user?.timeCredits || 5}</text>
                <text x="60" y="72" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">credits</text>
              </svg>
            </div>
          </div>
        </div>

        {/* How Credits Work */}
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

        {/* Transactions */}
        <div className="dash__txns" style={{ marginTop: '20px' }}>
          <div className="dash__section-title">
            Transaction History
            <span className="dash__section-link">Export</span>
          </div>
          {TXNS.map((txn, i) => (
            <div key={i} className="dash__txn">
              <div className="dash__txn-icon" style={{ background: txn.bg }}>{txn.icon}</div>
              <div className="dash__txn-info">
                <div className="dash__txn-name">{txn.name}</div>
                <div className="dash__txn-time">{txn.desc} · {txn.time}</div>
              </div>
              <div className={`dash__txn-amount ${txn.type}`}>{txn.amount}</div>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}

export default Wallet