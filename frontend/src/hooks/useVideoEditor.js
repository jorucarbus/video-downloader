import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * Estado central de edición: trim, crop, effects, shapes (recuadros/censura),
 * stickers (PNG overlay fijo, sin tracking), dimensiones de salida.
 */
export function useVideoEditor() {
  const [videoPath, setVideoPath] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [edits, setEdits] = useState({
    trim: { start: 0, end: null },
    crop: null,
    effects: { brightness: 0, contrast: 0, saturation: 0 },
    shapes: [],
    stickers: [],
    outputDimensions: '1080x1920',
  });

  const loadVideo = useCallback((path, meta) => {
    setVideoPath(path);
    setMetadata(meta);
    setEdits((prev) => ({ ...prev, trim: { start: 0, end: meta?.duration ?? null } }));
  }, []);

  const updateTrim = useCallback((start, end) => {
    setEdits((prev) => ({ ...prev, trim: { start, end } }));
  }, []);

  const updateCrop = useCallback((crop) => {
    setEdits((prev) => ({ ...prev, crop }));
  }, []);

  const updateEffect = useCallback((effect, value) => {
    setEdits((prev) => ({ ...prev, effects: { ...prev.effects, [effect]: value } }));
  }, []);

  const addShape = useCallback((shape) => {
    setEdits((prev) => ({ ...prev, shapes: [...prev.shapes, { id: uuidv4(), ...shape }] }));
  }, []);

  const removeShape = useCallback((id) => {
    setEdits((prev) => ({ ...prev, shapes: prev.shapes.filter((s) => s.id !== id) }));
  }, []);

  const addSticker = useCallback((sticker) => {
    setEdits((prev) => ({ ...prev, stickers: [...prev.stickers, { id: uuidv4(), ...sticker }] }));
  }, []);

  const removeSticker = useCallback((id) => {
    setEdits((prev) => ({ ...prev, stickers: prev.stickers.filter((s) => s.id !== id) }));
  }, []);

  return {
    videoPath,
    metadata,
    edits,
    loadVideo,
    updateTrim,
    updateCrop,
    updateEffect,
    addShape,
    removeShape,
    addSticker,
    removeSticker,
  };
}
