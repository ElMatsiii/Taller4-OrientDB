import ReactMarkdown from 'react-markdown';

export default function MessageBubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '75%',
        padding: '10px 14px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? '#6c47ff' : '#f0f0f0',
        color: isUser ? '#fff' : '#111',
        fontSize: 15,
        lineHeight: 1.5,
        wordBreak: 'break-word',
      }}>
        {content
          ? <ReactMarkdown>{content}</ReactMarkdown>
          : <span style={{ opacity: 0.4 }}>▌</span>
        }
      </div>
    </div>
  );
}