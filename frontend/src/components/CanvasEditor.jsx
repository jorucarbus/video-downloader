import { useRef, useState, useCallback } from 'react';
import { API_BASE } from '../utils/api.js';

/**
 * Recuadro arrastrable sobre el preview. Las coordenadas que maneja son
 * SIEMPRE en píxeles reales del video (las que espera FFmpeg) — la conversión
 * a píxeles de pantalla ocurre solo al pintar (via `scale`).
 */
function ShapeOverlay({ shape, scale, containerRef, onUpdatePosition, onRemove }) {
  const dragRef = useRef(null); // { startX, startY, origX, origY }

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: shape.properties.x,
      origY: shape.properties.y,
    };

    const handleMouseMove = (moveEvent) => {
      if (!dragRef.current) return;
      const dxScreen = moveEvent.clientX - dragRef.current.startX;
      const dyScreen = moveEvent.clientY - dragRef.current.startY;
      // Screen delta -> delta en píxeles reales del video (dividir por scale)
      const dx = dxScreen / scale;
      const dy = dyScreen / scale;
      const container = containerRef.current;
      const maxX = container ? container.clientWidth / scale - shape.properties.width : Infinity;
      const maxY = container ? container.clientHeight / scale - shape.properties.height : Infinity;
      onUpdatePosition(shape.id, {
        x: Math.max(0, Math.min(maxX, dragRef.current.origX + dx)),
        y: Math.max(0, Math.min(maxY, dragRef.current.origY + dy)),
      });
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const resizeRef = {
      startX: e.clientX,
      startY: e.clientY,
      origWidth: shape.properties.width,
      origHeight: shape.properties.height,
    };

    const handleMouseMove = (moveEvent) => {
      const dxScreen = moveEvent.clientX - resizeRef.startX;
      const dyScreen = moveEvent.clientY - resizeRef.startY;
      const dx = dxScreen / scale;
      const dy = dyScreen / scale;
      const container = containerRef.current;
      const maxWidth = container ? container.clientWidth / scale - shape.properties.x : Infinity;
      const maxHeight = container ? container.clientHeight / scale - shape.properties.y : Infinity;
      onUpdatePosition(shape.id, {
        width: Math.max(10, Math.min(maxWidth, resizeRef.origWidth + dx)),
        height: Math.max(10, Math.min(maxHeight, resizeRef.origHeight + dy)),
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const { x, y, width, height } = shape.properties;

  return (
    <div
      className={`shape-overlay shape-overlay-${shape.type}`}
      style={{
        left: x * scale,
        top: y * scale,
        width: width * scale,
        height: height * scale,
      }}
      onMouseDown={handleMouseDown}
      title="Arrastra para reposicionar"
    >
      <button
        className="shape-overlay-remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(shape.id);
        }}
      >
        ✕
      </button>
      <div
        className="shape-overlay-resize"
        onMouseDown={handleResizeMouseDown}
        title="Arrastra para redimensionar"
      />
    </div>
  );
}

export default function CanvasEditor({
  videoPath,
  previewUrl,
  metadata,
  edits,
  onUpdateEffect,
  onUpdateCrop,
  onUpdateShapePosition,
  onRemoveShape,
}) {
  const containerRef = useRef(null);
  const [displayWidth, setDisplayWidth] = useState(0);

  const handleVideoLoaded = useCallback((e) => {
    setDisplayWidth(e.target.clientWidth);
  }, []);

  if (!videoPath) return null;

  // El navegador (versión web) no puede cargar file:// por seguridad — se sirve
  // por HTTP desde el backend (/media/*, ver server.js). Electron sí podría usar
  // file:// directo, pero se usa la misma URL HTTP en ambos casos por simplicidad.
  const src = previewUrl ? `${API_BASE}${previewUrl}` : null;

  // Factor para convertir píxeles REALES del video (los que usa FFmpeg) a
  // píxeles de PANTALLA (los que usa el navegador para dibujar el overlay).
  const scale = metadata?.width && displayWidth ? displayWidth / metadata.width : 0;

  return (
    <div className="panel canvas-editor">
      <h3>Canvas (Crop / Efectos)</h3>
      {metadata && (
        <p className="canvas-meta">
          {metadata.width}×{metadata.height} · {metadata.orientation === 'vertical' ? '📱 Vertical' : '🖥️ Horizontal'} · {metadata.fps}fps
        </p>
      )}
      {src ? (
        <div className="canvas-video-wrapper" ref={containerRef}>
          <video
            src={src}
            controls
            className="preview-video"
            onLoadedMetadata={handleVideoLoaded}
          />
          {scale > 0 &&
            edits.shapes.map((shape) => (
              <ShapeOverlay
                key={shape.id}
                shape={shape}
                scale={scale}
                containerRef={containerRef}
                onUpdatePosition={onUpdateShapePosition}
                onRemove={onRemoveShape}
              />
            ))}
        </div>
      ) : (
        <p className="hint">Sin preview disponible.</p>
      )}
      {edits.shapes.length > 0 && (
        <p className="hint">Arrastra los recuadros sobre el video para reposicionarlos.</p>
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
