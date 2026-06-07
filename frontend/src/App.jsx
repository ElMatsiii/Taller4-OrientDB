import { useState, useEffect, useRef } from 'react';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar historial al montar
  useEffect(() => {
    fetch(`${API}/history`)
      .then(r => r.json())
      .then(setMessages)
      .catch(console.error);
  }, []);

  const sendMessage = async (text) => {
    if (loading) return;

    // Agregar mensaje del usuario al estado local inmediatamente
    const userMsg = { role: 'user', content: text, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Placeholder para la respuesta del asistente (streaming)
    const assistantId = Date.now() + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId }]);

    try {
      const response = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = JSON.parse(line.slice(6));
          if (data.token) {
            // Agregar token a la burbuja del asistente en tiempo real
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: m.content + data.token }
                  : m
              )
            );
          }
          if (data.done || data.error) setLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
      <h2 style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid #eee' }}>
        Chat IA Local 
      </h2>
      <ChatWindow messages={messages} loading={loading} />
      <ChatInput onSend={sendMessage} disabled={loading} />
    </div>
  );
}