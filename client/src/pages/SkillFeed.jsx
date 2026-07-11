import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import '../styles/skillfeed.css'
import '../styles/dashboard.css'

const API = 'https://timebank-app.onrender.com/api'

const CATEGORIES = ['All', 'Technology', 'Design', 'Education', 'Cooking', 'Music', 'Language', 'Business', 'Health', 'Other']

function SkillCard({ skill, onConnect, onDelete, currentUserId }) {
  const initials = skill.userName ? skill.userName.split(' ').map(n => n[0]).join('').toUpperCase() : '?'
  const isOwner = skill.user === currentUserId

  return (
    <div className={`skill-card ${skill.type}`}>
      <div className="skill-card__top">
        <span className={`skill-card__type ${skill.type}`}>
          {skill.type === 'offer' ? 'Offering' : 'Requesting'}
        </span>
        <div className="skill-card__credits">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {skill.credits}h
        </div>
      </div>
      <h3 className="skill-card__title">{skill.title}</h3>
      <p className="skill-card__desc">{skill.description}</p>
      <div className="skill-card__tags">
        {skill.tags?.map((tag, i) => (
          <span key={i} className="skill-card__tag">{tag}</span>
        ))}
      </div>
      <div className="skill-card__bottom">
        <div className="skill-card__user">
          <div className="skill-card__avatar">{initials}</div>
          <span className="skill-card__username">{skill.userName}</span>
        </div>
        {isOwner ? (
          <button
            className="skill-card__connect"
            style={{ background: 'rgba(255,80,80,0.1)', color: '#ff5050', border: '1px solid rgba(255,80,80,0.2)' }}
            onClick={() => onDelete(skill._id)}
          >
            Delete
          </button>
        ) : (
          <button className={`skill-card__connect ${skill.type}`} onClick={() => onConnect(skill)}>
            {skill.type === 'offer' ? 'Connect' : 'Help'}
          </button>
        )}
      </div>
    </div>
  )
}

