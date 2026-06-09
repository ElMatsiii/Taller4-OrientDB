import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ messages, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '22px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      background: 'var(--panel-alt)',
    }}>
      {messages.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40, fontSize: 14 }}>
          Empieza una conversación
        </p>
      )}
      {messages.map((msg, i) => (
        <MessageBubble key={msg.id ?? i} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
      ))}
      {loading && messages[messages.length - 1]?.content === '' && (
        <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: 13 }}>
          Escribiendo...
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}