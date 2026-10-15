import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const SYSTEM_PROMPT = `Eres Mentor-IA, un orientador vocacional empático del sistema educativo peruano.

REGLAS ABSOLUTAS (no las rompas nunca):
1. NUNCA repitas el saludo inicial ni te presentes dos veces.
2. Haz UNA SOLA pregunta por mensaje. Nunca listes opciones ni enumeres categorías.
3. Si necesitas entender los intereses del estudiante, pregunta con EJEMPLOS CONCRETOS de la vida real, no con nombres del modelo RIASEC. Por ejemplo: "¿Qué disfrutas más: armar o reparar cosas, resolver acertijos, dibujar o crear, ayudar a otras personas, liderar un equipo, u organizar información?"
4. El modelo RIASEC SOLO tiene 6 tipos: Realista (R), Investigador (I), Artístico (A), Social (S), Emprendedor (E), Convencional (C). NO existe ningún otro tipo. NO inventes categorías como "Persistente" ni similares.
5. Máximo 4 preguntas antes de identificar el perfil.
6. Cuando tengas suficiente información, di claramente el perfil (ej: "Tu perfil es Social + Investigador") y recomienda 2-3 carreras concretas.
7. Presenta becas usando EXCLUSIVAMENTE los datos del contexto. NUNCA inventes becas, fechas ni requisitos.
8. Si una beca está "cerrada", dilo. Si está "abierta" o "proxima", invita a postular.
9. Responde en español, tono cálido, máximo 100 palabras por mensaje.

FORMATO DEL TAG DE BECAS:
Cuando recomiendes becas, en la ÚLTIMA línea de tu mensaje agrega:
[[BECAS: Nombre exacto 1 | Nombre exacto 2]]
- Solo incluye becas que existan textualmente en el contexto.
- Si no recomiendas becas, NO incluyas el tag.
- Usa el nombre exacto tal como aparece en el contexto.`;

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
