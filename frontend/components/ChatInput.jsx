import { useState } from 'react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div style={{ display: 'flex', gap: 8, padding: '12px 0 20px' }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
        placeholder="Escribe un mensaje... (Enter para enviar)"
        disabled={disabled}
        rows={2}
        style={{
          flex: 1, padding: '10px 14px', borderRadius: 12,
          border: '1px solid #ddd', fontSize: 15, resize: 'none',
          fontFamily: 'inherit', outline: 'none',
        }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        style={{
          padding: '0 20px', borderRadius: 12, border: 'none',
          background: disabled ? '#ccc' : '#6c47ff', color: '#fff',
          fontSize: 15, cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        Enviar
      </button>
    </div>
  );
}