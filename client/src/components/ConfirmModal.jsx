function ConfirmModal({ title, message, onConfirm, onCancel, danger }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px'
    }} onClick={onCancel}>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: '18px', padding: '24px', width: '100%', maxWidth: '320px',
        boxShadow: 'var(--shadow-lg)'
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
          {title}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '13px'
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
            background: danger ? '#ff5050' : 'linear-gradient(135deg, #7c6fff, #ff6fb0)',
            color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px'
          }}>
            {danger ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal