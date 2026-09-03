import { useState } from 'react';

const SHAPE_TYPES = [
  { value: 'box', label: 'Recuadro (texto/marca)' },
  { value: 'blur', label: 'Censura (bloque opaco)' },
];

export default function ShapesPanel({ edits, onAddShape, onRemoveShape, onUpdateShapeProperty }) {
  const [type, setType] = useState('blur');
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(5);

  const handleAdd = () => {
    onAddShape({
      type,
      timeline: { startTime: start, endTime: end },
      properties: { x: 100, y: 100, width: 200, height: 100, fillColor: 'black', fillOpacity: 1 },
      text: { content: '' },
    });
  };

  return (
    <div className="panel shapes-panel">
      <h3>Recuadros & Censura</h3>
      <select value={type} onChange={(e) => setType(e.target.value)}>
        {SHAPE_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <div className="time-range">
        <input type="number" value={start} onChange={(e) => setStart(parseFloat(e.target.value))} placeholder="inicio (s)" />
        <input type="number" value={end} onChange={(e) => setEnd(parseFloat(e.target.value))} placeholder="fin (s)" />
      </div>
      <button onClick={handleAdd}>+ Agregar</button>

      <ul className="shapes-list">
        {edits.shapes.map((s) => (
          <li key={s.id} className="shape-item">
            <div className="shape-item-row">
              <span>
                {s.type} [{s.timeline.startTime}s - {s.timeline.endTime}s]
              </span>
              <button onClick={() => onRemoveShape(s.id)}>✕</button>
            </div>
            {s.type === 'box' && (
              <div className="shape-item-inspector">
                <label>
                  Color
                  <input
                    type="color"
                    value={s.properties.fillColor?.startsWith('#') ? s.properties.fillColor : '#000000'}
                    onChange={(e) =>
                      onUpdateShapeProperty(s.id, { fillColor: e.target.value })
                    }
                  />
                </label>
                <label>
                  Opacidad {Math.round((s.properties.fillOpacity ?? 1) * 100)}%
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={s.properties.fillOpacity ?? 1}
                    onChange={(e) =>
                      onUpdateShapeProperty(s.id, { fillOpacity: parseFloat(e.target.value) })
                    }
                  />
                </label>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="hint">
        Arrastra el recuadro directamente sobre el video en Canvas para reposicionarlo y
        redimensionarlo. La censura (bloque opaco) siempre es negra sólida por diseño.
      </p>
    </div>
  );
}
