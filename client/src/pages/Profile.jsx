import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import '../styles/dashboard.css'
import '../styles/profile.css'

function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'MH'

  const SKILLS = [
    { name: 'Coding', color: '#7c6fff', bg: 'rgba(124,111,255,0.1)', border: 'rgba(124,111,255,0.3)' },
    { name: 'UI/UX Design', color: '#ff6fb0', bg: 'rgba(255,111,176,0.1)', border: 'rgba(255,111,176,0.3)' },
    { name: 'Python', color: '#6fffd4', bg: 'rgba(111,255,212,0.1)', border: 'rgba(111,255,212,0.3)' },
    { name: 'JavaScript', color: '#ffd166', bg: 'rgba(255,209,102,0.1)', border: 'rgba(255,209,102,0.3)' },
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
          <div className="dash__nav-item" onClick={() => navigate('/wallet')}>
            <div className="dash__nav-item-icon" style={{ background: 'rgba(255,255,255,0.04)', color: '#8888aa' }}>
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
          <div className="dash__nav-item active">
            <div className="dash__nav-item-icon" style={{ background: 'rgba(124,111,255,0.15)', color: '#7c6fff' }}>
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
            <h1 className="dash__header-title">Profile</h1>
            <p className="dash__header-sub">Your TimeBank identity</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="profile__card">
          <div className="profile__cover" />
          <div className="profile__info">
            <div className="profile__avatar">
              {initials}
            </div>
            <div className="profile__details">
              <h2 className="profile__name">{user?.name || 'Mohamed Hamjath'}</h2>
              <p className="profile__email">{user?.email || 'hamjath@timebank.com'}</p>
              <div className="profile__badges">
                <span className="profile__badge" style={{ background: 'rgba(124,111,255,0.1)', color: '#7c6fff', border: '1px solid rgba(124,111,255,0.2)' }}>
                  ✦ Creator
                </span>
                <span className="profile__badge" style={{ background: 'rgba(111,255,212,0.1)', color: '#6fffd4', border: '1px solid rgba(111,255,212,0.2)' }}>
                  🇱🇰 Sri Lanka
                </span>
                <span className="profile__badge" style={{ background: 'rgba(255,209,102,0.1)', color: '#ffd166', border: '1px solid rgba(255,209,102,0.2)' }}>
                  ⭐ Top Helper
                </span>
              </div>
            </div>
            <button className="profile__edit-btn">Edit Profile</button>
          </div>
        </div>

        {/* Stats */}
        <div className="profile__stats">
          <div className="profile__stat">
            <div className="profile__stat-num" style={{ color: '#7c6fff' }}>{user?.timeCredits || 5}</div>
            <div className="profile__stat-label">Time Credits</div>
          </div>
          <div className="profile__stat">
            <div className="profile__stat-num" style={{ color: '#6fffd4' }}>12</div>
            <div className="profile__stat-label">People Helped</div>
          </div>
          <div className="profile__stat">
            <div className="profile__stat-num" style={{ color: '#ff6fb0' }}>4.9</div>
            <div className="profile__stat-label">Rating</div>
          </div>
          <div className="profile__stat">
            <div className="profile__stat-num" style={{ color: '#ffd166' }}>8</div>
            <div className="profile__stat-label">Sessions</div>
          </div>
        </div>

        {/* Skills */}
        <div className="dash__txns" style={{ marginTop: '20px' }}>
          <div className="dash__section-title">
            My Skills
            <span className="dash__section-link">+ Add Skill</span>
          </div>
          <div className="dash__skill-tags" style={{ marginTop: '14px' }}>
            {SKILLS.map((skill, i) => (
              <div key={i} className="dash__skill-tag" style={{ color: skill.color, background: skill.bg, borderColor: skill.border }}>
                {skill.name}
              </div>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div className="dash__txns" style={{ marginTop: '14px' }}>
          <div className="dash__section-title">About Me</div>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', marginTop: '12px' }}>
            Full Stack Developer from Sri Lanka 🇱🇰 Passionate about technology, community building, and helping others grow through skill exchange. Creator of TimeBank — Sri Lanka's first time exchange platform.
          </p>
        </div>

      </main>
    </div>
  )
}

export default Profile