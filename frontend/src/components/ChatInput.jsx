import { useState } from 'react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
        placeholder="Escribe un mensaje... (Enter para enviar)"
        disabled={disabled}
        rows={2}
        style={{
          flex: 1,
          padding: '12px 14px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
          fontSize: 14,
          resize: 'none',
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'border-color 0.15s ease',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        style={{
          padding: '0 22px',
          borderRadius: 8,
          border: '1px solid var(--accent)',
          background: disabled || !text.trim() ? 'var(--surface)' : 'var(--accent)',
          color: disabled || !text.trim() ? 'var(--text-muted)' : '#fff',
          borderColor: disabled || !text.trim() ? 'var(--border)' : 'var(--accent)',
          fontSize: 14,
          cursor: disabled ? 'not-allowed' : 'pointer',
          minWidth: 100,
          transition: 'background 0.15s ease',
        }}
      >
        Enviar
      </button>
    </div>
  );
}