import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import '../styles/dashboard.css'
import '../styles/messages.css'

const CHATS = [
  { id: 1, name: 'Aisha Fernando', initials: 'AF', color: '#ff6fb0', bg: 'rgba(255,111,176,0.15)', lastMsg: 'Sure! I can help you with Tamil lessons tomorrow.', time: '2m ago', unread: 2, skill: 'Tamil Lessons' },
  { id: 2, name: 'Kamal Perera', initials: 'KP', color: '#7c6fff', bg: 'rgba(124,111,255,0.15)', lastMsg: 'Thanks for the React help! Really appreciated.', time: '1h ago', unread: 0, skill: 'React Tutoring' },
  { id: 3, name: 'Nimal Silva', initials: 'NS', color: '#6fffd4', bg: 'rgba(111,255,212,0.15)', lastMsg: 'The cooking session was amazing! Lets do it again.', time: '3h ago', unread: 1, skill: 'Cooking Class' },
  { id: 4, name: 'Priya Rajapaksa', initials: 'PR', color: '#ffd166', bg: 'rgba(255,209,102,0.15)', lastMsg: 'When are you free for the Python session?', time: 'Yesterday', unread: 0, skill: 'Python Help' },
  { id: 5, name: 'Dilshan Bandara', initials: 'DB', color: '#ff6fb0', bg: 'rgba(255,111,176,0.15)', lastMsg: 'Guitar session confirmed for Saturday!', time: 'Yesterday', unread: 0, skill: 'Guitar Lessons' },
]

function Messages() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'MH'

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
          <div className="dash__nav-item active">
            <div className="dash__nav-item-icon" style={{ background: 'rgba(255,209,102,0.15)', color: '#ffd166' }}>
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
            <h1 className="dash__header-title">Messages</h1>
            <p className="dash__header-sub">Your skill exchange conversations</p>
          </div>
        </div>

        <div className="msgs__list">
          {CHATS.map(chat => (
            <div key={chat.id} className="msgs__item">
              <div className="msgs__avatar" style={{ background: chat.bg, color: chat.color }}>
                {chat.initials}
              </div>
              <div className="msgs__info">
                <div className="msgs__top">
                  <span className="msgs__name">{chat.name}</span>
                  <span className="msgs__time">{chat.time}</span>
                </div>
                <div className="msgs__skill-tag">{chat.skill}</div>
                <div className="msgs__preview">{chat.lastMsg}</div>
              </div>
              {chat.unread > 0 && (
                <div className="msgs__unread">{chat.unread}</div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default Messages