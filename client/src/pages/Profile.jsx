import MobileNav from '../components/MobileNav'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import '../styles/dashboard.css'
import '../styles/profile.css'

const API = 'https://timebank-app.onrender.com/api'

function EditProfileModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || 'Sri Lanka',
    avatar: user?.avatar || ''
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)

    const img = new Image()
    const reader = new FileReader()
    reader.onload = (ev) => {
      img.onload = () => {
        const size = 300
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')

        const minSide = Math.min(img.width, img.height)
        const sx = (img.width - minSide) / 2
        const sy = (img.height - minSide) / 2

        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size)
        const compressed = canvas.toDataURL('image/jpeg', 0.8)
        setForm(f => ({ ...f, avatar: compressed }))
        setUploading(false)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }
  const handleSubmit = async () => {
    setLoading(true)
    const result = await onSave(form)
    setLoading(false)
    if (result.success) onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '420px',
        maxHeight: '85vh', overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
          Edit Profile
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden',
            background: form.avatar ? 'transparent' : 'linear-gradient(135deg, #7c6fff, #ff6fb0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '10px', border: '3px solid var(--border)'
          }}>
            {form.avatar ? (
              <img src={form.avatar} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#fff', fontSize: '24px', fontWeight: 700 }}>
                {form.name ? form.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
              </span>
            )}
          </div>
          <label style={{
            fontSize: '12.5px', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer'
          }}>
            {uploading ? 'Uploading...' : 'Change Photo'}
            <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
          </label>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Full Name</label>
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            style={{
              width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Location</label>
          <input
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
            style={{
              width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Bio</label>
          <textarea
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            maxLength={200}
            rows={3}
            style={{
              width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none',
              fontSize: '14px', fontFamily: 'inherit', resize: 'vertical'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer'
          }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading || uploading} style={{
            flex: 1, padding: '11px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff', fontWeight: 600, cursor: 'pointer'
          }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReferralCard({ user }) {
  const [copied, setCopied] = useState(false)

  if (!user?.referralCode) return null

  const referralLink = `https://timebank-app.vercel.app/register?ref=${user.referralCode}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  return (
    <div style={{
      marginTop: '20px', borderRadius: '20px', padding: '24px',
      background: 'linear-gradient(135deg, #7c6fff 0%, #a06fff 50%, #ff6fb0 100%)',
      position: 'relative', overflow: 'hidden', color: '#fff',
      boxShadow: '0 10px 30px rgba(124,111,255,0.3)'
    }}>
      <div style={{
        position: 'absolute', top: '-40px', right: '-30px', width: '150px', height: '150px',
        borderRadius: '50%', background: 'rgba(255,255,255,0.1)'
      }} />
      <div style={{
        position: 'absolute', bottom: '-50px', right: '60px', width: '110px', height: '110px',
        borderRadius: '50%', background: 'rgba(255,255,255,0.08)'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M20 12v9H4v-9M2 7h20v5H2V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C9 2 12 7 12 7z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: '15px', fontWeight: 700 }}>Invite Friends, Earn Credits</span>
        </div>
        <p style={{ fontSize: '12.5px', opacity: 0.92, marginBottom: '18px', lineHeight: '1.5', maxWidth: '340px' }}>
          Share your link — you and your friend both get <strong>+2 Time Credits</strong> when they join TimeBank.
        </p>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.16)',
          borderRadius: '12px', padding: '10px 12px', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <span style={{ flex: 1, fontSize: '12px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
            {referralLink}
          </span>
          <button onClick={handleCopy} style={{
            background: '#fff', color: '#7c6fff', border: 'none', borderRadius: '8px',
            padding: '7px 14px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', flexShrink: 0
          }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '24px', marginTop: '18px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.5px' }}>{user.referralCode}</div>
            <div style={{ fontSize: '10.5px', opacity: 0.85 }}>Your code</div>
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>{user.referralCount || 0}</div>
            <div style={{ fontSize: '10.5px', opacity: 0.85 }}>Friends invited</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Profile() {
  const { user, token, logout, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [showEdit, setShowEdit] = useState(false)
  const [mySkills, setMySkills] = useState([])
  const [loadingSkills, setLoadingSkills] = useState(true)

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'MH'

  const SKILL_COLORS = [
    { color: '#7c6fff', bg: 'rgba(124,111,255,0.1)', border: 'rgba(124,111,255,0.3)' },
    { color: '#ff6fb0', bg: 'rgba(255,111,176,0.1)', border: 'rgba(255,111,176,0.3)' },
    { color: '#6fffd4', bg: 'rgba(111,255,212,0.1)', border: 'rgba(111,255,212,0.3)' },
    { color: '#ffd166', bg: 'rgba(255,209,102,0.1)', border: 'rgba(255,209,102,0.3)' },
  ]

  useEffect(() => {
    const fetchMySkills = async () => {
      if (!user?.id) return
      setLoadingSkills(true)
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
  }, [user?.id])

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
            <h1 className="dash__header-title">Profile</h1>
            <p className="dash__header-sub">Your TimeBank identity</p>
          </div>
        </div>

        <div className="profile__card">
          <div className="profile__cover" />
          <div className="profile__info">
            <div className="profile__avatar" style={user?.avatar ? { background: 'transparent', overflow: 'hidden' } : {}}>
              {user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
            </div>
            <div className="profile__details">
              <h2 className="profile__name">{user?.name || 'Mohamed Hamjath'}</h2>
              <p className="profile__email">{user?.email || 'hamjath@timebank.com'}</p>
              <div className="profile__badges">
                <span className="profile__badge" style={{ background: 'rgba(124,111,255,0.1)', color: '#7c6fff', border: '1px solid rgba(124,111,255,0.2)' }}>
                  ✦ Creator
                </span>
                <span className="profile__badge" style={{ background: 'rgba(111,255,212,0.1)', color: '#00b894', border: '1px solid rgba(111,255,212,0.2)' }}>
                  🇱🇰 {user?.location || 'Sri Lanka'}
                </span>
              </div>
            </div>
            <button className="profile__edit-btn" onClick={() => setShowEdit(true)}>Edit Profile</button>
          </div>
        </div>

        <div className="profile__stats">
          <div className="profile__stat">
            <div className="profile__stat-num" style={{ color: '#7c6fff' }}>{user?.timeCredits ?? 5}</div>
            <div className="profile__stat-label">Time Credits</div>
          </div>
          <div className="profile__stat">
            <div className="profile__stat-num" style={{ color: '#6fffd4' }}>{mySkills.length}</div>
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

        <ReferralCard user={user} />

        <div className="dash__txns" style={{ marginTop: '20px' }}>
          <div className="dash__section-title">
            My Skills
            <span className="dash__section-link" onClick={() => navigate('/skills')}>+ Add Skill</span>
          </div>
          <div className="dash__skill-tags" style={{ marginTop: '14px' }}>
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
          </div>
        </div>

        <div className="dash__txns" style={{ marginTop: '14px' }}>
          <div className="dash__section-title">About Me</div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7', marginTop: '12px' }}>
            {user?.bio || "No bio added yet. Click 'Edit Profile' to add one!"}
          </p>
        </div>

      </main>

      {showEdit && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEdit(false)}
          onSave={updateProfile}
        />
      )}
      <MobileNav />
    </div>
  )
}

export default Profile