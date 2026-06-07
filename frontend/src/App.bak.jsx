import { useEffect, useState } from 'react';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import ConversationList from './components/ConversationList';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch(${API}/conversations);
      const data = await response.json();
      setConversations(data);
      if (data.length > 0) {
        selectConversation(data[0].id, data[0].title);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const selectConversation = async (conversationId, title) => {
    setSelectedConversationId(conversationId);
    setConversationTitle(title || '');

    try {
      const response = await fetch(${API}/conversations//messages);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error(error);
      setMessages([]);
    }
  };

  const createConversation = async () => {
    try {
      const nextTitle = Chat ;
      const response = await fetch(${API}/conversations, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: nextTitle }),
      });
      const conversation = await response.json();
      setConversations((prev) => [conversation, ...prev]);
      selectConversation(conversation.id, conversation.title);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteConversation = async (conversationId) => {
    try {
      await fetch(${API}/conversations/, {
        method: 'DELETE',
      });
      const updated = conversations.filter((item) => item.id !== conversationId);
      setConversations(updated);
      if (selectedConversationId === conversationId) {
        if (updated.length > 0) {
          selectConversation(updated[0].id, updated[0].title);
        } else {
          setSelectedConversationId(null);
          setConversationTitle('');
          setMessages([]);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const sendMessage = async (text) => {
    if (loading) return;

    let conversationId = selectedConversationId;
    if (!conversationId) {
      try {
        const response = await fetch(${API}/conversations, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: Chat  }),
        });
        const conversation = await response.json();
        setConversations((prev) => [conversation, ...prev]);
        setSelectedConversationId(conversation.id);
        setConversationTitle(conversation.title);
        conversationId = conversation.id;
      } catch (error) {
        console.error(error);
        return;
      }
    }

    const userMsg = { role: 'user', content: text, id: Date.now() };
    const assistantId = Date.now() + 1;
    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '', id: assistantId }]);
    setLoading(true);

    try {
      const response = await fetch(${API}/chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Chat error:', errorBody);
        setLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('
');
        buffer = parts.pop();

        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const data = JSON.parse(trimmed.slice(6));
          if (data.token) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: msg.content + data.token }
                  : msg
              )
            );
          }
          if (data.done) {
            setLoading(false);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      <ConversationList
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelect={selectConversation}
        onCreate={createConversation}
        onDelete={deleteConversation}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 16, borderRadius: 20, border: '1px solid #e6e6e6', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>{conversationTitle || 'Selecciona una conversación'}</h2>
        </div>
        <ChatWindow messages={messages} loading={loading} />
        <div style={{ padding: '16px 24px', background: '#fff' }}>
          <ChatInput onSend={sendMessage} disabled={loading} />
        </div>
      </div>
    </div>
  );
}
