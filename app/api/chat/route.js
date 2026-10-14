import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const SYSTEM_PROMPT = `Eres Mentor-IA, un orientador vocacional empático y profesional especializado en el sistema educativo peruano. Ayuda a estudiantes a descubrir su vocación y encontrar becas en Perú.

REGLAS CRÍTICAS:
1. NUNCA repitas el saludo inicial. Si el estudiante ya respondió, continúa la conversación naturalmente.
2. Haz UNA pregunta a la vez basada en el modelo RIASEC.
3. Máximo 5 preguntas antes de identificar el perfil.
4. Cuando tengas suficiente información, di el perfil RIASEC predominante y recomienda 2-3 carreras.
5. Presenta becas usando EXCLUSIVAMENTE los datos del contexto. NUNCA inventes becas, fechas ni requisitos.
6. Si una beca está "cerrada", dilo claramente. Si está "abierta" o "proxima", invita a postular.
7. Responde en español, tono cálido, máximo 120 palabras.

FORMATO OBLIGATORIO:
Cuando recomiendes becas, al FINAL de tu mensaje (última línea) agrega un tag con los nombres EXACTOS de las becas que recomiendas, usando este formato literal:
[[BECAS: Nombre exacto 1 | Nombre exacto 2]]

Reglas del tag:
- Solo incluye becas que aparezcan textualmente en el contexto.
- Si no recomiendas ninguna beca, NO incluyas el tag.
- El tag debe ir al final, en su propia línea.
- Usa el nombre exacto tal como aparece en el contexto.

DATOS DE CONTEXTO: Se te entrega la lista de becas disponibles. Si el estudiante no califica para ninguna por edad o grado, sugiere planificar para el futuro y menciona la beca más cercana.`;

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