function PostModal({ onClose, onPost }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'Technology',
    type: 'offer', credits: 1, location: 'Online', tags: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.title || !form.description) return
    setLoading(true)
    setError('')
    const newSkill = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      credits: Number(form.credits)
    }
    const result = await onPost(newSkill)
    setLoading(false)
    if (result.success) {
      onClose()
    } else {
      setError(result.message || 'Failed to post skill')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        <h2 className="modal__title">Post a Skill</h2>
        {error && (
          <div style={{
            background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)',
            color: '#ff5050', padding: '10px 14px', borderRadius: '10px',
            fontSize: '13px', marginBottom: '14px'
          }}>
            {error}
          </div>
        )}
        <div className="modal__form">
          <div className="modal__field">
            <label className="modal__label">Type</label>
            <div className="modal__type-row">
              <button className={`modal__type-btn ${form.type === 'offer' ? 'active-offer' : ''}`} onClick={() => setForm({ ...form, type: 'offer' })}>Offering</button>
              <button className={`modal__type-btn ${form.type === 'request' ? 'active-request' : ''}`} onClick={() => setForm({ ...form, type: 'request' })}>Requesting</button>
            </div>
          </div>
          <div className="modal__field">
            <label className="modal__label">Title</label>
            <input className="modal__input" name="title" placeholder="e.g. React Tutoring..." value={form.title} onChange={handleChange}/>
          </div>
          <div className="modal__field">
            <label className="modal__label">Description</label>
            <textarea className="modal__textarea" name="description" placeholder="Describe what you offer or need..." value={form.description} onChange={handleChange}/>
          </div>
          <div className="modal__field">
            <label className="modal__label">Category</label>
            <select className="modal__select" name="category" value={form.category} onChange={handleChange}>
              {CATEGORIES.filter(c => c !== 'All').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="modal__field">
            <label className="modal__label">Tags (comma separated)</label>
            <input className="modal__input" name="tags" placeholder="React, JavaScript..." value={form.tags} onChange={handleChange}/>
          </div>
          <div className="modal__field">
            <label className="modal__label">Location</label>
            <input className="modal__input" name="location" placeholder="Online / Colombo..." value={form.location} onChange={handleChange}/>
          </div>
          <button className="modal__submit" onClick={handleSubmit} disabled={loading || !form.title || !form.description}>
            {loading ? 'Posting...' : 'Post Skill →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SkillFeed() {
  const { user, token } = useAuth()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)

  const fetchSkills = async () => {
    setLoading(true)
    try {
      const params = {}
      if (category !== 'All') params.category = category
      if (typeFilter !== 'all') params.type = typeFilter
      if (search) params.search = search

      const res = await axios.get(`${API}/skills`, { params })
      setSkills(res.data.skills || [])
    } catch (err) {
      console.error('Failed to fetch skills:', err)
      setSkills([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSkills()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, typeFilter])

  useEffect(() => {
    const delay = setTimeout(() => fetchSkills(), 400)
    return () => clearTimeout(delay)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handlePost = async (newSkill) => {
    try {
      const res = await axios.post(`${API}/skills`, newSkill, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSkills([res.data.skill, ...skills])
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to post skill'
      return { success: false, message: msg }
    }
  }

  const handleConnect = async (skill) => {
  try {
    // First check if a conversation already exists with this user
    const convoRes = await axios.get(`${API}/messages/conversations`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const existing = (convoRes.data.conversations || []).find(
      c => c.otherUserId === skill.user
    )

    if (existing) {
      // Already connected — don't send a duplicate message
      alert(`You're already connected with ${skill.userName}. Check your Messages to chat!`)
      return
    }

    // No conversation yet — send the first message
    await axios.post(`${API}/messages`, {
      receiverId: skill.user,
      text: `Hi! I'm interested in your skill: "${skill.title}"`
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    alert(`Message sent to ${skill.userName}! Check your Messages page.`)
  } catch (err) {
    alert('Failed to send message. Please try again.')
  }
}

  const handleDelete = async (skillId) => {
    if (!window.confirm('Delete this skill?')) return
    try {
      await axios.delete(`${API}/skills/${skillId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSkills(skills.filter(s => s._id !== skillId))
    } catch (err) {
      alert('Failed to delete skill')
    }
  }

  return (
    <div className="feed">
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

          <a href="/skills" className="dash__nav-item active">
            <div className="dash__nav-item-icon" style={{ background: 'rgba(255,111,176,0.15)', color: '#ff6fb0' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            Find Skills
          </a>

          <a href="/messages" className="dash__nav-item">
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            </div>
            Messages
          </a>

          <a href="/profile" className="dash__nav-item">
            <div className="dash__nav-item-icon" style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            Profile
          </a>
        </nav>

        <div className="dash__sidebar-bottom">
          <div className="dash__sidebar-user">
            <div className="dash__sidebar-avatar">
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'MH'}
            </div>
            <div>
              <div className="dash__sidebar-user-name">{user?.name || 'Mohamed Hamjath'}</div>
              <div className="dash__sidebar-user-credits">{user?.timeCredits ?? 5} Time Credits</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="feed__main">
        <div className="feed__header">
          <div>
            <h1 className="feed__title">Skill Feed</h1>
            <p className="feed__sub">Discover skills to exchange in your community</p>
          </div>
          <button className="feed__post-btn" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Post Skill
          </button>
        </div>

        <div className="feed__controls">
          <div className="feed__search">
            <svg className="feed__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input className="feed__search-input" placeholder="Search skills..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
        </div>

        <div className="feed__filters" style={{ marginBottom: '14px' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} className={`feed__filter ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>

        <div className="feed__type-tabs">
          <button className={`feed__type-tab ${typeFilter === 'all' ? 'active-offer' : ''}`} onClick={() => setTypeFilter('all')}>All Skills</button>
          <button className={`feed__type-tab ${typeFilter === 'offer' ? 'active-offer' : ''}`} onClick={() => setTypeFilter('offer')}>Offerings</button>
          <button className={`feed__type-tab ${typeFilter === 'request' ? 'active-request' : ''}`} onClick={() => setTypeFilter('request')}>Requests</button>
        </div>

        <div className="feed__grid">
          {loading ? (
            <div className="feed__loading">
              <div className="feed__spinner" />
            </div>
          ) : skills.length === 0 ? (
            <div className="feed__empty">
              <div className="feed__empty-icon">🔍</div>
              <div className="feed__empty-title">No skills posted yet</div>
              <div className="feed__empty-sub">Be the first to post a skill in your community!</div>
            </div>
          ) : (
            skills.map(skill => (
              <SkillCard key={skill._id} skill={skill} onConnect={handleConnect} onDelete={handleDelete} currentUserId={user?.id}/>
            ))
          )}
        </div>
      </main>

      {showModal && (
        <PostModal onClose={() => setShowModal(false)} onPost={handlePost}/>
      )}
    </div>
  )
}

export default SkillFeed