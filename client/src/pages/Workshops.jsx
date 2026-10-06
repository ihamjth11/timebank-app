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
// Must match MAX_CREDITS_PER_PERSON in server/routes/workshops.js
const MAX_CREDITS_PER_PERSON = 10

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

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>Host a Class</h2>
        {error && (
          <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff5050', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px' }}>{error}</div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Class Title</label>
          <input name="title" maxLength={120} placeholder="e.g. Beginner Spanish Conversation" value={form.title} onChange={handleChange} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}/>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Description</label>
          <textarea name="description" maxLength={2000} placeholder="What will students learn?" rows={3} value={form.description} onChange={handleChange} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }}/>
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
            <input type="date" name="date" min={today} value={form.date} onChange={handleChange} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}/>
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
            <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Credits / student (max {MAX_CREDITS_PER_PERSON})</label>
            <input type="number" name="creditsPerPerson" min={1} max={MAX_CREDITS_PER_PERSON} value={form.creditsPerPerson} onChange={handleChange} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}/>
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Meeting Link (optional, https only)</label>
          <input name="meetingLink" placeholder="https://meet.google.com/..." value={form.meetingLink} onChange={handleChange} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}/>
        </div>

        <div style={{ marginBottom: '20px', padding: '12px 14px', borderRadius: '12px', background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>How you get paid</div>
          <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Each student's credits are held in escrow when they join. After the class, every student confirms they attended and their credits are released to you. If you cancel the class, everyone is refunded.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !form.title || !form.date || !form.time} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{loading ? 'Creating...' : 'Host Class →'}</button>
        </div>
      </div>
    </div>
  )
}

// A student reports a problem. Only THEIR credits are frozen until the team reviews it.
function ReportProblemModal({ workshop, onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const valid = reason.trim().length >= 10

  const handleSubmit = async () => {
    if (!valid || loading) return
    setLoading(true)
    const ok = await onSubmit(reason.trim())
    if (!ok) setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '26px', width: '100%', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Report a problem</h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
          Your {workshop?.creditsPerPerson} held credit{workshop?.creditsPerPerson > 1 ? 's are' : ' is'} frozen until the TimeBank team reviews "{workshop?.title}". Describe what happened.
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="For example: the host never started the class."
          rows={4}
          maxLength={1000}
          style={{
            width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '13px',
            resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
          }}
        />
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
          {reason.trim().length}/1000 {reason.trim().length < 10 ? '(at least 10 characters)' : ''}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!valid || loading} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: '#ff5050', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: valid ? 1 : 0.5 }}>{loading ? 'Sending...' : 'Report problem'}</button>
        </div>
      </div>
    </div>
  )
}

// The host reads the student's report and adds their side of the story.
function HostResponseModal({ workshop, dispute, onClose, onSubmit }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const valid = message.trim().length >= 5

  const handleSubmit = async () => {
    if (!valid || loading) return
    setLoading(true)
    const ok = await onSubmit(message.trim())
    if (!ok) setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '26px', width: '100%', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Add your side</h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.5 }}>
          A student reported a problem with "{workshop?.title}":
        </p>
        <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: 'var(--text)', marginBottom: '14px', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
          {dispute?.reason}
        </div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Your explanation for the TimeBank team"
          rows={4}
          maxLength={1000}
          style={{
            width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '13px',
            resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
          }}
        />
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!valid || loading} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: valid ? 1 : 0.5 }}>{loading ? 'Sending...' : 'Send'}</button>
        </div>
      </div>
    </div>
  )
}

