import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import '../styles/dashboard.css'
import '../styles/profile.css'

const API = 'https://timebank-app.onrender.com/api'

function PublicProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser, token, logout } = useAuth()
  const [profileUser, setProfileUser] = useState(null)
  const [userSkills, setUserSkills] = useState([])
  const [loading, setLoading] = useState(true)

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'MH'

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const [userRes, skillsRes] = await Promise.all([
          axios.get(`${API}/auth/user/${userId}`),
          axios.get(`${API}/skills`)
        ])
        setProfileUser(userRes.data.user)
        const allSkills = skillsRes.data.skills || []
        setUserSkills(allSkills.filter(s => s.user === userId))
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [userId])

  const handleMessage = async () => {
    try {
      const convoRes = await axios.get(`${API}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const existing = (convoRes.data.conversations || []).find(c => c.otherUserId === userId)

      if (!existing) {
        await axios.post(`${API}/messages`, {
          receiverId: userId,
          text: `Hi! I'd like to connect with you on TimeBank.`
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      navigate('/messages')
    } catch (err) {
      alert('Failed to start conversation')
    }
  }

  const profileInitials = profileUser?.name
    ? profileUser.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : '?'

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
            <div className="dash__sidebar-avatar" style={currentUser?.avatar ? { background: 'transparent', overflow: 'hidden', padding: 0 } : {}}>
              {currentUser?.avatar ? <img src={currentUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9px' }} /> : initials}
            </div>
            <div>
              <div className="dash__sidebar-user-name">{currentUser?.name || 'Mohamed Hamjath'}</div>
              <div className="dash__sidebar-user-credits">{currentUser?.timeCredits ?? 5} Time Credits</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="dash__main">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading profile...</div>
        ) : !profileUser ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>User not found</div>
        ) : (
          <>
            <div className="dash__header">
              <div>
                <button onClick={() => navigate(-1)} style={{
                  background: 'none', border: 'none', color: 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  ← Back
                </button>
                <h1 className="dash__header-title">{profileUser.name}'s Profile</h1>
              </div>
            </div>

            <div className="profile__card">
              <div className="profile__cover" />
              <div className="profile__info">
                <div className="profile__avatar" style={profileUser.avatar ? { background: 'transparent', overflow: 'hidden' } : {}}>
                  {profileUser.avatar ? <img src={profileUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : profileInitials}
                </div>
                <div className="profile__details">
                  <h2 className="profile__name">{profileUser.name}</h2>
                  <div className="profile__badges">
                    <span className="profile__badge" style={{ background: 'rgba(111,255,212,0.1)', color: '#00b894', border: '1px solid rgba(111,255,212,0.2)' }}>
                      🇱🇰 {profileUser.location || 'Sri Lanka'}
                    </span>
                  </div>
                </div>
                {profileUser._id !== currentUser?.id && (
                  <button className="profile__edit-btn" onClick={handleMessage}>💬 Message</button>
                )}
              </div>
            </div>

            <div className="profile__stats">
              <div className="profile__stat">
                <div className="profile__stat-num" style={{ color: '#6fffd4' }}>{userSkills.length}</div>
                <div className="profile__stat-label">Skills Posted</div>
              </div>
              <div className="profile__stat">
                <div className="profile__stat-num" style={{ color: '#ff6fb0' }}>0</div>
                <div className="profile__stat-label">People Helped</div>
              </div>
              <div className="profile__stat">
                <div className="profile__stat-num" style={{ color: '#ffd166' }}>0</div>
                <div className="profile__stat-label">Sessions</div>
              </div>
            </div>

            <div className="dash__txns" style={{ marginTop: '20px' }}>
              <div className="dash__section-title">Skills Offered</div>
              <div className="dash__skill-tags" style={{ marginTop: '14px' }}>
                {userSkills.length === 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No skills posted yet</span>
                ) : (
                  userSkills.map((skill) => (
                    <div key={skill._id} className="dash__skill-tag" style={{ color: '#7c6fff', background: 'rgba(124,111,255,0.1)', borderColor: 'rgba(124,111,255,0.3)' }}>
                      {skill.title}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="dash__txns" style={{ marginTop: '14px' }}>
              <div className="dash__section-title">About</div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7', marginTop: '12px' }}>
                {profileUser.bio || 'No bio added yet.'}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default PublicProfile