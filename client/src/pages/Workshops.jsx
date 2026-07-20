import MobileNav from '../components/MobileNav'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'
import '../styles/dashboard.css'

const API = 'https://timebank-app.onrender.com/api'
const CATEGORIES = ['All', 'Technology', 'Design', 'Education', 'Cooking', 'Music', 'Language', 'Business', 'Health', 'Other']

function CreateWorkshopModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'Education', date: '', time: '',
    durationMinutes: 60, meetingLink: '', capacity: 10, creditsPerPerson: 1
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: ['durationMinutes', 'capacity', 'creditsPerPerson'].includes(name) ? Number(value) : value })
  }

  const handleSubmit = async () => {
    if (!form.title || !form.date || !form.time) return
    setLoading(true)
    setError('')
    const result = await onCreate(form)
    setLoading(false)
    if (result.success) onClose()
    else setError(result.message || 'Failed to create class')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>Host a Class</h2>
        {error && (
          <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff5050', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px' }}>{error}</div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Class Title</label>
          <input name="title" placeholder="e.g. Beginner Spanish Conversation" value={form.title} onChange={handleChange} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}/>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Description</label>
          <textarea name="description" placeholder="What will students learn?" rows={3} value={form.description} onChange={handleChange} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }}/>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Category</label>
          <select name="category" value={form.category} onChange={handleChange} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}>
            {CATEGORIES.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}/>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Time</label>
            <input type="time" name="time" value={form.time} onChange={handleChange} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}/>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Capacity</label>
            <input type="number" name="capacity" min={1} max={100} value={form.capacity} onChange={handleChange} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}/>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Credits / student</label>
            <input type="number" name="creditsPerPerson" min={1} value={form.creditsPerPerson} onChange={handleChange} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}/>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Meeting Link (optional)</label>
          <input name="meetingLink" placeholder="https://meet.google.com/..." value={form.meetingLink} onChange={handleChange} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}/>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !form.title || !form.date || !form.time} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{loading ? 'Creating...' : 'Host Class →'}</button>
        </div>
      </div>
    </div>
  )
}

