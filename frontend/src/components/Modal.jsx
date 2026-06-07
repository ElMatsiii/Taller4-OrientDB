export default function Modal({ title, children, onClose }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(4, 6, 16, 0.85)',
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        borderRadius: 24,
        background: 'rgba(12, 15, 34, 0.98)',
        border: '1px solid rgba(108, 71, 255, 0.35)',
        boxShadow: '0 0 80px rgba(92, 53, 255, 0.22)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 22px',
          borderBottom: '1px solid rgba(108, 71, 255, 0.18)',
          background: 'rgba(14, 18, 44, 0.96)',
        }}>
          <h3 style={{ margin: 0, fontSize: 20, color: '#eef2ff' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#9da4d3',
              fontSize: 20,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '22px 24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
