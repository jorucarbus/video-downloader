import { useState, useRef } from 'react';
import api, { API_BASE } from '../utils/api.js';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function AIAnalyzer({ videoPath, previewUrl }) {
  const [transcription, setTranscription] = useState(null);
  const [cites, setCites] = useState([]); // {start_time, end_time, quote, reason, status, editing}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const previewRef = useRef(null);
  const [playingIndex, setPlayingIndex] = useState(null);

  const analyze = async () => {
    if (!videoPath) return;
    setLoading(true);
    setError(null);
    try {
      const { data: transData } = await api.post('/analyze-audio', { videoPath, language: 'es' });
      setTranscription(transData.transcription);

      const { data: citesData } = await api.post('/suggest-cites', {
        transcription: transData.transcription,
        language: 'es',
      });
      setCites(citesData.cites.map((c) => ({ ...c, status: 'pending', editing: false })));
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al analizar audio');
    } finally {
      setLoading(false);
    }
  };

  const setStatus = (index, status) => {
    setCites((prev) => prev.map((c, i) => (i === index ? { ...c, status } : c)));
  };

  const toggleEditing = (index) => {
    setCites((prev) => prev.map((c, i) => (i === index ? { ...c, editing: !c.editing } : c)));
  };

  const updateField = (index, field, value) => {
    setCites((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const previewCite = (index) => {
    const cite = cites[index];
    const video = previewRef.current;
    if (!video || !previewUrl) return;
    video.currentTime = cite.start_time;
    video.play();
    setPlayingIndex(index);

    const stopAtEnd = () => {
      if (video.currentTime >= cite.end_time) {
        video.pause();
        video.removeEventListener('timeupdate', stopAtEnd);
        setPlayingIndex(null);
      }
    };
    video.addEventListener('timeupdate', stopAtEnd);
  };

  return (
    <div className="panel ai-analyzer">
      <h3>Análisis IA (Whisper + Gemini)</h3>
      <button onClick={analyze} disabled={!videoPath || loading}>
        {loading ? 'Analizando...' : 'Analizar audio'}
      </button>
      {error && <p className="error">{error}</p>}

      {previewUrl && (
        <video
          ref={previewRef}
          src={`${API_BASE}${previewUrl}`}
          className="preview-video-mini"
          controls
        />
      )}

      {cites.length > 0 && (
        <ul className="cites-list cites-list-interactive">
          {cites.map((c, i) => (
            <li key={i} className={`cite-item cite-${c.status}`}>
              {c.editing ? (
                <div className="cite-edit-row">
                  <input
                    type="number"
                    step="0.1"
                    value={c.start_time}
                    onChange={(e) => updateField(i, 'start_time', parseFloat(e.target.value))}
                  />
                  <span>–</span>
                  <input
                    type="number"
                    step="0.1"
                    value={c.end_time}
                    onChange={(e) => updateField(i, 'end_time', parseFloat(e.target.value))}
                  />
                  <textarea
                    value={c.quote}
                    onChange={(e) => updateField(i, 'quote', e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <strong>
                    [{formatTime(c.start_time)}-{formatTime(c.end_time)}]
                  </strong>{' '}
                  "{c.quote}" — <em>{c.reason}</em>
                </>
              )}

              <div className="cite-actions">
                <button
                  className={c.status === 'approved' ? 'active' : ''}
                  onClick={() => setStatus(i, 'approved')}
                >
                  ✅ Aprobar
                </button>
                <button
                  className={c.status === 'rejected' ? 'active' : ''}
                  onClick={() => setStatus(i, 'rejected')}
                >
                  ❌ Rechazar
                </button>
                <button onClick={() => toggleEditing(i)}>{c.editing ? '💾 Listo' : '✏️ Editar'}</button>
                <button onClick={() => previewCite(i)} disabled={!previewUrl}>
                  {playingIndex === i ? '▶ Reproduciendo...' : '▶ Previsualizar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