function WorkshopCard({ workshop, myDispute, hostDisputes, onJoin, onLeave, onCancel, onComplete, onConfirm, onReport, onRespond }) {
  // Everything about "me" comes from the server, never from other people's ids
  const viewer = workshop.viewer || {}
  const { isHost, isJoined, isWaitlisted, hasStarted, enrollmentStatus, canConfirm } = viewer
  const isCompleted = workshop.status === 'completed'
  const isFull = workshop.attendeeCount >= workshop.capacity
  const initials = workshop.host?.name ? workshop.host.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'
  // Only real https links are opened (blocks javascript: and data: links)
  const showLink = /^https:\/\//i.test(workshop.meetingLink || '')
  const price = workshop.creditsPerPerson

  const canReport = isJoined && enrollmentStatus === 'held' && hasStarted && !myDispute
  const unanswered = (hostDisputes || []).filter(d => !d.response)

  const smallButton = (extra) => ({
    borderRadius: '8px', padding: '6px 14px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', ...extra
  })

  let action
  if (isHost) {
    action = (
      <div style={{ display: 'flex', gap: '6px' }}>
        {isCompleted ? (
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#00b894' }}>✓ Completed</span>
        ) : (
          <>
            {hasStarted && (
              <button onClick={() => onComplete(workshop._id)} style={smallButton({ background: 'rgba(0,184,148,0.1)', color: '#00b894', border: '1px solid rgba(0,184,148,0.25)' })}>Complete</button>
            )}
            <button onClick={() => onCancel(workshop._id)} style={smallButton({ background: 'rgba(255,80,80,0.08)', color: '#ff5050', border: '1px solid rgba(255,80,80,0.25)' })}>Cancel</button>
          </>
        )}
      </div>
    )
  } else if (isJoined) {
    if (myDispute) {
      action = <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#ffb800' }}>Under review</span>
    } else if (canConfirm) {
      action = (
        <button onClick={() => onConfirm(workshop._id)} style={smallButton({ background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff', border: 'none' })}>Confirm attendance</button>
      )
    } else if (enrollmentStatus === 'held' && !hasStarted) {
      action = (
        <button onClick={() => onLeave(workshop._id)} title="Leave and get your credits back" style={smallButton({ background: 'var(--input-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' })}>✓ Joined · Leave</button>
      )
    } else if (enrollmentStatus === 'held') {
      action = <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#ffb800' }}>Credits frozen</span>
    } else if (!hasStarted) {
      // Joined before escrow existed: nothing is held yet
      action = (
        <button onClick={() => onLeave(workshop._id)} style={smallButton({ background: 'var(--input-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' })}>✓ Joined · Leave</button>
      )
    } else {
      action = <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#00b894' }}>✓ Joined</span>
    }
  } else if (isWaitlisted) {
    action = (
      <button onClick={() => onLeave(workshop._id)} style={smallButton({ background: 'rgba(255,159,67,0.1)', color: '#ff9f43', border: '1px solid rgba(255,159,67,0.3)' })}>⏳ On Waitlist</button>
    )
  } else if (hasStarted || isCompleted) {
    action = <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>{isCompleted ? 'Completed' : 'Already started'}</span>
  } else {
    action = (
      <button onClick={() => onJoin(workshop._id)} style={smallButton({
        background: isFull ? 'rgba(255,159,67,0.1)' : 'linear-gradient(135deg, #7c6fff, #ff6fb0)',
        color: isFull ? '#ff9f43' : '#fff',
        border: isFull ? '1px solid rgba(255,159,67,0.3)' : 'none'
      })}>{isFull ? 'Join Waitlist' : `Join · ${price} credit${price > 1 ? 's' : ''}`}</button>
    )
  }

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '18px', padding: '20px', boxShadow: 'var(--shadow)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c6fff', background: 'rgba(124,111,255,0.1)', padding: '4px 10px', borderRadius: '20px' }}>{workshop.category}</span>
        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#ffd166', background: 'rgba(255,209,102,0.1)', padding: '4px 10px', borderRadius: '20px' }}>{price} credit{price > 1 ? 's' : ''}/person</span>
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

      {/* Meeting link: the server only sends it to the host and to joined students */}
      {showLink && (
        <a
          href={workshop.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: 'rgba(111,255,212,0.08)', border: '1px solid rgba(111,255,212,0.25)',
            borderRadius: '10px', padding: '8px 12px', marginBottom: '14px',
            fontSize: '12.5px', fontWeight: 600, color: '#6fffd4', textDecoration: 'none'
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M15 3h6v6M10 14L21 3M9 3H3v18h18v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Join Meeting
        </a>
      )}

      {!isHost && !isJoined && !isWaitlisted && !hasStarted && !isCompleted && (
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.4 }}>
          {isFull
            ? 'Nothing is charged until a seat opens up for you.'
            : 'Your credits are held in escrow and only released to the host after you confirm you attended.'}
        </p>
      )}

      {isHost && (hostDisputes || []).length > 0 && (
        <div style={{ background: 'rgba(255,209,102,0.1)', border: '1px solid rgba(255,209,102,0.3)', borderRadius: '10px', padding: '8px 12px', marginBottom: '12px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {hostDisputes.length} student{hostDisputes.length > 1 ? 's' : ''} reported a problem with this class. Their credits are frozen until the TimeBank team reviews it.
          {unanswered.length > 0 && (
            <div style={{ marginTop: '6px' }}>
              <button onClick={() => onRespond(workshop, unanswered[0])} style={smallButton({ background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff', border: 'none' })}>Respond ({unanswered.length})</button>
            </div>
          )}
        </div>
      )}

      {myDispute && (
        <p style={{ fontSize: '11.5px', color: '#ffb800', fontWeight: 600, margin: '0 0 12px', lineHeight: 1.4 }}>
          Your problem report is under review. Your credits stay frozen until the TimeBank team decides.
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', background: workshop.host?.avatar ? 'transparent' : 'linear-gradient(135deg, #7c6fff, #ff6fb0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
            {workshop.host?.avatar ? <img src={workshop.host.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>{workshop.host?.name}</span>
        </div>
        {action}
      </div>

      {canReport && (
        <div style={{ marginTop: '10px', textAlign: 'right' }}>
          <button onClick={() => onReport(workshop._id)} style={{ background: 'none', border: 'none', color: '#ff5050', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Report a problem</button>
        </div>
      )}
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
  const { user, token, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [workshops, setWorkshops] = useState([])
  const [classDisputes, setClassDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState(null)
  const [cancelId, setCancelId] = useState(null)
  const [completeId, setCompleteId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [reportWorkshopId, setReportWorkshopId] = useState(null)
  const [respondTarget, setRespondTarget] = useState(null) // { workshop, dispute }

  const myId = String(user?.id || '')
  const authHeaders = () => (token ? { Authorization: `Bearer ${token}` } : {})

  const syncBalance = () => {
    if (typeof refreshUser === 'function') refreshUser()
  }

  const fetchWorkshops = async () => {
    setLoading(true)
    try {
      const params = category !== 'All' ? { category } : {}
      // Sending the token lets the server tell us what is true for ME (joined, host, ...)
      const [res, disputeRes] = await Promise.all([
        axios.get(`${API}/workshops`, { params, headers: authHeaders() }),
        // A failure here must never hide the classes
        token
          ? axios.get(`${API}/class-disputes/mine`, { headers: authHeaders() }).catch(() => ({ data: { disputes: [] } }))
          : Promise.resolve({ data: { disputes: [] } })
      ])
      setWorkshops(res.data.workshops || [])
      setClassDisputes(disputeRes.data.disputes || [])
    } catch (err) {
      console.error('Failed to fetch workshops:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWorkshops() }, [category, token])

  const openDisputesFor = (workshopId) =>
    classDisputes.filter(d => String(d.workshop) === String(workshopId) && d.status === 'open')

  const handleCreate = async (form) => {
    try {
      await axios.post(`${API}/workshops`, form, { headers: authHeaders() })
      setToast({ message: 'Class created!', type: 'success' })
      fetchWorkshops()
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to create class' }
    }
  }

  const handleJoin = async (id) => {
    try {
      const res = await axios.post(`${API}/workshops/${id}/join`, {}, { headers: authHeaders() })
      if (res.data.waitlisted) {
        setToast({ message: "Class is full. You're on the waitlist, nothing is charged yet.", type: 'success' })
      } else {
        const held = res.data.heldCredits
        const balance = typeof res.data.timeCredits === 'number' ? ` Balance: ${res.data.timeCredits}.` : ''
        setToast({ message: `Joined! ${held} credit${held === 1 ? '' : 's'} held in escrow.${balance}`, type: 'success' })
      }
      syncBalance()
      fetchWorkshops()
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to join', type: 'error' })
    }
  }

  const handleLeave = async (id) => {
    try {
      const res = await axios.post(`${API}/workshops/${id}/leave`, {}, { headers: authHeaders() })
      setToast({ message: res.data.refunded ? 'Left the class. Your credits were refunded.' : 'Left the class', type: 'success' })
      syncBalance()
      fetchWorkshops()
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to leave', type: 'error' })
    }
  }

  const confirmComplete = async () => {
    const id = completeId
    setCompleteId(null)
    try {
      await axios.post(`${API}/workshops/${id}/complete`, {}, { headers: authHeaders() })
      setToast({ message: 'Class marked as completed. Students will confirm and their credits are released to you.', type: 'success' })
      fetchWorkshops()
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to complete class', type: 'error' })
    }
  }

  const confirmAttendance = async () => {
    const id = confirmId
    setConfirmId(null)
    try {
      await axios.post(`${API}/workshops/${id}/confirm`, {}, { headers: authHeaders() })
      setToast({ message: 'Thanks! Your credits were released to the host.', type: 'success' })
      syncBalance()
      fetchWorkshops()
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to confirm attendance', type: 'error' })
    }
  }

  const confirmCancel = async () => {
    const id = cancelId
    setCancelId(null)
    try {
      await axios.delete(`${API}/workshops/${id}`, { headers: authHeaders() })
      setToast({ message: 'Class cancelled. Everyone was refunded.', type: 'success' })
      fetchWorkshops()
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to cancel', type: 'error' })
    }
  }

  // Student: opens a dispute. Returns true on success so the modal can close.
  const submitReport = async (reason) => {
    try {
      await axios.post(
        `${API}/class-disputes`,
        { workshopId: reportWorkshopId, reason },
        { headers: authHeaders() }
      )
      setReportWorkshopId(null)
      setToast({ message: 'Problem reported. Your credits are frozen until the TimeBank team reviews it.', type: 'success' })
      fetchWorkshops()
      return true
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to report the problem', type: 'error' })
      return false
    }
  }

  // Host: adds their side. Returns true on success so the modal can close.
  const submitHostResponse = async (message) => {
    try {
      await axios.post(
        `${API}/class-disputes/${respondTarget.dispute._id}/respond`,
        { message },
        { headers: authHeaders() }
      )
      setRespondTarget(null)
      setToast({ message: 'Your side was sent to the TimeBank team.', type: 'success' })
      fetchWorkshops()
      return true
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to send your response', type: 'error' })
      return false
    }
  }

  const reportWorkshop = workshops.find(w => w._id === reportWorkshopId)

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
            workshops.map(w => {
              const openDisputes = openDisputesFor(w._id)
              return (
                <WorkshopCard
                  key={w._id}
                  workshop={w}
                  myDispute={openDisputes.find(d => String(d.student) === myId)}
                  hostDisputes={openDisputes.filter(d => String(d.host) === myId)}
                  onJoin={handleJoin}
                  onLeave={handleLeave}
                  onCancel={setCancelId}
                  onComplete={setCompleteId}
                  onConfirm={setConfirmId}
                  onReport={setReportWorkshopId}
                  onRespond={(workshop, dispute) => setRespondTarget({ workshop, dispute })}
                />
              )
            })
          )}
        </div>
      </main>

      {showCreate && <CreateWorkshopModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {reportWorkshopId && (
        <ReportProblemModal workshop={reportWorkshop} onClose={() => setReportWorkshopId(null)} onSubmit={submitReport} />
      )}
      {respondTarget && (
        <HostResponseModal
          workshop={respondTarget.workshop}
          dispute={respondTarget.dispute}
          onClose={() => setRespondTarget(null)}
          onSubmit={submitHostResponse}
        />
      )}
      {completeId && (
        <ConfirmModal
          title="Mark this class as completed?"
          message="Only do this if the class really took place. No credits move yet: each student confirms they attended, and their credits are then released to you."
          onCancel={() => setCompleteId(null)}
          onConfirm={confirmComplete}
        />
      )}
      {confirmId && (
        <ConfirmModal
          title="Confirm you attended?"
          message="Only confirm if the class really took place. Your held credits will be released to the host."
          onCancel={() => setConfirmId(null)}
          onConfirm={confirmAttendance}
        />
      )}
      {cancelId && (
        <ConfirmModal
          title="Cancel this class?"
          message="All joined students will be notified and every credit held for this class is refunded. This cannot be undone."
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