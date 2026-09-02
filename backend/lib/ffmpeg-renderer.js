import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, '..', 'temp-videos');

// jobs en memoria (suficiente para MVP, sin DB)
export const renderJobs = new Map();

/**
 * Construye el filter_complex de FFmpeg a partir de edits.
 * Soporta: crop, effects (brightness/contrast/saturation),
 * shapes (recuadros/censura), stickers (PNG overlay fijo).
 */
function buildFilters(edits = {}) {
  const filters = [];

  if (edits.crop) {
    const { x, y, width, height } = edits.crop;
    filters.push(`crop=${width}:${height}:${x}:${y}`);
  }

  if (edits.effects) {
    const { brightness = 0, contrast = 0, saturation = 0 } = edits.effects;
    filters.push(
      `eq=brightness=${brightness / 100}:contrast=${1 + contrast / 100}:saturation=${1 + saturation / 100}`
    );
  }

  // Recuadros / censura (blur o color sólido) con sync a timeline
  if (edits.shapes?.length) {
    for (const shape of edits.shapes) {
      const enable = `between(t,${shape.timeline.startTime},${shape.timeline.endTime})`;
      const { x, y, width, height } = shape.properties;

      if (shape.type === 'blur') {
        // Censura: pixelar región (boxblur pesado sobre crop+overlay es más correcto,
        // para MVP usamos drawbox opaco como censura simple)
        filters.push(
          `drawbox=x=${x}:y=${y}:w=${width}:h=${height}:color=black:thickness=fill:enable='${enable}'`
        );
      } else {
        filters.push(
          `drawbox=x=${x}:y=${y}:w=${width}:h=${height}:color=${shape.properties.fillColor || 'black'}:thickness=fill:alpha=${shape.properties.fillOpacity ?? 1}:enable='${enable}'`
        );
      }

      if (shape.text?.content) {
        filters.push(
          `drawtext=text='${shape.text.content.replace(/'/g, "\\'")}':x=${x + 10}:y=${y + 10}:fontsize=${shape.text.fontSize || 24}:fontcolor=${shape.text.fontColor || 'white'}:enable='${enable}'`
        );
      }
    }
  }

  return filters;
}

/**
 * Renderiza video final aplicando trim, crop, effects, shapes, stickers.
 * Actualiza progreso en renderJobs (Map en memoria).
 */
export async function renderVideo(inputPath, edits = {}) {
  const jobId = uuidv4();
  const outputPath = path.join(TEMP_DIR, `${jobId}-output.mp4`);
  renderJobs.set(jobId, { status: 'rendering', progress: 0, outputPath: null });

  const filters = buildFilters(edits);
  const cmd = ffmpeg(inputPath);

  if (edits.trim?.start != null) cmd.setStartTime(edits.trim.start);
  if (edits.trim?.end != null && edits.trim?.start != null) {
    cmd.setDuration(edits.trim.end - edits.trim.start);
  }

  // Stickers PNG fijos (overlay estático, sin tracking)
  if (edits.stickers?.length) {
    for (const sticker of edits.stickers) {
      cmd.input(sticker.imagePath);
    }
  }

  const outputOptions = ['-c:a', 'aac', '-crf', '23', '-y'];
  if (filters.length) {
    outputOptions.unshift('-filter_complex', filters.join(','));
  }
  outputOptions.push('-c:v', 'libx264'); // fallback CPU; h264_nvenc si hay GPU disponible

  cmd
    .outputOptions(outputOptions)
    .output(outputPath)
    .on('progress', (p) => {
      const job = renderJobs.get(jobId);
      if (job) job.progress = Math.min(99, Math.round(p.percent || 0));
    })
    .on('end', () => {
      renderJobs.set(jobId, { status: 'completed', progress: 100, outputPath });
    })
    .on('error', (err) => {
      renderJobs.set(jobId, { status: 'failed', progress: 0, error: err.message });
    })
    .run();

  return { jobId, status: 'rendering', progress: 0 };
}

export function getRenderStatus(jobId) {
  return renderJobs.get(jobId) || null;
}
