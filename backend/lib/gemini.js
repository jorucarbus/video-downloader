import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
function getClient() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY no configurada');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

// Alias que Google mantiene apuntando al modelo flash estable más reciente —
// evita fijar un nombre versionado que Google puede retirar (pasó con
// gemini-1.5-pro, 404 desde esta cuenta el 2026-09-02). gemini-3.5-flash como
// fallback fijo por si el alias mismo llega a fallar.
const MODELOS = ['gemini-flash-latest', 'gemini-3.5-flash'];

async function generarConFallback(prompt) {
  let lastErr;
  for (const modelo of MODELOS) {
    try {
      const model = getClient().getGenerativeModel({ model: modelo });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

/**
 * Analiza transcripción y sugiere fragmentos de "cita" (5-20s c/u).
 * @param {Array<{time:number,text:string,duration:number}>} transcription
 */
export async function suggestCites(transcription, language = 'es') {
  const prompt = `Analiza esta transcripción de video y sugiere fragmentos de "cita" (5-20 segundos cada uno).

Transcripción con timestamps:
${transcription.map((seg) => `[${seg.time.toFixed(1)}s] ${seg.text}`).join('\n')}

Identifica:
- Cambios de tema
- Frases clave/impactantes
- Momentos de énfasis

Responde SOLO con JSON válido, este formato exacto:
[
  {
    "start_time": 12.5,
    "end_time": 25.3,
    "reason": "cambio de tema: ahora habla de X",
    "quote": "texto exacto del fragmento"
  }
]`;

  const responseText = await generarConFallback(prompt);
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);

  if (!jsonMatch) throw new Error('Gemini no devolvió JSON válido');
  return JSON.parse(jsonMatch[0]);
}
