import { useState } from 'react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 0 16px' }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
        placeholder="Escribe un mensaje... (Enter para enviar)"
        disabled={disabled}
        rows={2}
        style={{
          flex: 1,
          padding: '14px 16px',
          borderRadius: 18,
          border: '1px solid rgba(95, 40, 255, 0.45)',
          background: 'rgba(11, 15, 34, 0.9)',
          color: '#eef0ff',
          fontSize: 15,
          resize: 'none',
          fontFamily: 'inherit',
          outline: 'none',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
        onFocus={e => e.target.style.boxShadow = '0 0 0 2px rgba(108, 71, 255, 0.33)'}
        onBlur={e => e.target.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.03)'}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        style={{
          padding: '0 24px',
          borderRadius: 18,
          border: '1px solid transparent',
          background: disabled ? 'rgba(78, 84, 128, 0.7)' : 'linear-gradient(135deg, #6c47ff, #ff1ac1)',
          color: '#fff',
          fontSize: 15,
          cursor: disabled ? 'not-allowed' : 'pointer',
          minWidth: 110,
          boxShadow: disabled ? 'none' : '0 14px 32px rgba(108, 71, 255, 0.24)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={e => !disabled && (e.currentTarget.style.transform = 'translateY(-1px)')}
        onMouseLeave={e => !disabled && (e.currentTarget.style.transform = 'translateY(0)')}
      >
        Enviar
      </button>
    </div>
  );
}