'use client';
import { useState, useRef, useEffect } from 'react';

const RIASEC = [
  { code: 'R', name: 'Realista', desc: 'Trabajo manual, herramientas, naturaleza', color: '#ef4444' },
  { code: 'I', name: 'Investigador', desc: 'Análisis, ciencia, resolución de problemas', color: '#3b82f6' },
  { code: 'A', name: 'Artístico', desc: 'Creatividad, expresión, diseño', color: '#a855f7' },
  { code: 'S', name: 'Social', desc: 'Ayudar, enseñar, cuidar personas', color: '#10b981' },
  { code: 'E', name: 'Emprendedor', desc: 'Liderazgo, negocios, persuasión', color: '#f59e0b' },
  { code: 'C', name: 'Convencional', desc: 'Organización, datos, procedimientos', color: '#6b7280' },
];

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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* HEADER */}
      <header style={{
        padding: '18px 32px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
          }}>🎓</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>Mentor-IA</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Orientación vocacional y becas · Perú</div>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 999,
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          fontSize: 12, color: '#34d399', fontWeight: 600,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          Sistema activo
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
        gap: 0,
        overflow: 'hidden',
        height: 'calc(100vh - 79px)',
      }}>

        {/* CHAT PANEL */}
        <section style={{
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(148, 163, 184, 0.15)',
          background: 'rgba(15, 23, 42, 0.4)',
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 20,
                alignItems: 'flex-start',
                gap: 10,
              }}>
                {m.role === 'assistant' && (
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>🎓</div>
                )}
                <div style={{
                  maxWidth: '75%',
                  padding: '14px 18px',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                    : 'rgba(30, 41, 59, 0.9)',
                  border: m.role === 'user' ? 'none' : '1px solid rgba(148, 163, 184, 0.15)',
                  color: '#f8fafc',
                  whiteSpace: 'pre-wrap',
                  fontSize: 14.5,
                  lineHeight: 1.6,
                  boxShadow: m.role === 'user' ? '0 4px 14px rgba(59, 130, 246, 0.3)' : 'none',
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>🎓</div>
                <div style={{
                  padding: '14px 20px', borderRadius: '16px 16px 16px 4px',
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  display: 'flex', gap: 5, alignItems: 'center',
                }}>
                  <span className="dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#64748b', display: 'inline-block' }} />
                  <span className="dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#64748b', display: 'inline-block' }} />
                  <span className="dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#64748b', display: 'inline-block' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div style={{ padding: '20px 32px', borderTop: '1px solid rgba(148, 163, 184, 0.15)', background: 'rgba(15, 23, 42, 0.6)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Escribe tu respuesta..."
                style={{
                  flex: 1, padding: '14px 18px', borderRadius: 12,
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: '#f8fafc', fontSize: 14.5, outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                style={{
                  padding: '14px 24px', borderRadius: 12, border: 'none',
                  background: loading ? '#475569' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: '#fff', fontSize: 14.5, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 14px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.2s',
                }}
              >
                Enviar
              </button>
            </div>
          </div>
        </section>

        {/* INFO PANEL */}
        <section style={{ overflowY: 'auto', padding: '28px 26px', background: 'rgba(15, 23, 42, 0.3)' }}>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, letterSpacing: '1.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
              Modelo vocacional
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px' }}>RIASEC</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, lineHeight: 1.5 }}>
              Mentor-IA identifica tu perfil según los 6 tipos de personalidad vocacional de Holland.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {RIASEC.map((item) => (
              <div key={item.code} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                transition: 'all 0.2s',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: item.color + '22',
                  border: '1px solid ' + item.color + '55',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 800, color: item.color,
                }}>{item.code}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 22, padding: '14px 16px',
            borderRadius: 12,
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.6,
          }}>
            <div style={{ fontWeight: 700, color: '#60a5fa', marginBottom: 4 }}>📚 Base de datos</div>
            10 becas verificadas (PRONABEC, UNI, UNMSM, UNALM) conectadas en tiempo real. La IA solo responde con datos reales.
          </div>

          <div style={{
            marginTop: 12, padding: '14px 16px',
            borderRadius: 12,
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.6,
          }}>
            <div style={{ fontWeight: 700, color: '#34d399', marginBottom: 4 }}>🛡️ Anti-alucinación</div>
            Arquitectura RAG: la IA consulta la base de datos antes de responder. Cero invenciones.
          </div>
        </section>
      </main>

      <style jsx global>{`
        .dot { animation: pulse 1.4s infinite ease-in-out; }
        .dot:nth-child(1) { animation-delay: 0s; }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 4px; }
      `}</style>
    </div>
  );
}
