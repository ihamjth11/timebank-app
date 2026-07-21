import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'
import '../styles/dashboard.css'
import '../styles/profile.css'

const API = 'https://timebank-app.onrender.com/api'

function StarRow({ rating, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" fill={n <= Math.round(rating) ? '#ffd166' : 'none'} stroke="#ffd166" strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  )
}

const BADGE_META = {
  first_steps: {
    color: '#00b894', bg: 'rgba(0,184,148,0.1)', border: 'rgba(0,184,148,0.25)',
    icon: (<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 3C8.5 3 6 6 6 9.5 6 11.5 7 12.5 7 14.5c0 2.5-1.5 3.5-1.5 6.5h13c0-3-1.5-4-1.5-6.5 0-2 1-3 1-5C18 6 15.5 3 12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>)
  },
  getting_started: {
    color: '#ff9f43', bg: 'rgba(255,159,67,0.1)', border: 'rgba(255,159,67,0.25)',
    icon: (<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 2c-1.5 3.5-5 5.5-5 10a5 5 0 0010 0c0-1.5-.7-2.5-1.5-3.2 0 1.7-.8 2.7-1.7 2.7-1.5 0-1.7-1.7-.8-3.3.8-1.7-.2-3.5-1-6.2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>)
  },
  timebank_champion: {
    color: '#ffd166', bg: 'rgba(255,209,102,0.12)', border: 'rgba(255,209,102,0.3)',
    icon: (<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M7 4h10v4a5 5 0 01-10 0V4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M7 5H4a2 2 0 002 4M17 5h3a2 2 0 01-2 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M12 13v4M9 21h6M10 17h4v4h-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>)
  },
  highly_rated: {
    color: '#ff6fb0', bg: 'rgba(255,111,176,0.1)', border: 'rgba(255,111,176,0.25)',
    icon: (<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)
  },
  community_builder: {
    color: '#7c6fff', bg: 'rgba(124,111,255,0.1)', border: 'rgba(124,111,255,0.25)',
    icon: (<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M20 12v9H4v-9M2 7h20v5H2V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C9 2 12 7 12 7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/></svg>)
  }
}

function BadgesCard({ badges, streak }) {
  if (!badges || badges.length === 0) return null
  return (
    <div className="dash__txns" style={{ marginTop: '14px' }}>
      <div className="dash__section-title">
        Badges & Streak
        {streak > 0 && (
          <span style={{ fontSize: '12px', color: '#ff9f43', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            🔥 {streak} week{streak > 1 ? 's' : ''} streak
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
        {badges.map(b => {
          const meta = BADGE_META[b.id] || BADGE_META.first_steps
          return (
            <div key={b.id} title={b.desc} style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px 7px 8px',
              background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: '30px'
            }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%', background: meta.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0
              }}>
                {meta.icon}
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: meta.color }}>{b.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'no_show', label: 'No-show / broken commitment' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'other', label: 'Other' }
]

const IconFlag = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 3v18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M5 4h11l-2.5 4L16 12H5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
)
const IconBlock = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/><path d="M5.5 5.5l13 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
)
const IconCheckSmall = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
)
const IconDots = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="19" cy="12" r="1.7" fill="currentColor"/></svg>
)

function ReportModal({ userName, onClose, onSubmit }) {
  const [reason, setReason] = useState('spam')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    await onSubmit(reason, details)
    setLoading(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Report {userName}</h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px' }}>Your report is confidential and reviewed by TimeBank moderators.</p>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Reason</label>
          <select value={reason} onChange={e => setReason(e.target.value)} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}>
            {REPORT_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Details (optional)</label>
          <textarea rows={3} value={details} onChange={e => setDetails(e.target.value)} placeholder="What happened?" style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: '#ff5050', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Submitting...' : 'Submit Report'}</button>
        </div>
      </div>
    </div>
  )
}

function PublicProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser, token, logout } = useAuth()
  const [profileUser, setProfileUser] = useState(null)
  const [userSkills, setUserSkills] = useState([])
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [badgeData, setBadgeData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const menuBtnRef = useRef(null)

  useEffect(() => {
    if (!showMoreMenu) return
    const handleClickOutside = (e) => {
      if (menuBtnRef.current && !menuBtnRef.current.contains(e.target)) {
        setShowMoreMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMoreMenu])
  const [showReportModal, setShowReportModal] = useState(false)
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [toast, setToast] = useState(null)

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'MH'

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const [userRes, skillsRes, reviewsRes, badgesRes] = await Promise.all([
          axios.get(`${API}/auth/user/${userId}`),
          axios.get(`${API}/skills`),
          axios.get(`${API}/reviews/user/${userId}`),
          axios.get(`${API}/badges/${userId}`)
        ])
        setProfileUser(userRes.data.user)
        const allSkills = skillsRes.data.skills || []
        setUserSkills(allSkills.filter(s => s.user === userId))
        setReviews(reviewsRes.data.reviews || [])
        setAvgRating(reviewsRes.data.avgRating || 0)
        setReviewCount(reviewsRes.data.reviewCount || 0)
        setBadgeData(badgesRes.data)
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [userId])

  useEffect(() => {
    setIsBlocked((currentUser?.blockedUsers || []).some(id => String(id) === String(userId)))
  }, [currentUser, userId])

  const confirmBlock = async () => {
    setShowBlockConfirm(false)
    try {
      await axios.post(`${API}/moderation/block/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setIsBlocked(true)
      setToast({ message: 'User blocked', type: 'success' })
    } catch (err) {
      setToast({ message: 'Failed to block user', type: 'error' })
    }
  }

  const handleUnblock = async () => {
    try {
      await axios.post(`${API}/moderation/unblock/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setIsBlocked(false)
      setToast({ message: 'User unblocked', type: 'success' })
    } catch (err) {
      setToast({ message: 'Failed to unblock user', type: 'error' })
    }
  }

  const handleReport = async (reason, details) => {
    try {
      await axios.post(`${API}/moderation/reports`, { reportedUserId: userId, reason, details }, { headers: { Authorization: `Bearer ${token}` } })
      setToast({ message: 'Report submitted. Thank you for keeping TimeBank safe.', type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to submit report', type: 'error' })
    }
  }

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
      setToast({ message: err.response?.data?.message || 'Failed to start conversation', type: 'error' })
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
                <div className="profile__avatar" style={profileUser.avatar ? { background: 'transparent', overflow: 'hidden', position: 'relative' } : { position: 'relative' }}>
                  {profileUser.avatar ? <img src={profileUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : profileInitials}
                  {reviewCount > 0 && (
                    <div style={{
                      position: 'absolute', bottom: '-4px', right: '-4px',
                      background: '#ffd166', color: '#5c3d00', borderRadius: '20px',
                      padding: '3px 8px', fontSize: '11px', fontWeight: 800,
                      display: 'flex', alignItems: 'center', gap: '3px',
                      border: '2px solid var(--card)', boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                    }}>
                      ⭐ {avgRating}
                    </div>
                  )}
                </div>
                <div className="profile__details">
                  <h2 className="profile__name">{profileUser.name}</h2>
                  <div className="profile__badges">
                    <span className="profile__badge" style={{ background: 'rgba(111,255,212,0.1)', color: '#00b894', border: '1px solid rgba(111,255,212,0.2)' }}>
                      🇱🇰 {profileUser.location || 'Sri Lanka'}
                    </span>
                    {reviewCount > 0 && (
                      <span className="profile__badge" style={{ background: 'rgba(255,209,102,0.1)', color: '#ffb020', border: '1px solid rgba(255,209,102,0.25)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <StarRow rating={avgRating} size={12} />
                        {avgRating} ({reviewCount})
                      </span>
                    )}
                  </div>
                </div>
                {profileUser._id !== currentUser?.id && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} ref={menuBtnRef}>
                    <button className="profile__edit-btn" onClick={handleMessage}>💬 Message</button>
                    <button
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
                        setShowMoreMenu(!showMoreMenu)
                      }}
                      style={{
                        width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border2)',
                        background: 'var(--card)', color: 'var(--text-secondary)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    ><IconDots /></button>
                    {showMoreMenu && (
                      <div style={{
                        position: 'fixed', top: `${menuPos.top}px`, right: `${menuPos.right}px`, background: 'var(--card)',
                        border: '1px solid var(--border2)', borderRadius: '14px', boxShadow: 'var(--shadow-lg)',
                        zIndex: 500, minWidth: '170px', overflow: 'hidden'
                      }}>
                        <button
                          onClick={() => { setShowReportModal(true); setShowMoreMenu(false) }}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', padding: '11px 16px', background: 'none', border: 'none', color: 'var(--text)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          <span style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(255,159,67,0.12)', color: '#ff9f43', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconFlag size={13} /></span>
                          Report
                        </button>
                        <button
                          onClick={() => { setShowMoreMenu(false); isBlocked ? handleUnblock() : setShowBlockConfirm(true) }}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', padding: '11px 16px', background: 'none', border: 'none', color: '#ff5050', fontSize: '13px', fontWeight: 600, cursor: 'pointer', borderTop: '1px solid var(--border2)' }}
                        >
                          <span style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(255,80,80,0.1)', color: '#ff5050', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isBlocked ? <IconCheckSmall size={13} /> : <IconBlock size={13} />}
                          </span>
                          {isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="profile__stats">
              <div className="profile__stat">
                <div className="profile__stat-num" style={{ color: '#6fffd4' }}>{userSkills.length}</div>
                <div className="profile__stat-label">Skills Posted</div>
              </div>
              <div className="profile__stat">
                <div className="profile__stat-num" style={{ color: '#ff6fb0' }}>{reviewCount}</div>
                <div className="profile__stat-label">Reviews</div>
              </div>
              <div className="profile__stat">
                <div className="profile__stat-num" style={{ color: '#ffd166' }}>{avgRating || '—'}</div>
                <div className="profile__stat-label">Avg Rating</div>
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

            <BadgesCard badges={badgeData?.badges} streak={badgeData?.streak || 0} />

            <div className="dash__txns" style={{ marginTop: '14px' }}>
              <div className="dash__section-title">Reviews {reviewCount > 0 && `(${reviewCount})`}</div>
              {reviews.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>No reviews yet.</p>
              ) : (
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reviews.map(r => (
                    <div key={r._id} style={{ padding: '12px 14px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{r.from?.name || 'Someone'}</span>
                        <StarRow rating={r.rating} size={13} />
                      </div>
                      {r.comment && (
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>{r.comment}</p>
                      )}
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '6px' }}>
                        {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      {showReportModal && (
        <ReportModal userName={profileUser?.name} onClose={() => setShowReportModal(false)} onSubmit={handleReport} />
      )}
      {showBlockConfirm && (
        <ConfirmModal
          title={`Block ${profileUser?.name}?`}
          message="They'll be hidden from your messages and skill feed, and won't be able to reach you."
          danger
          onCancel={() => setShowBlockConfirm(false)}
          onConfirm={confirmBlock}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default PublicProfile