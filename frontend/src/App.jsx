import { useEffect, useState } from 'react';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import ConversationList from './components/ConversationList';
import Modal from './components/Modal';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
  const [titleModalOpen, setTitleModalOpen] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch(`${API}/conversations`);
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
      const response = await fetch(`${API}/conversations/${encodeURIComponent(conversationId)}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error(error);
      setMessages([]);
    }
  };

  const openNewConversationDialog = () => {
    const nextTitle = `Chat ${conversations.length + 1}`;
    setTitleInput(nextTitle);
    setTitleModalOpen(true);
  };

  const createConversation = async (title) => {
    try {
      const nextTitle = title?.trim() || `Chat ${conversations.length + 1}`;
      const response = await fetch(`${API}/conversations`, {
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

  const requestDeleteConversation = (conversationId, title) => {
    setPendingDelete({ id: conversationId, title });
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteConversation = async () => {
    if (!pendingDelete) return;
    await deleteConversation(pendingDelete.id);
    setPendingDelete(null);
    setDeleteConfirmOpen(false);
  };

  const cancelDeleteConversation = () => {
    setPendingDelete(null);
    setDeleteConfirmOpen(false);
  };

  const deleteConversation = async (conversationId) => {
    try {
      const response = await fetch(`${API}/conversations/${encodeURIComponent(conversationId)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`No se pudo eliminar la conversación: ${errorBody}`);
      }
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
        const response = await fetch(`${API}/conversations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `Chat ${conversations.length + 1}` }),
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

    const userMsg = { role: 'user', content: text, id: Date.now(), timestamp: new Date().toISOString() };
    const assistantId = Date.now() + 1;
    const assistantTimestamp = new Date().toISOString();
    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '', id: assistantId, timestamp: assistantTimestamp }]);
    setLoading(true);

    try {
      const response = await fetch(`${API}/chat`, {
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
        const parts = buffer.split('\n');
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
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, timestamp: new Date().toISOString() }
                  : msg
              )
            );
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
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      padding: 24,
      gap: 20,
      background: 'radial-gradient(circle at top left, rgba(58, 95, 255, 0.16), transparent 32%), radial-gradient(circle at bottom right, rgba(255, 25, 181, 0.18), transparent 28%), #05060e',
      animation: 'fadeIn 0.9s ease-out',
    }}>
      <ConversationList
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelect={selectConversation}
        onCreate={openNewConversationDialog}
        onDelete={requestDeleteConversation}
      />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 24,
        overflow: 'hidden',
        border: '1px solid rgba(91, 43, 255, 0.35)',
        background: 'rgba(7, 10, 24, 0.96)',
        boxShadow: '0 0 40px rgba(93, 18, 255, 0.22)',
      }}>
        <div style={{
          padding: '22px 28px',
          borderBottom: '1px solid rgba(118, 35, 255, 0.18)',
          background: 'linear-gradient(180deg, rgba(15, 17, 38, 0.96), rgba(15, 17, 38, 0.85))',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 26,
            letterSpacing: '0.4px',
            color: '#f7f8ff',
            textShadow: '0 0 12px rgba(112, 0, 255, 0.3)',
          }}>{conversationTitle || 'Selecciona una conversación'}</h2>
        </div>
        <ChatWindow messages={messages} loading={loading} />
        <div style={{ padding: '18px 24px', background: 'rgba(9, 12, 32, 0.95)' }}>
          <ChatInput onSend={sendMessage} disabled={loading} />
        </div>
      </div>

      {titleModalOpen && (
        <Modal title="Nueva conversación" onClose={() => setTitleModalOpen(false)}>
          <p style={{ color: '#bfc6ff', marginBottom: 16 }}>Escribe un nombre para tu nueva conversación.</p>
          <input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Título de la conversación"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 14,
              border: '1px solid rgba(120, 82, 255, 0.4)',
              background: 'rgba(18, 22, 52, 0.95)',
              color: '#eef0ff',
              outline: 'none',
              marginBottom: 20,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={() => setTitleModalOpen(false)}
              style={{
                padding: '10px 18px',
                borderRadius: 14,
                border: '1px solid rgba(140, 130, 255, 0.35)',
                background: 'rgba(20, 24, 54, 0.88)',
                color: '#b3b9dd',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                createConversation(titleInput);
                setTitleModalOpen(false);
              }}
              style={{
                padding: '10px 18px',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #6c47ff, #ff1ac1)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Crear conversación
            </button>
          </div>
        </Modal>
      )}

      {deleteConfirmOpen && pendingDelete && (
        <Modal title="Confirmar eliminación" onClose={cancelDeleteConversation}>
          <p style={{ color: '#bfc6ff', marginBottom: 16 }}>
            ¿Estás seguro de que quieres eliminar <strong>{pendingDelete.title}</strong>?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={cancelDeleteConversation}
              style={{
                padding: '10px 18px',
                borderRadius: 14,
                border: '1px solid rgba(140, 130, 255, 0.35)',
                background: 'rgba(20, 24, 54, 0.88)',
                color: '#b3b9dd',
                cursor: 'pointer',
              }}
            >
              No
            </button>
            <button
              onClick={confirmDeleteConversation}
              style={{
                padding: '10px 18px',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #ff2a7a, #6c47ff)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Sí, eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
