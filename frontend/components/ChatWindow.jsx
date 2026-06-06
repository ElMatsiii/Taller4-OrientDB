import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ messages, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {messages.length === 0 && (
        <p style={{ textAlign: 'center', color: '#999', marginTop: 40 }}>
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