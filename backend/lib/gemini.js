import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
function getClient() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY no configurada');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Analiza transcripción y sugiere fragmentos de "cita" (5-20s c/u).
 * @param {Array<{time:number,text:string,duration:number}>} transcription
 */
export async function suggestCites(transcription, language = 'es') {
  const model = getClient().getGenerativeModel({ model: 'gemini-1.5-pro' });

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

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);

  if (!jsonMatch) throw new Error('Gemini no devolvió JSON válido');
  return JSON.parse(jsonMatch[0]);
}