function WorkshopCard({ workshop, currentUserId, onJoin, onLeave, onCancel, onComplete }) {
  const isHost = String(workshop.host._id || workshop.host) === String(currentUserId)
  const isJoined = workshop.attendees?.some(a => String(a._id || a) === String(currentUserId))
  const isWaitlisted = workshop.waitlist?.some(a => String(a._id || a) === String(currentUserId))
  const isFull = workshop.attendeeCount >= workshop.capacity
  const initials = workshop.host?.name ? workshop.host.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '18px', padding: '20px', boxShadow: 'var(--shadow)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c6fff', background: 'rgba(124,111,255,0.1)', padding: '4px 10px', borderRadius: '20px' }}>{workshop.category}</span>
        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#ffd166', background: 'rgba(255,209,102,0.1)', padding: '4px 10px', borderRadius: '20px' }}>{workshop.creditsPerPerson}h/person</span>
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>{workshop.title}</h3>
      {workshop.description && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>{workshop.description}</p>}

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px', fontSize: '12.5px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <span>📅 {workshop.date}</span>
        <span>🕐 {workshop.time}</span>
        <span>👥 {workshop.attendeeCount}/{workshop.capacity}</span>
        {workshop.waitlistCount > 0 && (
          <span style={{ color: '#ff9f43', fontWeight: 600 }}>⏳ {workshop.waitlistCount} waiting</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', background: workshop.host?.avatar ? 'transparent' : 'linear-gradient(135deg, #7c6fff, #ff6fb0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
            {workshop.host?.avatar ? <img src={workshop.host.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>{workshop.host?.name}</span>
        </div>

        {isHost ? (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => onComplete(workshop._id)} style={{ background: 'rgba(0,184,148,0.1)', color: '#00b894', border: '1px solid rgba(0,184,148,0.25)', borderRadius: '8px', padding: '6px 12px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>Complete</button>
            <button onClick={() => onCancel(workshop._id)} style={{ background: 'rgba(255,80,80,0.08)', color: '#ff5050', border: '1px solid rgba(255,80,80,0.25)', borderRadius: '8px', padding: '6px 12px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          </div>
        ) : isJoined ? (
          <button onClick={() => onLeave(workshop._id)} style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 14px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>✓ Joined</button>
        ) : isWaitlisted ? (
          <button onClick={() => onLeave(workshop._id)} style={{ background: 'rgba(255,159,67,0.1)', color: '#ff9f43', border: '1px solid rgba(255,159,67,0.3)', borderRadius: '8px', padding: '6px 14px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>⏳ On Waitlist</button>
        ) : (
          <button onClick={() => onJoin(workshop._id)} style={{
            background: isFull ? 'rgba(255,159,67,0.1)' : 'linear-gradient(135deg, #7c6fff, #ff6fb0)',
            color: isFull ? '#ff9f43' : '#fff', border: isFull ? '1px solid rgba(255,159,67,0.3)' : 'none', borderRadius: '8px', padding: '6px 14px',
            fontSize: '11.5px', fontWeight: 700, cursor: 'pointer'
          }}>{isFull ? 'Join Waitlist' : 'Join Class'}</button>
        )}
      </div>
    </div>
  )
}

function WorkshopSkeleton() {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '18px', padding: '20px' }}>
      <div className="skeleton" style={{ width: '80px', height: '18px', borderRadius: '20px', marginBottom: '12px' }} />
      <div className="skeleton" style={{ width: '70%', height: '18px', marginBottom: '8px' }} />
      <div className="skeleton" style={{ width: '100%', height: '13px', marginBottom: '14px' }} />
      <div className="skeleton" style={{ width: '60%', height: '13px', marginBottom: '16px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ width: '90px', height: '28px', borderRadius: '20px' }} />
        <div className="skeleton" style={{ width: '80px', height: '28px', borderRadius: '8px' }} />
      </div>
    </div>
  )
}

function Workshops() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [workshops, setWorkshops] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState(null)
  const [cancelId, setCancelId] = useState(null)

  const fetchWorkshops = async () => {
    setLoading(true)
    try {
      const params = category !== 'All' ? { category } : {}
      const res = await axios.get(`${API}/workshops`, { params })
      setWorkshops(res.data.workshops || [])
    } catch (err) {
      console.error('Failed to fetch workshops:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWorkshops() }, [category])

  const handleCreate = async (form) => {
    try {
      const res = await axios.post(`${API}/workshops`, form, { headers: { Authorization: `Bearer ${token}` } })
      setToast({ message: 'Class created!', type: 'success' })
      fetchWorkshops()
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to create class' }
    }
  }

  const handleJoin = async (id) => {
    try {
      const res = await axios.post(`${API}/workshops/${id}/join`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setToast({ message: res.data.waitlisted ? "Class is full — you're on the waitlist!" : 'Joined the class!', type: 'success' })
      fetchWorkshops()
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to join', type: 'error' })
    }
  }

  const handleLeave = async (id) => {
    try {
      await axios.post(`${API}/workshops/${id}/leave`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setToast({ message: 'Left the class', type: 'success' })
      fetchWorkshops()
    } catch (err) {
      setToast({ message: 'Failed to leave', type: 'error' })
    }
  }

  const handleComplete = async (id) => {
    try {
      await axios.post(`${API}/workshops/${id}/complete`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setToast({ message: 'Class completed, credits settled!', type: 'success' })
      fetchWorkshops()
    } catch (err) {
      setToast({ message: 'Failed to complete class', type: 'error' })
    }
  }

  const confirmCancel = async () => {
    const id = cancelId
    setCancelId(null)
    try {
      await axios.delete(`${API}/workshops/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      setToast({ message: 'Class cancelled', type: 'success' })
      fetchWorkshops()
    } catch (err) {
      setToast({ message: 'Failed to cancel', type: 'error' })
    }
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
          <div className="dash__nav-item active">
            <div className="dash__nav-item-icon" style={{ background: 'rgba(111,255,212,0.15)', color: '#6fffd4' }}>
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
        </nav>

        <div className="dash__sidebar-bottom">
          <div className="dash__sidebar-user">
            <div className="dash__sidebar-avatar" style={user?.avatar ? { background: 'transparent', overflow: 'hidden', padding: 0 } : {}}>
              {user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9px' }} /> : (user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'MH')}
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
            <h1 className="dash__header-title">Classes & Workshops</h1>
            <p className="dash__header-sub">Group sessions — one host, many students, shared learning</p>
          </div>
          <button onClick={() => setShowCreate(true)} style={{
            background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff', border: 'none',
            borderRadius: '12px', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 3px 10px rgba(124,111,255,0.35)'
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Host a Class
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: '7px 14px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
              border: category === cat ? 'none' : '1px solid var(--border2)',
              background: category === cat ? 'linear-gradient(135deg, #7c6fff, #ff6fb0)' : 'var(--card)',
              color: category === cat ? '#fff' : 'var(--text-secondary)'
            }}>{cat}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {loading ? (
            [...Array(4)].map((_, i) => <WorkshopSkeleton key={i} />)
          ) : workshops.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>No classes yet</div>
              <div style={{ fontSize: '13px' }}>Host the first class and teach a group at once!</div>
            </div>
          ) : (
            workshops.map(w => (
              <WorkshopCard
                key={w._id}
                workshop={w}
                currentUserId={user?.id}
                onJoin={handleJoin}
                onLeave={handleLeave}
                onCancel={setCancelId}
                onComplete={handleComplete}
              />
            ))
          )}
        </div>
      </main>

      {showCreate && <CreateWorkshopModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {cancelId && (
        <ConfirmModal
          title="Cancel this class?"
          message="All joined students will be notified. This cannot be undone."
          danger
          onCancel={() => setCancelId(null)}
          onConfirm={confirmCancel}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <MobileNav />
    </div>
  )
}

export default Workshops