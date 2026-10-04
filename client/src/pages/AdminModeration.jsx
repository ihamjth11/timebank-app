import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import MobileNav from '../components/MobileNav'
import Toast from '../components/Toast'
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
  dismissed: { bg: 'var(--input-bg)', color: 'var(--text-muted)' },
  open: { bg: 'rgba(255,209,102,0.12)', color: '#ffb800' },
  resolved: { bg: 'rgba(0,184,148,0.1)', color: '#00b894' }
}

function formatDateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function ResolveModal({ dispute, decision, onClose, onConfirm }) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const releasing = decision === 'release'
  const valid = note.trim().length >= 5
  const amount = dispute.amount || 1

  const handleConfirm = async () => {
    if (!valid || loading) return
    setLoading(true)
    await onConfirm(note.trim())
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '26px', width: '100%', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
          {releasing
            ? `Release ${amount} credit${amount > 1 ? 's' : ''} to ${dispute.helper?.name || 'the helper'}`
            : `Refund ${amount} credit${amount > 1 ? 's' : ''} to ${dispute.payer?.name || 'the payer'}`}
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
          This moves credits and cannot be undone. Your decision and note are saved with your admin account.
        </p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Why did you decide this? (5 to 1000 characters)"
          rows={4}
          maxLength={1000}
          style={{
            width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: '13px',
            resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
          }}
        />
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleConfirm} disabled={!valid || loading} style={{
            flex: 1, padding: '11px', borderRadius: '10px', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer',
            background: releasing ? '#00b894' : '#ff5050', opacity: valid ? 1 : 0.5
          }}>{loading ? 'Saving...' : (releasing ? 'Release' : 'Refund')}</button>
        </div>
      </div>
    </div>
  )
}

