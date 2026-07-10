import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import '../styles/dashboard.css'
import '../styles/messages.css'

const API = 'https://timebank-app.onrender.com/api'

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
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '380px'
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
          Schedule a Session
        </h2>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Time</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            style={{
              width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
            Meeting Link (optional — Zoom, Google Meet, etc.)
          </label>
          <input
            type="text"
            placeholder="https://meet.google.com/..."
            value={link}
            onChange={e => setLink(e.target.value)}
            style={{
              width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '14px'
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
          <button onClick={handleSubmit} disabled={loading || !date || !time} style={{
            flex: 1, padding: '11px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff', fontWeight: 600,
            cursor: 'pointer', opacity: (!date || !time) ? 0.5 : 1
          }}>
            {loading ? 'Scheduling...' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SessionCard({ session, currentUserId }) {
  const isOrganizer = session.organizer === currentUserId
  return (
    <div style={{
      alignSelf: 'center', background: 'var(--input-bg)', border: '1px solid var(--accent)',
      borderRadius: '14px', padding: '14px 18px', maxWidth: '85%', textAlign: 'center'
    }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px' }}>
        📅 Session Scheduled
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>
        {new Date(session.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at {session.time}
      </div>
      {session.meetingLink && (
        <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" style={{
          display: 'inline-block', marginTop: '8px', fontSize: '12px', color: 'var(--accent)', fontWeight: 600
        }}>
          Join Meeting →
        </a>
      )}
      {!isOrganizer && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Proposed by the other person</div>}
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
  const [newMsg, setNewMsg] = useState('')
  const [showSchedule, setShowSchedule] = useState(false)

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'MH'

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setConversations(res.data.conversations || [])
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openChat = async (convo) => {
    setActiveChat(convo)
    try {
      const [msgRes, sessRes] = await Promise.all([
        axios.get(`${API}/messages/${convo.otherUserId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/sessions/${convo.otherUserId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      setThread(msgRes.data.messages || [])
      setSessions(sessRes.data.sessions || [])
    } catch (err) {
      console.error('Failed to fetch thread:', err)
    }
  }

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeChat) return
    try {
      await axios.post(`${API}/messages`, {
        receiverId: activeChat.otherUserId,
        text: newMsg
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNewMsg('')
      openChat(activeChat)
      fetchConversations()
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const scheduleSession = async ({ date, time, meetingLink }) => {
    try {
      await axios.post(`${API}/sessions`, {
        participantId: activeChat.otherUserId,
        date, time, meetingLink
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      openChat(activeChat)
    } catch (err) {
      console.error('Failed to schedule session:', err)
    }
  }

  const deleteConversation = async () => {
    if (!window.confirm('Delete this entire conversation?')) return
    try {
      await axios.delete(`${API}/messages/${activeChat.otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setActiveChat(null)
      fetchConversations()
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }

  const timeline = [
    ...thread.map(m => ({ ...m, _type: 'message' })),
    ...sessions.map(s => ({ ...s, _type: 'session', createdAt: s.createdAt }))
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

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
            </div>
            Dashboard
          </a>
          <a href="/wallet" className="dash__nav-item">
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            Time Wallet
          </a>
          <a href="/skills" className="dash__nav-item">
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            Find Skills
          </a>
          <div className="dash__nav-item active">
            <div className="dash__nav-item-icon" style={{ background: 'rgba(255,209,102,0.15)', color: '#ffd166' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            </div>
            Messages
          </div>
          <a href="/profile" className="dash__nav-item">
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            Profile
          </a>
          <div className="dash__nav-label">Account</div>
          <div className="dash__nav-item" onClick={logout}>
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
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.4 }}>💬</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  No conversations yet
                </div>
                <div style={{ fontSize: '13px' }}>
                  Connect with someone from Find Skills to start chatting!
                </div>
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
                  {convo.unread > 0 && (
                    <div className="msgs__unread">{convo.unread}</div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '65vh' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setActiveChat(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px' }}>←</button>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{activeChat.name}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowSchedule(true)} style={{
                  background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--accent)',
                  borderRadius: '10px', padding: '7px 14px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer'
                }}>
                  📅 Schedule
                </button>
                <button onClick={deleteConversation} style={{
                  background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff5050',
                  borderRadius: '10px', padding: '7px 14px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer'
                }}>
                  🗑️ Delete
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {timeline.map((item, i) => {
                if (item._type === 'session') {
                  return <SessionCard key={`s-${i}`} session={item} currentUserId={user?.id} />
                }
                const isMine = item.sender !== activeChat.otherUserId
                return (
                  <div key={`m-${i}`} style={{
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                    background: isMine ? 'var(--accent)' : 'var(--input-bg)',
                    color: isMine ? '#fff' : 'var(--text)',
                    padding: '10px 14px',
                    borderRadius: '14px',
                    maxWidth: '70%',
                    fontSize: '13.5px'
                  }}>
                    {item.text}
                  </div>
                )
              })}
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
              <input
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                style={{
                  flex: 1, background: 'var(--input-bg)', border: '1px solid var(--border)',
                  borderRadius: '20px', padding: '10px 16px', color: 'var(--text)', outline: 'none', fontSize: '13.5px'
                }}
              />
              <button onClick={sendMessage} style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: '20px', padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '13px'
              }}>
                Send
              </button>
            </div>
          </div>
        )}
      </main>

      {showSchedule && (
        <ScheduleModal onClose={() => setShowSchedule(false)} onSchedule={scheduleSession} />
      )}
    </div>
  )
}

export default Messages