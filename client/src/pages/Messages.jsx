import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import '../styles/dashboard.css'
import '../styles/messages.css'

const API = 'https://timebank-app.onrender.com/api'

function Messages() {
  const { user, token, logout } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeChat, setActiveChat] = useState(null)
  const [thread, setThread] = useState([])
  const [newMsg, setNewMsg] = useState('')

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
      const res = await axios.get(`${API}/messages/${convo.otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setThread(res.data.messages || [])
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
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => setActiveChat(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px' }}>←</button>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{activeChat.name}</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {thread.map((msg, i) => {
                const isMine = msg.sender !== activeChat.otherUserId
                return (
                  <div key={i} style={{
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                    background: isMine ? 'var(--accent)' : 'var(--input-bg)',
                    color: isMine ? '#fff' : 'var(--text)',
                    padding: '10px 14px',
                    borderRadius: '14px',
                    maxWidth: '70%',
                    fontSize: '13.5px'
                  }}>
                    {msg.text}
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
    </div>
  )
}

export default Messages