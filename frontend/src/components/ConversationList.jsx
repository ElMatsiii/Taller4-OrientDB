export default function ConversationList({ conversations, selectedConversationId, onSelect, onCreate, onDelete }) {
  return (
    <div style={{
      width: 320,
      minWidth: 300,
      borderRadius: 24,
      border: '1px solid rgba(95, 32, 255, 0.35)',
      background: 'rgba(10, 12, 32, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: '0 0 36px rgba(89, 35, 255, 0.18)',
      animation: 'fadeInUp 0.8s ease-out',
    }}>
      <div style={{
        padding: '22px 20px',
        borderBottom: '1px solid rgba(95, 32, 255, 0.16)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(20, 24, 70, 0.98), rgba(10, 12, 32, 0.95))',
      }}>
        <div>
          <strong style={{ fontSize: 16, color: '#f3f6ff' }}>Conversaciones</strong>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#aeb3cc' }}>Crea o selecciona un chat</p>
        </div>
        <button
          onClick={onCreate}
          style={{
            padding: '10px 14px',
            borderRadius: 14,
            border: '1px solid rgba(168, 71, 255, 0.65)',
            background: 'rgba(99, 34, 255, 0.18)',
            color: '#f7f8ff',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <div style={{ padding: 24, color: '#9aa0c6', fontSize: 14, textAlign: 'center' }}>
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
                  padding: '16px 18px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(95, 34, 255, 0.18)' : 'transparent',
                  borderBottom: '1px solid rgba(95, 34, 255, 0.08)',
                  transition: 'background 0.2s ease, transform 0.2s ease',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#eef2ff' }}>{conversation.title}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: '#adb2d2' }}>
                    {new Date(conversation.updatedAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(conversation.id, conversation.title);
                  }}
                  style={{
                    border: 'none',
                    background: 'rgba(255, 18, 122, 0.1)',
                    color: '#ff5fe0',
                    cursor: 'pointer',
                    fontSize: 18,
                    borderRadius: 10,
                    width: 34,
                    height: 34,
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
