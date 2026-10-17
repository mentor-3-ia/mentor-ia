import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const SYSTEM_PROMPT = `Eres Mentor-IA, un orientador vocacional empático del sistema educativo peruano.
export const MENTOR_IA_SYSTEM_PROMPT = `
Eres el motor neuro-vocacional de Mentor-IA. Tu objetivo es descubrir la CAPACIDAD REAL y el PROPÓSITO INTRÍNSECO de estudiantes confundidos que dudan de su talento, ANTES de hablar de dinero o planes de estudio.

REGLAS ESTRICTAS:
1. No preguntes "¿Qué carrera te gusta?" ni hables de sueldos al inicio.
2. Evalúa las respuestas del usuario a los 3 micro-retos observando CÓMO razona:
   - Capacidad Analítica y de Sistemas (estructura, causa-raíz, optimización).
   - Capacidad Empática y Comunicativa (mediación, enseñanza, conexión humana).
   - Capacidad Creativa y de Diseño (síntesis visual, innovación, divergencia).
3. Devuelve SIEMPRE un JSON estructurado con:
   - "capacidad_descubierta": Explicación empática de por qué el estudiante SÍ es capaz, basada en la evidencia de sus respuestas.
   - "nivel_confianza_detectado": Diagnóstico de la brecha entre lo que cree que puede hacer y lo que acaba de demostrar.
   - "carreras_recomendadas": Array de 3 opciones alineadas a su capacidad + interés intrínseco (explicando el porqué más allá de lo económico).
   - "plan_mentoria_4_semanas": 4 micro-acciones prácticas para validar la carrera sin riesgo.
4. Nunca solicites datos personales sensibles.

FORMATO DEL TAG:
Última línea del mensaje: [[BECAS: Nombre exacto 1 | Nombre exacto 2]]
- Solo becas que existan textualmente en el contexto.
- Si no recomiendas ninguna, omite el tag.`;

async function getBecas() {
  const { data, error } = await supabase.from('becas').select('*');
  if (error) throw new Error('Supabase error: ' + error.message);
  return data || [];
}

function buildContext(becas) {
  if (!becas.length) return 'No hay becas en la base de datos.';
  return 'BECAS DISPONIBLES:\n' + becas.map(b =>
    `- ${b.nombre} | ${b.institucion} | ${b.carrera} | Requisitos: ${b.requisitos} | Fecha: ${b.fecha_limite} | Estado: ${b.estado} | Link: ${b.link}`
  ).join('\n');
}

function extraerBecas(texto, todasLasBecas) {
  const match = texto.match(/\[\[BECAS:\s*(.+?)\]\]/s);
  if (!match) return { textoLimpio: texto, becas: [] };

  const nombres = match[1].split('|').map(n => n.trim().toLowerCase());
  const textoLimpio = texto.replace(match[0], '').trim();

  const becasEncontradas = todasLasBecas.filter(b =>
    nombres.some(n => b.nombre.toLowerCase().includes(n) || n.includes(b.nombre.toLowerCase()))
  );

  return { textoLimpio, becas: becasEncontradas };
}

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) throw new Error('Falta OPENROUTER_API_KEY');

    const todasLasBecas = await getBecas();
    const context = buildContext(todasLasBecas);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'system', content: context },
          ...messages,
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`OpenRouter ${response.status}: ${JSON.stringify(data)}`);

    const rawReply = data?.choices?.[0]?.message?.content;
    if (!rawReply) throw new Error('Respuesta vacía de OpenRouter');

    const { textoLimpio, becas } = extraerBecas(rawReply, todasLasBecas);

    return Response.json({ reply: textoLimpio, becas });
  } catch (e) {
    return Response.json({ reply: '⚠️ ' + e.message, becas: [] }, { status: 200 });
  }
}
