import OpenAI from 'openai';
import fs from 'fs';

let client = null;
function getClient() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY no configurada');
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

/**
 * Transcribe audio/video con Whisper, retorna segments con timestamps.
 * @param {string} audioPath
 * @param {string} language - código ISO ('es' por defecto)
 */
export async function transcribeAudio(audioPath, language = 'es') {
  const openai = getClient();

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    language,
    response_format: 'verbose_json',
  });

  return (transcription.segments || []).map((seg) => ({
    time: seg.start,
    text: seg.text.trim(),
    duration: seg.end - seg.start,
  }));
}
