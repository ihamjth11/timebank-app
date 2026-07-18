import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import ConfirmModal from '../components/ConfirmModal'
import MobileNav from '../components/MobileNav'
import '../styles/dashboard.css'
import '../styles/messages.css'

const API = 'https://timebank-app.onrender.com/api'
const MAX_FILE_SIZE = 2 * 1024 * 1024

function ScheduleModal({ onClose, onSchedule }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [link, setLink] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!date || !time) return
    setLoading(true)
    await onSchedule({ date, time, meetingLink: link })
    setLoading(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>Schedule a Session</h2>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}/>
        </div>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Time</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}/>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Meeting Link (optional)</label>
          <input type="text" placeholder="https://meet.google.com/..." value={link} onChange={e => setLink(e.target.value)} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}/>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !date || !time} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: (!date || !time) ? 0.5 : 1 }}>{loading ? 'Scheduling...' : 'Schedule'}</button>
        </div>
      </div>
    </div>
  )
}

function HelperPickModal({ activeChat, onClose, onPick }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '26px', width: '100%', maxWidth: '360px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Who helped in this session?</h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '20px' }}>The helper earns 1 Time Credit. Both people must agree.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => onPick('me')} style={{ padding: '13px', borderRadius: '12px', border: '1px solid var(--accent)', background: 'var(--input-bg)', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>I helped them</button>
          <button onClick={() => onPick('other')} style={{ padding: '13px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>{activeChat?.name} helped me</button>
          <button onClick={onClose} style={{ padding: '10px', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function EditSessionModal({ session, onClose, onSave }) {
  const [date, setDate] = useState(session.date)
  const [time, setTime] = useState(session.time)
  const [link, setLink] = useState(session.meetingLink || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!date || !time) return
    setLoading(true)
    await onSave({ date, time, meetingLink: link })
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>Edit Session</h2>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}/>
        </div>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Time</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}/>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Meeting Link (optional)</label>
          <input type="text" placeholder="https://meet.google.com/..." value={link} onChange={e => setLink(e.target.value)} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px' }}/>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !date || !time} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: (!date || !time) ? 0.5 : 1 }}>{loading ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  )
}

function StarPicker({ value, onChange, size = 28 }) {
  return (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <svg
          key={n}
          width={size} height={size} viewBox="0 0 24 24"
          fill={n <= value ? '#ffd166' : 'none'}
          stroke="#ffd166" strokeWidth="1.5"
          onClick={() => onChange(n)}
          style={{ cursor: 'pointer' }}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  )
}

function RatingModal({ activeChat, onClose, onSubmit }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) return
    setLoading(true)
    await onSubmit({ rating, comment })
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '380px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Rate your session</h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '18px' }}>How was your time with {activeChat?.name}?</p>
        <StarPicker value={rating} onChange={setRating} />
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Leave a comment (optional)"
          rows={3}
          style={{
            width: '100%', marginTop: '18px', background: 'var(--input-bg)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '13px',
            resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
          }}
        />
        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading || rating === 0} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: rating === 0 ? 0.5 : 1 }}>{loading ? 'Submitting...' : 'Submit'}</button>
        </div>
      </div>
    </div>
  )
}

