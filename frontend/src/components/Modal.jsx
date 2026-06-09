export default function Modal({ title, children, onClose }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        borderRadius: 12,
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <h3 style={{ margin: 0, fontSize: 17, color: 'var(--text)' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: 18,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '20px 22px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}