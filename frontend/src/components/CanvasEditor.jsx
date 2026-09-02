export default function CanvasEditor({ videoPath, edits, onUpdateEffect, onUpdateCrop }) {
  if (!videoPath) return null;

  return (
    <div className="panel canvas-editor">
      <h3>Canvas (Crop / Efectos)</h3>
      <video src={`file://${videoPath}`} controls className="preview-video" />

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
