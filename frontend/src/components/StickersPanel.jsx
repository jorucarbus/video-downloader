import { useState } from 'react';

/**
 * Stickers PNG overlay FIJO (sin tracking de puntos — decisión de proyecto).
 * Usuario posiciona manualmente x/y y define ventana de tiempo en que aparece.
 */
export default function StickersPanel({ edits, onAddSticker, onRemoveSticker }) {
  const [imagePath, setImagePath] = useState('');
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(5);

  const handleAdd = () => {
    if (!imagePath) return;
    onAddSticker({
      imagePath,
      timeline: { startTime: start, endTime: end },
      position: { x: 100, y: 100, width: 150, height: 150 },
    });
  };

  const handleFileSelect = async () => {
    if (window.electronAPI?.selectFolder) {
      // TODO: reemplazar por dialog:openFile cuando esté implementado en preload.js
    }
  };

  return (
    <div className="panel stickers-panel">
      <h3>Stickers (PNG fijo)</h3>
      <input
        type="text"
        placeholder="Ruta imagen PNG"
        value={imagePath}
        onChange={(e) => setImagePath(e.target.value)}
      />
      <button onClick={handleFileSelect}>Elegir archivo...</button>
      <div className="time-range">
        <input type="number" value={start} onChange={(e) => setStart(parseFloat(e.target.value))} placeholder="inicio (s)" />
        <input type="number" value={end} onChange={(e) => setEnd(parseFloat(e.target.value))} placeholder="fin (s)" />
      </div>
      <button onClick={handleAdd} disabled={!imagePath}>+ Agregar sticker</button>

      <ul className="stickers-list">
        {edits.stickers.map((s) => (
          <li key={s.id}>
            {s.imagePath.split(/[\\/]/).pop()} [{s.timeline.startTime}s - {s.timeline.endTime}s]
            <button onClick={() => onRemoveSticker(s.id)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
