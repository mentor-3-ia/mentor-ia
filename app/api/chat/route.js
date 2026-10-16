import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const SYSTEM_PROMPT = `Eres Mentor-IA, un orientador vocacional empático del sistema educativo peruano.

REGLAS ABSOLUTAS:
1. NUNCA repitas el saludo inicial.
2. Haz UNA SOLA pregunta por mensaje. Nunca listes opciones del modelo RIASEC.
3. Pregunta con EJEMPLOS CONCRETOS de la vida real, no con nombres técnicos.
4. El modelo RIASEC SOLO tiene 6 tipos: Realista, Investigador, Artístico, Social, Emprendedor, Convencional. NO inventes otros.
5. Máximo 4 preguntas antes de identificar el perfil.
6. Cuando tengas el perfil, di claramente "Tu perfil es X + Y" y recomienda 2-3 carreras concretas.
7. Responde en español, tono cálido, máximo 100 palabras.

SELECCIÓN DE BECAS (crítico):
- PRIORIZA becas con estado "abierta" o "proxima" en el contexto.
- Si hay 2 o más becas abiertas/próximas que encajen con el perfil, recomienda SOLO esas.
- Si TODAS las becas relevantes están cerradas, recomienda las 2 más afines y menciona EXPLÍCITAMENTE: "Aunque la convocatoria 2026 cerró, puedes prepararte para la próxima."
- Máximo 3 becas por recomendación.
- NO recomiendes becas de ingeniería o técnicas a un perfil claramente Social/Artístico, ni viceversa.

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