function AdminModeration() {
  const { token, initializing } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('reports') // reports | disputes
  const [reports, setReports] = useState([])
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [disputeFilter, setDisputeFilter] = useState('open')
  const [denied, setDenied] = useState(false)
  const [resolveTarget, setResolveTarget] = useState(null) // { dispute, decision }
  const [toast, setToast] = useState(null)

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

  const fetchDisputes = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/disputes`, { params: { status: disputeFilter }, headers: { Authorization: `Bearer ${token}` } })
      setDisputes(res.data.disputes || [])
      setDenied(false)
    } catch (err) {
      if (err.response?.status === 403) setDenied(true)
      console.error('Failed to fetch disputes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Wait for AuthContext to finish restoring the session before deciding
    // anything. Once it's done: with a token, fetch as normal;
    // without one, stop showing "Loading..." forever and send the person
    // to log in instead.
    if (initializing) return
    if (!token) {
      navigate('/login')
      return
    }
    if (tab === 'reports') fetchReports()
    else fetchDisputes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filter, disputeFilter, tab, initializing])

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API}/moderation/reports/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } })
      fetchReports()
    } catch (err) {
      console.error('Failed to update report:', err)
    }
  }

  const suspendUser = async (userId, userName) => {
    if (!window.confirm(`Suspend ${userName}'s account? They will be unable to log in.`)) return
    try {
      await axios.put(`${API}/moderation/users/${userId}/suspend`, {}, { headers: { Authorization: `Bearer ${token}` } })
      fetchReports()
    } catch (err) {
      console.error('Failed to suspend user:', err)
    }
  }

  const resolveDispute = async (note) => {
    const { dispute, decision } = resolveTarget
    try {
      await axios.put(
        `${API}/disputes/${dispute._id}/resolve`,
        { decision, note },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setResolveTarget(null)
      setToast({ message: decision === 'release' ? 'Credit released to the helper.' : 'Credit refunded to the payer.', type: 'success' })
      fetchDisputes()
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to resolve dispute', type: 'error' })
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

  const filterButtons = tab === 'reports'
    ? ['pending', 'reviewed', 'dismissed', 'all']
    : ['open', 'resolved']
  const activeFilter = tab === 'reports' ? filter : disputeFilter
  const setActiveFilter = tab === 'reports' ? setFilter : setDisputeFilter

  return (
    <div className="dash">
      <main className="dash__main" style={{ marginLeft: 0, maxWidth: '100vw', padding: '28px 32px 90px' }}>
        <div className="dash__header">
          <div>
            <h1 className="dash__header-title">Moderation</h1>
            <p className="dash__header-sub">
              {tab === 'reports' ? 'Review reports filed by the community' : 'Decide who gets the credit when a session goes wrong'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {[{ id: 'reports', label: 'Reports' }, { id: 'disputes', label: 'Session disputes' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '9px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              border: tab === t.id ? 'none' : '1px solid var(--border2)',
              background: tab === t.id ? 'var(--text)' : 'var(--card)',
              color: tab === t.id ? 'var(--card)' : 'var(--text-secondary)'
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {filterButtons.map(s => (
            <button key={s} onClick={() => setActiveFilter(s)} style={{
              padding: '8px 16px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
              border: activeFilter === s ? 'none' : '1px solid var(--border2)',
              background: activeFilter === s ? 'linear-gradient(135deg, #7c6fff, #ff6fb0)' : 'var(--card)',
              color: activeFilter === s ? '#fff' : 'var(--text-secondary)', textTransform: 'capitalize'
            }}>{s}</button>
          ))}
        </div>

        <div className="dash__txns">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</div>
          ) : tab === 'reports' ? (
            reports.length === 0 ? (
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
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={() => updateStatus(r._id, 'reviewed')} style={{ background: 'rgba(0,184,148,0.1)', color: '#00b894', border: '1px solid rgba(0,184,148,0.25)', borderRadius: '8px', padding: '6px 14px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>Mark Reviewed</button>
                      <button onClick={() => updateStatus(r._id, 'dismissed')} style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 14px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>Dismiss</button>
                      <button onClick={() => suspendUser(r.reportedUser?._id, r.reportedUser?.name)} style={{ background: 'rgba(255,80,80,0.08)', color: '#ff5050', border: '1px solid rgba(255,80,80,0.25)', borderRadius: '8px', padding: '6px 14px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>🚫 Suspend Account</button>
                    </div>
                  )}
                </div>
              ))
            )
          ) : disputes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>No {disputeFilter} session disputes</div>
          ) : (
            disputes.map(d => {
              const amount = d.amount || 1
              const confirmations = d.session?.completionConfirmedBy?.length || 0
              return (
                <div key={d._id} style={{ padding: '16px 12px', borderBottom: '1px solid var(--border2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>
                        {d.payer?.name || 'Unknown'} paid {d.helper?.name || 'Unknown'} · {amount} credit{amount > 1 ? 's' : ''}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {d.payer?.email} → {d.helper?.email}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Session: {d.session?.date} at {d.session?.time} · Confirmed by {confirmations} of 2
                        {d.session?.firstConfirmedAt ? ` · First confirmation ${formatDateTime(d.session.firstConfirmedAt)}` : ''}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Opened by {d.openedBy?.name || 'Unknown'} · {formatDateTime(d.createdAt)}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
                      background: STATUS_STYLE[d.status]?.bg, color: STATUS_STYLE[d.status]?.color, textTransform: 'capitalize'
                    }}>{d.status}</span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#7c6fff', fontWeight: 700, marginBottom: '4px' }}>
                    {d.openedBy?.name || 'Reporter'} says:
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{d.reason}</p>

                  {d.response ? (
                    <>
                      <div style={{ fontSize: '12px', color: '#7c6fff', fontWeight: 700, marginBottom: '4px' }}>The other person says:</div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{d.response}</p>
                    </>
                  ) : (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>The other person has not responded yet.</p>
                  )}

                  {d.status === 'open' ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={() => setResolveTarget({ dispute: d, decision: 'release' })} style={{ background: 'rgba(0,184,148,0.1)', color: '#00b894', border: '1px solid rgba(0,184,148,0.25)', borderRadius: '8px', padding: '7px 14px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>
                        Release to {d.helper?.name || 'helper'}
                      </button>
                      <button onClick={() => setResolveTarget({ dispute: d, decision: 'refund' })} style={{ background: 'rgba(255,80,80,0.08)', color: '#ff5050', border: '1px solid rgba(255,80,80,0.25)', borderRadius: '8px', padding: '7px 14px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>
                        Refund {d.payer?.name || 'payer'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong style={{ color: d.decision === 'release' ? '#00b894' : '#ff5050' }}>
                        {d.decision === 'release' ? 'Released to helper' : 'Refunded to payer'}
                      </strong>
                      {' '}by {d.resolvedBy?.name || 'admin'} · {formatDateTime(d.resolvedAt)}
                      {d.resolutionNote && <div style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>Note: {d.resolutionNote}</div>}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </main>

      {resolveTarget && (
        <ResolveModal
          dispute={resolveTarget.dispute}
          decision={resolveTarget.decision}
          onClose={() => setResolveTarget(null)}
          onConfirm={resolveDispute}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <MobileNav />
    </div>
  )
}

export default AdminModeration