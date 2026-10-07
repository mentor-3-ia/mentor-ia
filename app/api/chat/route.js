import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const SYSTEM_PROMPT = `Eres Mentor-IA, un orientador vocacional empático y profesional especializado en el sistema educativo peruano.

TU OBJETIVO:
Ayudar a estudiantes de secundaria y recién graduados a descubrir su vocación y encontrar becas disponibles en Perú.

FLUJO DE CONVERSACIÓN:
1. Saluda con calidez y haz UNA pregunta a la vez.
2. Haz preguntas basadas en el modelo RIASEC (Realista, Investigador, Artístico, Social, Emprendedor, Convencional) para identificar intereses. Máximo 5 preguntas.
3. Cuando tengas suficiente información, identifica el perfil RIASEC predominante.
4. Recomienda 2-3 carreras afines y explica brevemente por qué encajan.
5. Presenta las becas compatibles usando EXCLUSIVAMENTE los datos que se te entregan en el contexto. NUNCA inventes becas, fechas ni requisitos.
6. Si una beca tiene estado "cerrada", menciona que su convocatoria ya cerró y sugiere esperar la próxima. Si está "abierta" o "proxima", invita a postular.

REGLAS ESTRICTAS:
- Responde SIEMPRE en español, tono cálido y motivador.
- UNA pregunta a la vez. No abrumes al estudiante.
- NUNCA inventes información. Si no está en el contexto, di que no tienes ese dato y sugiere revisar pronabec.gob.pe.
- No pidas datos sensibles (DNI, dirección exacta, datos bancarios).
- Respuestas cortas: máximo 120 palabras por mensaje.`;

async function getBecas() {
  const { data, error } = await supabase.from('becas').select('*');
  if (error) return [];
  return data || [];
}

function buildContext(becas) {
  if (!becas.length) return 'No hay becas en la base de datos.';
  return 'BECAS DISPONIBLES EN LA BASE DE DATOS:\n' + becas.map(b =>
    `- ${b.nombre} | Institución: ${b.institucion} | Carrera: ${b.carrera} | Requisitos: ${b.requisitos} | Fecha límite: ${b.fecha_limite} | Estado: ${b.estado} | Link: ${b.link}`
  ).join('\n');
}

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const becas = await getBecas();
    const context = buildContext(becas);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'system', content: context },
          ...messages,
        ],
      }),
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje.';
    return Response.json({ reply });
  } catch (e) {
    return Response.json({ reply: 'Error del servidor. Intenta de nuevo.' }, { status: 500 });
  }
}
