export default function ConversationList({ conversations, selectedConversationId, onSelect, onCreate, onDelete }) {
  return (
    <div style={{
      width: 290,
      minWidth: 270,
      borderRadius: 12,
      border: '1px solid var(--border)',
      background: 'var(--panel)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'fadeInUp 0.4s ease-out',
    }}>
      <div style={{
        padding: '18px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <strong style={{ fontSize: 15, color: 'var(--text)' }}>Conversaciones</strong>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Crea o selecciona un chat</p>
        </div>
        <button
          onClick={onCreate}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
        >
          +
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>
            No hay conversaciones todavía.
          </div>
        ) : (
          conversations.map((conversation) => {
            const isActive = conversation.id === selectedConversationId;
            return (
              <div
                key={conversation.id}
                onClick={() => onSelect(conversation.id, conversation.title)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  cursor: 'pointer',
                  background: isActive ? 'var(--surface)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{conversation.title}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(conversation.updatedAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(conversation.id, conversation.title);
                  }}
                  style={{
                    border: '1px solid var(--border)',
                    background: 'var(--panel)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 16,
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}