function buildCalendarLink(session, otherName) {
  const start = new Date(`${session.date}T${session.time}:00+05:30`)
  const end = new Date(start.getTime() + 60 * 60 * 1000) // default 1-hour session
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const text = encodeURIComponent(`TimeBank Session with ${otherName}`)
  const dates = `${fmt(start)}/${fmt(end)}`
  const details = encodeURIComponent(
    session.meetingLink
      ? `Skill exchange session via TimeBank.\nMeeting link: ${session.meetingLink}`
      : `Skill exchange session via TimeBank.`
  )
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}`
}

function SessionCard({ session, currentUserId, activeChat, onMarkCompleted, onRate, alreadyRated, onEdit, onDelete }) {
  const isOrganizer = session.organizer === currentUserId
  const iConfirmed = session.completionConfirmedBy?.includes(currentUserId)
  return (
    <div style={{ alignSelf: 'center', background: 'var(--input-bg)', border: '1px solid var(--accent)', borderRadius: '14px', padding: '14px 18px', maxWidth: '85%', textAlign: 'center', margin: '8px 0' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px' }}>
        {session.status === 'completed' ? '✅ Session Completed' : '📅 Session Scheduled'}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>
        {new Date(session.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at {session.time}
      </div>
      {session.meetingLink && (
        <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '8px', fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>Join Meeting →</a>
      )}
      {session.status !== 'completed' && (
        <div style={{ marginTop: '6px' }}>
          <a
            href={buildCalendarLink(session, activeChat?.name || 'someone')}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px',
              color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none'
            }}
          >📅 Add to Google Calendar</a>
        </div>
      )}
      {!isOrganizer && session.status !== 'completed' && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Proposed by the other person</div>}
      {session.status !== 'completed' && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
          <button onClick={() => onEdit(session)} style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '5px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>✏️ Edit</button>
          <button onClick={() => onDelete(session._id)} style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff5050', borderRadius: '8px', padding: '5px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>🗑 Cancel</button>
        </div>
      )}
      {session.status !== 'completed' && (
        <div style={{ marginTop: '10px' }}>
          {iConfirmed ? (
            <div style={{ fontSize: '11.5px', color: '#00b894', fontWeight: 600 }}>✓ Waiting for confirmation...</div>
          ) : (
            <button onClick={() => onMarkCompleted(session._id)} style={{ background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff', border: 'none', borderRadius: '10px', padding: '7px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Mark as Completed</button>
          )}
        </div>
      )}
      {session.status === 'completed' && (
        <div style={{ marginTop: '10px' }}>
          {alreadyRated ? (
            <div style={{ fontSize: '11.5px', color: '#00b894', fontWeight: 600 }}>✓ You rated this session</div>
          ) : (
            <button onClick={() => onRate(session._id)} style={{ background: 'linear-gradient(135deg, #ffd166, #ff9f43)', color: '#fff', border: 'none', borderRadius: '10px', padding: '7px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>⭐ Rate this session</button>
          )}
        </div>
      )}
    </div>
  )
}

function SeenTicks({ read }) {
  return (
    <svg width="14" height="10" viewBox="0 0 16 11" fill="none" style={{ marginLeft: '3px' }}>
      <path d="M1 5.5L4.5 9L11 1" stroke={read ? '#4fc3f7' : 'currentColor'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.5 5.5L9 9L15.5 1" stroke={read ? '#4fc3f7' : 'currentColor'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const WAVE_BARS = [6, 12, 8, 16, 10, 20, 14, 8, 18, 12, 6, 16, 10, 14, 8, 20, 12, 6, 16, 10]

function VoiceNotePlayer({ src, isMine }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const decodedRef = useRef(false)

  const decodeDuration = () => {
    if (decodedRef.current || !src || !src.startsWith('data:')) return
    decodedRef.current = true
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const base64 = src.split(',')[1]
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const ctx = new AudioCtx()
      ctx.decodeAudioData(
        bytes.buffer,
        (decoded) => {
          if (isFinite(decoded.duration) && decoded.duration > 0) setDuration(decoded.duration)
          ctx.close()
        },
        () => ctx.close()
      )
    } catch (err) {
      // ignore, falls back to metadata listeners below
    }
  }

  useEffect(() => {
    decodeDuration()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    decodeDuration()
    if (playing) audio.pause()
    else audio.play()
  }

  const formatTime = (s) => {
    if (!s || isNaN(s) || !isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleLoadedMetadata = (e) => {
    const d = e.target.duration
    if (isFinite(d) && d > 0) setDuration(d)
  }

  const handleDurationChange = (e) => {
    const d = e.target.duration
    if (isFinite(d) && d > 0) setDuration(d)
  }

  const barColor = isMine ? 'rgba(255,255,255,0.9)' : 'var(--accent)'
  const barBg = isMine ? 'rgba(255,255,255,0.35)' : 'var(--border)'
  const playedCount = duration ? Math.round((progress / duration) * WAVE_BARS.length) : 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '190px', maxWidth: '100%', boxSizing: 'border-box' }}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0) }}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleDurationChange}
        onTimeUpdate={(e) => setProgress(e.target.currentTime)}
        style={{ display: 'none' }}
      />
      <button onClick={togglePlay} style={{
        width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
        background: isMine ? 'rgba(255,255,255,0.25)' : 'var(--accent)',
        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff'
      }}>
        {playing ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5px', flex: 1, height: '22px', minWidth: 0, overflow: 'hidden' }}>
        {WAVE_BARS.map((h, i) => (
          <div key={i} style={{ width: '2px', height: `${h}px`, borderRadius: '2px', background: i < playedCount ? barColor : barBg, flexShrink: 0 }} />
        ))}
      </div>
      <span style={{ fontSize: '10px', color: isMine ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)', flexShrink: 0, width: '26px', textAlign: 'right' }}>
        {formatTime(playing || progress > 0 ? progress : duration)}
      </span>
    </div>
  )
}

function MessageContent({ msg, isMine }) {
  if (msg.messageType === 'image') {
    return <img src={msg.fileData} alt="" style={{ maxWidth: '220px', maxHeight: '260px', borderRadius: '10px', display: 'block' }} />
  }
  if (msg.messageType === 'voice') {
    return <VoiceNotePlayer src={msg.fileData} isMine={isMine} />
  }
  if (msg.messageType === 'file') {
    return (
      <a href={msg.fileData} download={msg.fileName} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none' }}>
        <span style={{ fontSize: '18px' }}>📄</span>
        <span style={{ fontSize: '13px', wordBreak: 'break-all' }}>{msg.fileName || 'File'}</span>
      </a>
    )
  }
  return <div>{msg.text}</div>
}

function BubbleTail({ isMine }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      right: isMine ? '-6px' : undefined,
      left: isMine ? undefined : '-6px',
      width: 0,
      height: 0,
      borderStyle: 'solid',
      borderWidth: isMine ? '0 0 10px 10px' : '0 10px 10px 0',
      borderColor: isMine
        ? 'transparent transparent transparent #9d7cff'
        : 'transparent var(--input-bg) transparent transparent',
      pointerEvents: 'none'
    }} />
  )
}

function ChatBubble({ msg, isMine, senderInitials, time, onRequestDelete, selectMode, selected, onToggleSelect }) {
  const [showActions, setShowActions] = useState(false)
  const isMedia = msg.messageType === 'voice' || msg.messageType === 'image'

  const handleClick = () => { if (selectMode) onToggleSelect(msg._id) }

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'center', gap: '8px', marginBottom: '2px',
        background: selected ? 'rgba(124,111,255,0.08)' : 'transparent', borderRadius: '10px', padding: '2px 4px', cursor: selectMode ? 'pointer' : 'default'
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {selectMode && (
        <div style={{
          width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--accent)', flexShrink: 0,
          background: selected ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {selected && <span style={{ color: '#fff', fontSize: '11px' }}>✓</span>}
        </div>
      )}
      {!isMine && !selectMode && (
        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(124,111,255,0.15)', color: '#7c6fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>{senderInitials}</div>
      )}
      {isMine && showActions && !selectMode && (
        <button onClick={(e) => { e.stopPropagation(); onRequestDelete(msg._id) }} title="Delete message" style={{
          background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff5050', fontSize: '11px', flexShrink: 0
        }}>🗑</button>
      )}
      <div style={{ position: 'relative' }}>
        <div style={{
          background: isMine ? 'linear-gradient(135deg, #7c6fff, #9d7cff)' : 'var(--input-bg)',
          color: isMine ? '#fff' : 'var(--text)',
          padding: msg.messageType === 'image' ? '5px' : isMedia ? '8px 12px' : '9px 13px',
          borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          maxWidth: isMedia ? '85%' : '65%',
          width: msg.messageType === 'voice' ? 'auto' : undefined,
          fontSize: '13.5px', lineHeight: '1.4',
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)', position: 'relative', boxSizing: 'border-box', overflow: 'hidden'
        }}>
          <MessageContent msg={msg} isMine={isMine} />
          {msg.messageType !== 'voice' && (
            <div style={{
              fontSize: '10px', opacity: 0.85, marginTop: '3px', textAlign: 'right',
              color: isMine ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              padding: msg.messageType === 'image' ? '0 6px 4px' : 0
            }}>
              {time}
              {isMine && <SeenTicks read={msg.read} />}
            </div>
          )}
          {msg.messageType === 'voice' && (
            <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '4px', textAlign: 'right', color: isMine ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              {time}
              {isMine && <SeenTicks read={msg.read} />}
            </div>
          )}
        </div>
        <BubbleTail isMine={isMine} />
      </div>
    </div>
  )
}

function AttachMenu({ onClose, onPickImage, onPickFile }) {
  return (
    <div style={{ position: 'absolute', bottom: '56px', left: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '8px', boxShadow: 'var(--shadow-lg)', zIndex: 100 }}>
      <button onClick={() => { onPickImage(); onClose() }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: '13px', borderRadius: '10px' }}>🖼️ Photo</button>
      <button onClick={() => { onPickFile(); onClose() }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: '13px', borderRadius: '10px' }}>📄 File</button>
    </div>
  )
}

function Messages() {
  const { user, token, logout } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeChat, setActiveChat] = useState(null)
  const [thread, setThread] = useState([])
  const [sessions, setSessions] = useState([])
  const [ratedSessionIds, setRatedSessionIds] = useState({})
  const [ratingSessionId, setRatingSessionId] = useState(null)
  const [editingSession, setEditingSession] = useState(null)
  const [cancelSessionId, setCancelSessionId] = useState(null)
  const [newMsg, setNewMsg] = useState('')
  const [showSchedule, setShowSchedule] = useState(false)
  const [helperPickSessionId, setHelperPickSessionId] = useState(null)
  const [deleteMsgId, setDeleteMsgId] = useState(null)
  const [showDeleteChat, setShowDeleteChat] = useState(false)
  const [showAttach, setShowAttach] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [pendingAttachment, setPendingAttachment] = useState(null)
  const [pendingVoice, setPendingVoice] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [showBulkDelete, setShowBulkDelete] = useState(false)

  const imageInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordIntervalRef = useRef(null)

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'MH'
  const otherInitials = activeChat?.name ? activeChat.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/messages/conversations`, { headers: { Authorization: `Bearer ${token}` } })
      setConversations(res.data.conversations || [])
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 8000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkRatedSessions = async (sessionList) => {
    const completed = sessionList.filter(s => s.status === 'completed')
    if (completed.length === 0) return
    try {
      const results = await Promise.all(
        completed.map(s =>
          axios.get(`${API}/reviews/session/${s._id}/mine`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => ({ id: s._id, reviewed: res.data.reviewed }))
            .catch(() => ({ id: s._id, reviewed: false }))
        )
      )
      const map = {}
      results.forEach(r => { map[r.id] = r.reviewed })
      setRatedSessionIds(prev => ({ ...prev, ...map }))
    } catch (err) {
      console.error('Failed to check rated sessions:', err)
    }
  }

  const openChat = async (convo) => {
    setActiveChat(convo)
    setSelectMode(false)
    setSelectedIds([])
    try {
      const [msgRes, sessRes] = await Promise.all([
        axios.get(`${API}/messages/${convo.otherUserId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/sessions/${convo.otherUserId}`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      setThread(msgRes.data.messages || [])
      const fetchedSessions = sessRes.data.sessions || []
      setSessions(fetchedSessions)
      checkRatedSessions(fetchedSessions)
    } catch (err) {
      console.error('Failed to fetch thread:', err)
    }
  }

  const sendMessage = async (payload) => {
    if (!activeChat) return
    try {
      await axios.post(`${API}/messages`, { receiverId: activeChat.otherUserId, ...payload }, { headers: { Authorization: `Bearer ${token}` } })
      openChat(activeChat)
      fetchConversations()
    } catch (err) {
      console.error('Failed to send message:', err)
      alert(err.response?.data?.message || 'Failed to send. File may be too large.')
    }
  }

  const handleSendText = () => {
    if (!newMsg.trim()) return
    sendMessage({ text: newMsg, messageType: 'text' })
    setNewMsg('')
  }

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handlePickImage = () => imageInputRef.current?.click()
  const handlePickFile = () => fileInputRef.current?.click()

  // Selecting a photo/file no longer sends immediately — it shows a
  // preview with explicit Send/Cancel, same as WhatsApp.
  const handleImageSelected = (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_FILE_SIZE) { alert('Image too large. Max 2MB allowed.'); return }
    const reader = new FileReader()
    reader.onloadend = () => {
      setPendingAttachment({ messageType: 'image', fileData: reader.result, fileName: file.name })
    }
    reader.readAsDataURL(file)
  }

  const handleFileSelected = (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_FILE_SIZE) { alert('File too large. Max 2MB allowed.'); return }
    const reader = new FileReader()
    reader.onloadend = () => {
      setPendingAttachment({ messageType: 'file', fileData: reader.result, fileName: file.name })
    }
    reader.readAsDataURL(file)
  }

  const sendPendingAttachment = async () => {
    if (!pendingAttachment) return
    setUploading(true)
    await sendMessage(pendingAttachment)
    setUploading(false)
    setPendingAttachment(null)
  }

  // Tap to start recording, tap again to stop — then preview the
  // recording with Play/Discard/Send, matching a standard voice-note flow.
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []
      recorder.ondataavailable = (ev) => audioChunksRef.current.push(ev.data)
      recorder.onstop = () => {
        clearInterval(recordIntervalRef.current)
        stream.getTracks().forEach(t => t.stop())
        setRecordSeconds(0)
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (blob.size > MAX_FILE_SIZE) { alert('Voice note too long. Keep under 2MB (~1 min).'); return }
        const url = URL.createObjectURL(blob)
        setPendingVoice({ blob, url })
      }
      recorder.start()
      setIsRecording(true)
      setRecordSeconds(0)
      recordIntervalRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000)
    } catch (err) {
      alert('Microphone access denied or unavailable.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }

  const discardPendingVoice = () => {
    if (pendingVoice?.url) URL.revokeObjectURL(pendingVoice.url)
    setPendingVoice(null)
  }

  const sendPendingVoice = async () => {
    if (!pendingVoice) return
    setUploading(true)
    const reader = new FileReader()
    reader.onloadend = async () => {
      await sendMessage({ messageType: 'voice', fileData: reader.result, fileName: 'voice-note.webm' })
      setUploading(false)
      if (pendingVoice?.url) URL.revokeObjectURL(pendingVoice.url)
      setPendingVoice(null)
    }
    reader.readAsDataURL(pendingVoice.blob)
  }

  const scheduleSession = async ({ date, time, meetingLink }) => {
    try {
      await axios.post(`${API}/sessions`, { participantId: activeChat.otherUserId, date, time, meetingLink }, { headers: { Authorization: `Bearer ${token}` } })
      openChat(activeChat)
    } catch (err) {
      console.error('Failed to schedule session:', err)
    }
  }

  const confirmDeleteConversation = async () => {
    setShowDeleteChat(false)
    try {
      await axios.delete(`${API}/messages/${activeChat.otherUserId}`, { headers: { Authorization: `Bearer ${token}` } })
      setActiveChat(null)
      fetchConversations()
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }

  const confirmDeleteMessage = async () => {
    const messageId = deleteMsgId
    setDeleteMsgId(null)
    try {
      await axios.delete(`${API}/messages/single/${messageId}`, { headers: { Authorization: `Bearer ${token}` } })
      setThread(thread.filter(m => m._id !== messageId))
      fetchConversations()
    } catch (err) {
      console.error('Failed to delete message:', err)
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const enterSelectMode = (id) => {
    setSelectMode(true)
    setSelectedIds([id])
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds([])
  }

  const confirmBulkDelete = async () => {
    setShowBulkDelete(false)
    try {
      await Promise.all(selectedIds.map(id =>
        axios.delete(`${API}/messages/single/${id}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
      ))
      setThread(thread.filter(m => !selectedIds.includes(m._id)))
      exitSelectMode()
      fetchConversations()
    } catch (err) {
      console.error('Bulk delete failed:', err)
    }
  }

  const handleMarkCompleted = (sessionId) => setHelperPickSessionId(sessionId)

  const confirmHelper = async (choice) => {
    const sessionId = helperPickSessionId
    setHelperPickSessionId(null)
    const helperId = choice === 'me' ? user.id : activeChat.otherUserId
    try {
      const res = await axios.post(`${API}/sessions/${sessionId}/complete`, { helperId }, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.data.success) alert(res.data.message)
      openChat(activeChat)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark completed')
    }
  }

  const handleRate = (sessionId) => setRatingSessionId(sessionId)

  const handleEditSession = (session) => setEditingSession(session)

  const submitEditSession = async ({ date, time, meetingLink }) => {
    const sessionId = editingSession._id
    try {
      await axios.put(`${API}/sessions/${sessionId}`, { date, time, meetingLink }, { headers: { Authorization: `Bearer ${token}` } })
      setEditingSession(null)
      openChat(activeChat)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update session')
    }
  }

  const handleDeleteSession = (sessionId) => setCancelSessionId(sessionId)

  const confirmCancelSession = async () => {
    const sessionId = cancelSessionId
    setCancelSessionId(null)
    try {
      await axios.delete(`${API}/sessions/${sessionId}`, { headers: { Authorization: `Bearer ${token}` } })
      openChat(activeChat)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel session')
    }
  }

  const submitRating = async ({ rating, comment }) => {
    const sessionId = ratingSessionId
    try {
      await axios.post(`${API}/reviews`, { sessionId, rating, comment }, { headers: { Authorization: `Bearer ${token}` } })
      setRatedSessionIds(prev => ({ ...prev, [sessionId]: true }))
      setRatingSessionId(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit rating')
    }
  }

  const timeline = [
    ...thread.map(m => ({ ...m, _type: 'message' })),
    ...sessions.map(s => ({ ...s, _type: 'session', createdAt: s.createdAt }))
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const recordMinutes = Math.floor(recordSeconds / 60)
  const recordSecondsDisplay = (recordSeconds % 60).toString().padStart(2, '0')

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
          <a href="/dashboard" className="dash__nav-item">
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>
            </div>Dashboard
          </a>
          <a href="/wallet" className="dash__nav-item">
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>Time Wallet
          </a>
          <a href="/skills" className="dash__nav-item">
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>Find Skills
          </a>
          <div className="dash__nav-item active">
            <div className="dash__nav-item-icon" style={{ background: 'rgba(255,209,102,0.15)', color: '#ffd166' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            </div>Messages
          </div>
          <a href="/profile" className="dash__nav-item">
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>Profile
          </a>
          <div className="dash__nav-label">Account</div>
          <div className="dash__nav-item" onClick={logout}>
            <div className="dash__nav-item-icon" style={{ background: 'rgba(255,80,80,0.1)', color: '#ff8080' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>Logout
          </div>
        </nav>
        <div className="dash__sidebar-bottom">
          <div className="dash__sidebar-user">
            <div className="dash__sidebar-avatar">{initials}</div>
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
            <h1 className="dash__header-title">Messages</h1>
            <p className="dash__header-sub">Your skill exchange conversations</p>
          </div>
        </div>

        {!activeChat ? (
          <div className="msgs__list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.4 }}>💬</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>No conversations yet</div>
                <div style={{ fontSize: '13px' }}>Connect with someone from Find Skills to start chatting!</div>
              </div>
            ) : (
              conversations.map(convo => (
                <div key={convo.otherUserId} className="msgs__item" onClick={() => openChat(convo)}>
                  <div className="msgs__avatar" style={{ background: 'rgba(124,111,255,0.15)', color: '#7c6fff' }}>
                    {convo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="msgs__info">
                    <div className="msgs__top">
                      <span className="msgs__name">{convo.name}</span>
                      <span className="msgs__time">{new Date(convo.lastTime).toLocaleDateString()}</span>
                    </div>
                    <div className="msgs__preview">{convo.lastMessage}</div>
                  </div>
                  {convo.unread > 0 && <div className="msgs__unread">{convo.unread}</div>}
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '18px', display: 'flex', flexDirection: 'column', height: '65vh', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <div style={{
              padding: '14px 20px', background: selectMode ? 'rgba(124,111,255,0.1)' : 'linear-gradient(135deg, rgba(124,111,255,0.06), rgba(255,111,176,0.04))',
              borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'
            }}>
              {selectMode ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={exitSelectMode} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                    <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '14px' }}>{selectedIds.length} selected</span>
                  </div>
                  <button
                    onClick={() => selectedIds.length > 0 && setShowBulkDelete(true)}
                    disabled={selectedIds.length === 0}
                    style={{
                      background: '#ff5050', border: 'none', color: '#fff', borderRadius: '10px',
                      padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                      opacity: selectedIds.length === 0 ? 0.5 : 1, boxShadow: '0 2px 10px rgba(255,80,80,0.35)'
                    }}
                  >🗑 Delete ({selectedIds.length})</button>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => setActiveChat(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px' }}>←</button>
                    <div onClick={() => { window.location.href = '/profile/' + activeChat.otherUserId }} style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,111,255,0.35)'
                    }}>{otherInitials}</div>
                    <span onClick={() => { window.location.href = '/profile/' + activeChat.otherUserId }} style={{ fontWeight: 700, color: 'var(--text)', fontSize: '14.5px', letterSpacing: '-0.2px', cursor: 'pointer' }}>
                      {activeChat.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setShowSchedule(true)} style={{
                      background: 'linear-gradient(135deg, #7c6fff, #9d7cff)', border: 'none', color: '#fff',
                      borderRadius: '20px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                      whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px',
                      boxShadow: '0 3px 10px rgba(124,111,255,0.35)', letterSpacing: '0.1px'
                    }}>📅 Schedule</button>
                    <button onClick={() => setShowDeleteChat(true)} style={{
                      background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff5050',
                      borderRadius: '20px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                      whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px'
                    }}>🗑 Delete Chat</button>
                  </div>
                </>
              )}
            </div>

            <div style={{
              flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', boxSizing: 'border-box', width: '100%',
              background: `var(--bg2) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%237c6fff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}>
              {timeline.map((item, i) => {
                if (item._type === 'session') {
                  return (
                    <SessionCard
                      key={`s-${i}`}
                      session={item}
                      currentUserId={user?.id}
                      activeChat={activeChat}
                      onMarkCompleted={handleMarkCompleted}
                      onRate={handleRate}
                      alreadyRated={!!ratedSessionIds[item._id]}
                      onEdit={handleEditSession}
                      onDelete={handleDeleteSession}
                    />
                  )
                }
                const isMine = item.sender !== activeChat.otherUserId
                const time = new Date(item.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={item._id || `m-${i}`} onDoubleClick={() => !selectMode && enterSelectMode(item._id)}>
                    <ChatBubble
                      msg={item}
                      isMine={isMine}
                      senderInitials={otherInitials}
                      time={time}
                      onRequestDelete={setDeleteMsgId}
                      selectMode={selectMode}
                      selected={selectedIds.includes(item._id)}
                      onToggleSelect={toggleSelect}
                    />
                  </div>
                )
              })}
              {uploading && (
                <div style={{ alignSelf: 'flex-end', fontSize: '11px', color: 'var(--text-muted)' }}>Uploading...</div>
              )}
            </div>

            {!selectMode && (
              <>
                {pendingAttachment && (
                  <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', background: 'var(--card)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {pendingAttachment.messageType === 'image' ? (
                      <img src={pendingAttachment.fileData} alt="" style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>📄</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0, fontSize: '12.5px', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {pendingAttachment.fileName}
                    </div>
                    <button onClick={() => setPendingAttachment(null)} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', flexShrink: 0 }}>✕</button>
                    <button onClick={sendPendingAttachment} disabled={uploading} style={{
                      background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff', border: 'none',
                      borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', fontSize: '15px', flexShrink: 0,
                      boxShadow: '0 3px 10px rgba(124,111,255,0.35)'
                    }}>{uploading ? '…' : '➤'}</button>
                  </div>
                )}

                {pendingVoice && (
                  <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', background: 'var(--card)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <audio src={pendingVoice.url} controls style={{ flex: 1, height: '38px', minWidth: 0 }} />
                    <button onClick={discardPendingVoice} style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: '#ff5050', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', flexShrink: 0 }}>🗑</button>
                    <button onClick={sendPendingVoice} disabled={uploading} style={{
                      background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff', border: 'none',
                      borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer', fontSize: '15px', flexShrink: 0,
                      boxShadow: '0 3px 10px rgba(124,111,255,0.35)'
                    }}>{uploading ? '…' : '➤'}</button>
                  </div>
                )}

                {!pendingAttachment && !pendingVoice && (
                  <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', background: 'var(--card)', position: 'relative', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                    <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelected} />
                    <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelected} />

                    {!isRecording && (
                      <button onClick={() => setShowAttach(!showAttach)} style={{
                        background: 'linear-gradient(135deg, rgba(124,111,255,0.15), rgba(255,111,176,0.1))',
                        border: '1px solid var(--border)', color: 'var(--accent)',
                        borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '15px', flexShrink: 0
                      }}>📎</button>
                    )}

                    {showAttach && !isRecording && <AttachMenu onClose={() => setShowAttach(false)} onPickImage={handlePickImage} onPickFile={handlePickFile} />}

                    {isRecording ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, padding: '4px 8px', minWidth: 0, overflow: 'hidden' }}>
                        <div className="timebank-rec-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5050', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>
                          {recordMinutes}:{recordSecondsDisplay}
                        </span>
                        <span style={{ flex: 1, fontSize: '12.5px', color: 'var(--text-muted)' }}>Recording...</span>
                      </div>
                    ) : (
                      <input
                        value={newMsg}
                        onChange={e => setNewMsg(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendText()}
                        placeholder="Type a message..."
                        style={{ flex: 1, minWidth: 0, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: '20px', padding: '9px 14px', color: 'var(--text)', outline: 'none', fontSize: '13px' }}
                      />
                    )}

                    {newMsg.trim() && !isRecording ? (
                      <button onClick={handleSendText} style={{
                        background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff', border: 'none',
                        borderRadius: '20px', padding: '9px 18px', cursor: 'pointer', fontWeight: 700, fontSize: '12.5px',
                        boxShadow: '0 3px 10px rgba(124,111,255,0.35)', flexShrink: 0
                      }}>Send</button>
                    ) : (
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        style={{
                          background: isRecording ? '#ff5050' : 'linear-gradient(135deg, #7c6fff, #ff6fb0)',
                          color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px',
                          cursor: 'pointer', fontSize: '15px', flexShrink: 0, boxShadow: '0 3px 10px rgba(124,111,255,0.35)',
                          transform: isRecording ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.15s'
                        }}
                        title={isRecording ? 'Tap to stop' : 'Tap to record voice note'}
                      >{isRecording ? '■' : '🎤'}</button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {showSchedule && <ScheduleModal onClose={() => setShowSchedule(false)} onSchedule={scheduleSession} />}
      {helperPickSessionId && <HelperPickModal activeChat={activeChat} onClose={() => setHelperPickSessionId(null)} onPick={confirmHelper} />}
      {ratingSessionId && <RatingModal activeChat={activeChat} onClose={() => setRatingSessionId(null)} onSubmit={submitRating} />}
      {editingSession && <EditSessionModal session={editingSession} onClose={() => setEditingSession(null)} onSave={submitEditSession} />}
      {cancelSessionId && (
        <ConfirmModal title="Cancel this session?" message="This will cancel the scheduled session and notify the other person. This action cannot be undone." danger onCancel={() => setCancelSessionId(null)} onConfirm={confirmCancelSession} />
      )}
      {deleteMsgId && (
        <ConfirmModal title="Delete message?" message="This message will be deleted for you. This action cannot be undone." danger onCancel={() => setDeleteMsgId(null)} onConfirm={confirmDeleteMessage} />
      )}
      {showDeleteChat && (
        <ConfirmModal title="Delete this chat?" message={`Your entire conversation with ${activeChat?.name} will be permanently deleted.`} danger onCancel={() => setShowDeleteChat(false)} onConfirm={confirmDeleteConversation} />
      )}
      {showBulkDelete && (
        <ConfirmModal title={`Delete ${selectedIds.length} message(s)?`} message="Selected messages will be permanently deleted." danger onCancel={() => setShowBulkDelete(false)} onConfirm={confirmBulkDelete} />
      )}
      <MobileNav />
    </div>
  )
}

export default Messages