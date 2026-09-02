import { useState } from 'react';
import api from '../utils/api.js';

export default function AIAnalyzer({ videoPath }) {
  const [transcription, setTranscription] = useState(null);
  const [cites, setCites] = useState([]);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!videoPath) return;
    setLoading(true);
    try {
      const { data: transData } = await api.post('/analyze-audio', { videoPath, language: 'es' });
      setTranscription(transData.transcription);

      const { data: citesData } = await api.post('/suggest-cites', {
        transcription: transData.transcription,
        language: 'es',
      });
      setCites(citesData.cites);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel ai-analyzer">
      <h3>Análisis IA (Whisper + Gemini)</h3>
      <button onClick={analyze} disabled={!videoPath || loading}>
        {loading ? 'Analizando...' : 'Analizar audio'}
      </button>

      {cites.length > 0 && (
        <ul className="cites-list">
          {cites.map((c, i) => (
            <li key={i}>
              <strong>{c.start_time}s - {c.end_time}s:</strong> "{c.quote}" — <em>{c.reason}</em>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
