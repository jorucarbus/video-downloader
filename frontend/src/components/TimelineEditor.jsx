export default function TimelineEditor({ metadata, edits, onUpdateTrim }) {
  if (!metadata) return null;
  const duration = metadata.duration || 0;

  return (
    <div className="panel timeline-editor">
      <h3>Timeline (Recorte)</h3>
      <div className="trim-controls">
        <label>
          Inicio: {edits.trim.start?.toFixed(1)}s
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={edits.trim.start}
            onChange={(e) => onUpdateTrim(parseFloat(e.target.value), edits.trim.end)}
          />
        </label>
        <label>
          Fin: {edits.trim.end?.toFixed(1)}s
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={edits.trim.end ?? duration}
            onChange={(e) => onUpdateTrim(edits.trim.start, parseFloat(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}
