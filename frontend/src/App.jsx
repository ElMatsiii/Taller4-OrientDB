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
      gap: 16,
      background: 'var(--bg)',
      animation: 'fadeIn 0.4s ease-out',
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
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--panel)',
      }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--panel)',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--text)',
          }}>{conversationTitle || 'Selecciona una conversación'}</h2>
        </div>
        <ChatWindow messages={messages} loading={loading} />
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--panel)' }}>
          <ChatInput onSend={sendMessage} disabled={loading} />
        </div>
      </div>

      {titleModalOpen && (
        <Modal title="Nueva conversación" onClose={() => setTitleModalOpen(false)}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 14 }}>Escribe un nombre para tu nueva conversación.</p>
          <input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Título de la conversación"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              outline: 'none',
              marginBottom: 20,
              fontSize: 14,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={() => setTitleModalOpen(false)}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: 14,
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
                padding: '9px 16px',
                borderRadius: 8,
                border: '1px solid var(--accent)',
                background: 'var(--accent)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Crear conversación
            </button>
          </div>
        </Modal>
      )}

      {deleteConfirmOpen && pendingDelete && (
        <Modal title="Confirmar eliminación" onClose={cancelDeleteConversation}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 14 }}>
            ¿Estás seguro de que quieres eliminar <strong style={{ color: 'var(--text)' }}>{pendingDelete.title}</strong>?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={cancelDeleteConversation}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              No
            </button>
            <button
              onClick={confirmDeleteConversation}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                border: '1px solid var(--danger)',
                background: 'var(--danger)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
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