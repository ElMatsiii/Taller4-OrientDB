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
      gap: 16,
      background: 'linear-gradient(180deg, rgba(10, 12, 32, 0.95), rgba(16, 20, 50, 0.98))',
      animation: 'fadeInUp 0.7s ease-out',
    }}>
      {messages.length === 0 && (
        <p style={{ textAlign: 'center', color: '#8b93b9', marginTop: 40, fontSize: 15 }}>
          Empieza una conversación
        </p>
      )}
      {messages.map((msg, i) => (
        <MessageBubble key={msg.id ?? i} role={msg.role} content={msg.content} />
      ))}
      {loading && messages[messages.length - 1]?.content === '' && (
        <div style={{ alignSelf: 'flex-start', color: '#999', fontSize: 14 }}>
           Escribiendo...
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}