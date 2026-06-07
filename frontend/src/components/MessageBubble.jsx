import ReactMarkdown from 'react-markdown';

export default function MessageBubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '75%',
        padding: '14px 18px',
        borderRadius: isUser ? '22px 22px 6px 22px' : '22px 22px 22px 6px',
        background: isUser ? 'linear-gradient(135deg, rgba(113, 86, 255, 0.95), rgba(255, 26, 193, 0.92))' : 'rgba(16, 20, 42, 0.96)',
        color: isUser ? '#fff' : '#dfe3ff',
        fontSize: 15,
        lineHeight: 1.7,
        wordBreak: 'break-word',
        boxShadow: isUser ? '0 18px 28px rgba(108, 71, 255, 0.18)' : '0 18px 32px rgba(0, 0, 0, 0.18)',
        border: isUser ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(84, 108, 255, 0.16)',
        animation: 'bubbleAppear 0.35s ease-out',
      }}>
        {content
          ? <ReactMarkdown>{content}</ReactMarkdown>
          : <span style={{ opacity: 0.4 }}>▌</span>
        }
      </div>
    </div>
  );
}