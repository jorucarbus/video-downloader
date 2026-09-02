import { API_BASE } from '../utils/api.js';

export default function CanvasEditor({ videoPath, previewUrl, edits, onUpdateEffect, onUpdateCrop }) {
  if (!videoPath) return null;

  // El navegador (versión web) no puede cargar file:// por seguridad — se sirve
  // por HTTP desde el backend (/media/*, ver server.js). Electron sí podría usar
  // file:// directo, pero se usa la misma URL HTTP en ambos casos por simplicidad.
  const src = previewUrl ? `${API_BASE}${previewUrl}` : null;

  return (
    <div className="panel canvas-editor">
      <h3>Canvas (Crop / Efectos)</h3>
      {src ? (
        <video src={src} controls className="preview-video" />
      ) : (
        <p className="hint">Sin preview disponible.</p>
      )}

      <div className="effects-panel">
        <label>
          Brillo: {edits.effects.brightness}
          <input
            type="range"
            min={-100}
            max={100}
            value={edits.effects.brightness}
            onChange={(e) => onUpdateEffect('brightness', parseInt(e.target.value, 10))}
          />
        </label>
        <label>
          Contraste: {edits.effects.contrast}
          <input
            type="range"
            min={-100}
            max={100}
            value={edits.effects.contrast}
            onChange={(e) => onUpdateEffect('contrast', parseInt(e.target.value, 10))}
          />
        </label>
        <label>
          Saturación: {edits.effects.saturation}
          <input
            type="range"
            min={-100}
            max={100}
            value={edits.effects.saturation}
            onChange={(e) => onUpdateEffect('saturation', parseInt(e.target.value, 10))}
          />
        </label>
      </div>
    </div>
  );
}
