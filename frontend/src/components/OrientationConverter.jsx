import { useState } from 'react';
import api from '../utils/api.js';

export default function OrientationConverter({ videoPath, onUpdateCrop }) {
  const [mode, setMode] = useState('manual');
  const [detecting, setDetecting] = useState(false);

  const autoDetect = async () => {
    if (!videoPath) return;
    setDetecting(true);
    try {
      const { data } = await api.post('/detect-face', { videoPath, fps: 1 });
      if (data.boundingBox) {
        // centra crop vertical (1080x1920) en el rostro detectado
        const { x, y, width, height } = data.boundingBox;
        onUpdateCrop({
          x: Math.max(0, x + width / 2 - 540),
          y: Math.max(0, y + height / 2 - 960),
          width: 1080,
          height: 1920,
        });
      }
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="panel orientation-converter">
      <h3>Conversión H→V</h3>
      <div className="mode-selector">
        <label>
          <input type="radio" checked={mode === 'manual'} onChange={() => setMode('manual')} />
          Manual
        </label>
        <label>
          <input type="radio" checked={mode === 'auto'} onChange={() => setMode('auto')} />
          Automático (detección de rostro)
        </label>
      </div>

      {mode === 'auto' && (
        <button onClick={autoDetect} disabled={!videoPath || detecting}>
          {detecting ? 'Detectando...' : 'Detectar rostro y centrar'}
        </button>
      )}
      {mode === 'manual' && <p className="hint">Ajusta el crop directamente en Canvas Editor.</p>}
    </div>
  );
}
