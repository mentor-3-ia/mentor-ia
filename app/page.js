'use client';
import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy Mentor-IA, tu orientador vocacional. ¿Cómo te llamas y en qué grado estás?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setMessages([...newMessages, { role: 'assistant', content: 'Lo siento, hubo un error. Intenta de nuevo.' }]);
    }
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: 20, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{ margin: 0, fontSize: 24, color: '#1f2937' }}>🎓 Mentor-IA</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>Orientación vocacional y becas para jóvenes del Perú</p>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 12,
          }}>
            <div style={{
              maxWidth: '80%',
              padding: '10px 14px',
              borderRadius: 14,
              background: m.role === 'user' ? '#2563eb' : '#ffffff',
              color: m.role === 'user' ? '#fff' : '#1f2937',
              border: m.role === 'user' ? 'none' : '1px solid #e5e7eb',
              whiteSpace: 'pre-wrap',
              fontSize: 14,
              lineHeight: 1.5,
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div style={{ color: '#6b7280', fontSize: 13 }}>Mentor-IA está escribiendo...</div>}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '12px 0', borderTop: '1px solid #e5e7eb' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Escribe tu respuesta..."
          style={{ flex: 1, padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, outline: 'none' }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{ padding: '12px 20px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 14, cursor: 'pointer' }}
        >
          Enviar
        </button>
      </div>
    </main>
  );
}
