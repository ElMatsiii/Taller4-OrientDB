import ReactMarkdown from 'react-markdown';

export default function MessageBubble({ role, content, timestamp }) {
  const isUser = role === 'user';

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '75%',
        padding: '12px 16px',
        borderRadius: 10,
        background: isUser ? 'var(--accent)' : 'var(--surface)',
        color: isUser ? '#fff' : 'var(--text)',
        fontSize: 14,
        lineHeight: 1.6,
        wordBreak: 'break-word',
        border: isUser ? '1px solid var(--accent)' : '1px solid var(--border)',
        animation: 'bubbleAppear 0.2s ease-out',
      }}>
        {content
          ? <ReactMarkdown>{content}</ReactMarkdown>
          : <span style={{ opacity: 0.4 }}>▌</span>
        }
        {formattedTime && (
          <div style={{
            marginTop: 6,
            fontSize: 11,
            opacity: 0.7,
            textAlign: isUser ? 'right' : 'left',
            color: isUser ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)',
          }}>
            {formattedTime}
          </div>
        )}
      </div>
    </div>
  );
}