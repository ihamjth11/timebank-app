import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import MobileNav from '../components/MobileNav'
import '../styles/dashboard.css'

const API = 'https://timebank-app.onrender.com/api'

const REASON_LABELS = {
  spam: 'Spam',
  harassment: 'Harassment',
  inappropriate_content: 'Inappropriate Content',
  no_show: 'No-show / Broken commitment',
  fraud: 'Fraud',
  other: 'Other'
}

const STATUS_STYLE = {
  pending: { bg: 'rgba(255,209,102,0.12)', color: '#ffb800' },
  reviewed: { bg: 'rgba(0,184,148,0.1)', color: '#00b894' },
  dismissed: { bg: 'var(--input-bg)', color: 'var(--text-muted)' }
}

function AdminModeration() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [denied, setDenied] = useState(false)

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const res = await axios.get(`${API}/moderation/reports`, { params, headers: { Authorization: `Bearer ${token}` } })
      setReports(res.data.reports || [])
      setDenied(false)
    } catch (err) {
      if (err.response?.status === 403) setDenied(true)
      console.error('Failed to fetch reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (token) fetchReports() }, [token, filter])

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API}/moderation/reports/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } })
      fetchReports()
    } catch (err) {
      console.error('Failed to update report:', err)
    }
  }

  if (denied) {
    return (
      <div className="dash">
        <main className="dash__main" style={{ marginLeft: 0, maxWidth: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Admin access required</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>This page is only available to TimeBank moderators.</p>
            <button onClick={() => navigate('/dashboard')} style={{ background: 'linear-gradient(135deg, #7c6fff, #ff6fb0)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>Back to Dashboard</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="dash">
      <main className="dash__main" style={{ marginLeft: 0, maxWidth: '100vw', padding: '28px 32px 90px' }}>
        <div className="dash__header">
          <div>
            <h1 className="dash__header-title">Moderation</h1>
            <p className="dash__header-sub">Review reports filed by the community</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {['pending', 'reviewed', 'dismissed', 'all'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '8px 16px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
              border: filter === s ? 'none' : '1px solid var(--border2)',
              background: filter === s ? 'linear-gradient(135deg, #7c6fff, #ff6fb0)' : 'var(--card)',
              color: filter === s ? '#fff' : 'var(--text-secondary)', textTransform: 'capitalize'
            }}>{s}</button>
          ))}
        </div>

        <div className="dash__txns">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</div>
          ) : reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>No {filter !== 'all' ? filter : ''} reports</div>
          ) : (
            reports.map(r => (
              <div key={r._id} style={{ padding: '16px 12px', borderBottom: '1px solid var(--border2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>
                      {r.reporter?.name || 'Unknown'} reported {r.reportedUser?.name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {r.reporter?.email} → {r.reportedUser?.email} · {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
                    background: STATUS_STYLE[r.status]?.bg, color: STATUS_STYLE[r.status]?.color, textTransform: 'capitalize'
                  }}>{r.status}</span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#7c6fff', fontWeight: 600, marginBottom: '4px' }}>{REASON_LABELS[r.reason] || r.reason}</div>
                {r.details && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.5' }}>{r.details}</p>}
                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => updateStatus(r._id, 'reviewed')} style={{ background: 'rgba(0,184,148,0.1)', color: '#00b894', border: '1px solid rgba(0,184,148,0.25)', borderRadius: '8px', padding: '6px 14px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>Mark Reviewed</button>
                    <button onClick={() => updateStatus(r._id, 'dismissed')} style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 14px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>Dismiss</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}

export default AdminModeration