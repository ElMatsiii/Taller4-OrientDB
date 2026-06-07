export default function ConversationList({ conversations, selectedConversationId, onSelect, onCreate, onDelete }) {
  return (
    <div style={{ width: 300, minWidth: 280, borderRadius: 20, border: '1px solid #e6e6e6', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '20px 18px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <strong style={{ fontSize: 16 }}>Conversaciones</strong>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#666' }}>Crea o selecciona un chat</p>
        </div>
        <button
          onClick={onCreate}
          style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: '#6c47ff', color: '#fff', cursor: 'pointer' }}
        >
          +
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <div style={{ padding: 20, color: '#666', fontSize: 14 }}>
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
                  background: isActive ? '#f5f0ff' : 'transparent',
                  borderBottom: '1px solid #f3f3f3',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{conversation.title}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: '#888' }}>
                    {new Date(conversation.updatedAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(conversation.id);
                  }}
                  style={{ border: 'none', background: 'transparent', color: '#999', cursor: 'pointer', fontSize: 16 }}
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
