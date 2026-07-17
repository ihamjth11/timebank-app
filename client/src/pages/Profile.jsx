import MobileNav from '../components/MobileNav'
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Cropper from 'react-easy-crop'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import '../styles/dashboard.css'
import '../styles/profile.css'

const API = 'https://timebank-app.onrender.com/api'

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (err) => reject(err))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}

async function getCroppedImage(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc)
  const size = 300
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, size, size
  )
  return canvas.toDataURL('image/jpeg', 0.85)
}

function CropModal({ imageSrc, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setSaving(true)
    const cropped = await getCroppedImage(imageSrc, croppedAreaPixels)
    setSaving(false)
    onConfirm(cropped)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }} onClick={(e) => e.stopPropagation()}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '420px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Adjust your photo</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>Drag to reposition, use the slider to zoom</p>

        <div style={{ position: 'relative', width: '100%', height: '300px', background: '#000', borderRadius: '14px', overflow: 'hidden' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ width: '100%', marginTop: '16px', accentColor: '#7c6fff' }}
        />

        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleConfirm} disabled={saving} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Applying...' : 'Apply Crop'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditProfileModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || 'Sri Lanka',
    avatar: user?.avatar || ''
  })
  const [loading, setLoading] = useState(false)
  const [rawImage, setRawImage] = useState(null)

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setRawImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleCropConfirm = (croppedDataUrl) => {
    setForm(f => ({ ...f, avatar: croppedDataUrl }))
    setRawImage(null)
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
            Change Photo
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
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 1, padding: '11px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff', fontWeight: 600, cursor: 'pointer'
          }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {rawImage && (
        <CropModal
          imageSrc={rawImage}
          onCancel={() => setRawImage(null)}
          onConfirm={handleCropConfirm}
        />
      )}
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

function BadgesCard({ badges, streak, sessionCount }) {
  if (!badges) return null
  return (
    <div className="dash__txns" style={{ marginTop: '20px' }}>
      <div className="dash__section-title">
        Badges & Streak
        {streak > 0 && (
          <span style={{ fontSize: '12px', color: '#ff9f43', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ marginRight: '2px' }}>
  <path d="M12 2c-1.5 3.5-5 5.5-5 10a5 5 0 0010 0c0-1.5-.7-2.5-1.5-3.2 0 1.7-.8 2.7-1.7 2.7-1.5 0-1.7-1.7-.8-3.3.8-1.7-.2-3.5-1-6.2z" stroke="#ff9f43" strokeWidth="1.6" strokeLinejoin="round" fill="#ff9f43"/>
</svg>
{streak} week{streak > 1 ? 's' : ''} streak
          </span>
        )}
      </div>
      {badges.length === 0 ? (
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '12px' }}>
          Complete your first session to start earning badges!
        </p>
      ) : (
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
      )}
    </div>
  )
}

function Profile() {
  const [badgeData, setBadgeData] = useState(null)
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
            <div className="profile__stat-num" style={{ color: '#ff6fb0' }}>{badgeData?.peopleHelped ?? 0}</div>
            <div className="profile__stat-label">People Helped</div>
          </div>
          <div className="profile__stat">
            <div className="profile__stat-num" style={{ color: '#ffd166' }}>{badgeData?.sessionCount ?? 0}</div>
            <div className="profile__stat-label">Sessions</div>
          </div>
        </div>

        <ReferralCard user={user} />

        <BadgesCard badges={badgeData?.badges} streak={badgeData?.streak || 0} sessionCount={badgeData?.sessionCount || 0} />

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