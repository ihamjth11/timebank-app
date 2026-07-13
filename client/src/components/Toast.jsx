import { useEffect } from 'react'

function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500)
    return () => clearTimeout(timer)
  }, [onClose])

  const colors = {
    info: { bg: 'var(--card)', border: 'var(--accent)', icon: 'ℹ️' },
    success: { bg: 'var(--card)', border: '#00b894', icon: '✅' },
    error: { bg: 'var(--card)', border: '#ff5050', icon: '⚠️' }
  }
  const c = colors[type] || colors.info

  return (
    <div style={{
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 3000, background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: '14px', padding: '14px 20px', boxShadow: 'var(--shadow-lg)',
      display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '90vw',
      animation: 'toastUp 0.3s ease'
    }}>
      <style>{`
        @keyframes toastUp {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
      <span style={{ fontSize: '16px' }}>{c.icon}</span>
      <span style={{ fontSize: '13.5px', color: 'var(--text)', fontWeight: 500 }}>{message}</span>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', color: 'var(--text-muted)',
        cursor: 'pointer', fontSize: '14px', marginLeft: '6px'
      }}>✕</button>
    </div>
  )
}

export default Toast