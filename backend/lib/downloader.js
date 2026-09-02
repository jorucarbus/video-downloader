import YTDlpWrap from 'yt-dlp-wrap';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import ffprobePath from 'ffprobe-static';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, '..', 'temp-videos');

// yt-dlp-wrap no trae el binario empaquetado — busca 'yt-dlp' en PATH por default.
// YTDLP_PATH permite apuntar a una instalación existente (ej. pip install yt-dlp
// deja el .exe fuera del PATH en Windows).
const ytDlpWrap = process.env.YTDLP_PATH
  ? new YTDlpWrap.default(process.env.YTDLP_PATH)
  : new YTDlpWrap.default();

/**
 * Descarga un video desde cualquier URL soportada por yt-dlp.
 * @param {string} url
 * @returns {Promise<{ jobId: string, videoPath: string }>}
 */
export async function downloadVideo(url) {
  new URL(url); // valida formato, lanza si es inválida

  const jobId = uuidv4();
  const outputPath = path.join(TEMP_DIR, `${jobId}.mp4`);

  await ytDlpWrap.execPromise([
    url,
    '-f',
    'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    '-o',
    outputPath,
  ]);

  return { jobId, videoPath: outputPath };
}

/**
 * Extrae metadata de un video local con ffprobe.
 * @param {string} videoPath
 */
export async function getMetadata(videoPath) {
  const { stdout } = await execFileAsync(ffprobePath.path, [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=width,height,r_frame_rate',
    '-show_entries',
    'format=duration',
    '-of',
    'json',
    videoPath,
  ]);

  const data = JSON.parse(stdout);
  const stream = data.streams?.[0] || {};
  const [num, den] = (stream.r_frame_rate || '0/1').split('/').map(Number);
  const fps = den ? num / den : 0;
  const width = stream.width || 0;
  const height = stream.height || 0;

  return {
    duration: parseFloat(data.format?.duration || 0),
    fps,
    width,
    height,
    orientation: width >= height ? 'horizontal' : 'vertical',
  };
}
