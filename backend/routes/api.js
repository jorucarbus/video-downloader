import { Router } from 'express';
import path from 'path';
import { downloadVideo, getMetadata } from '../lib/downloader.js';
import { renderVideo, getRenderStatus } from '../lib/ffmpeg-renderer.js';
import { transcribeAudio } from '../lib/whisper.js';
import { suggestCites } from '../lib/gemini.js';
import { uploadToDrive, replaceInDrive, listVideosInFolder, downloadFromDrive } from '../lib/drive-sync.js';
import { detectFace } from '../lib/mediapipe.js';
import { exportLocal, logDriveExport, getRecentExports } from '../lib/local-export.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// Convierte una ruta absoluta dentro de temp-videos/ a una URL servible por HTTP
// (/media/<archivo>, ver server.js) — el navegador no puede cargar file:// directo.
const toPreviewUrl = (filePath) => `/media/${path.basename(filePath)}`;

// --- Download & Metadata ---

router.post('/download', asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url requerida' });

  const { jobId, videoPath } = await downloadVideo(url);
  const metadata = await getMetadata(videoPath);
  res.json({ jobId, videoPath, previewUrl: toPreviewUrl(videoPath), metadata });
}));

router.get('/metadata/:jobId', asyncHandler(async (req, res) => {
  // MVP: el cliente reenvía videoPath conocido; sin DB de jobs de descarga aún.
  res.status(501).json({ error: 'No implementado: usar metadata devuelta por /download' });
}));

// --- Video Editing ---

router.post('/render-final', asyncHandler(async (req, res) => {
  const { videoPath, edits } = req.body;
  if (!videoPath || !edits) return res.status(400).json({ error: 'videoPath y edits requeridos' });

  const result = await renderVideo(videoPath, edits);
  res.status(202).json(result);
}));

router.get('/render-status/:jobId', (req, res) => {
  const status = getRenderStatus(req.params.jobId);
  if (!status) return res.status(404).json({ error: 'job no encontrado' });
  const previewUrl = status.outputPath ? toPreviewUrl(status.outputPath) : null;
  res.json({ ...status, previewUrl });
});

// --- AI Analysis ---

router.post('/analyze-audio', asyncHandler(async (req, res) => {
  const { videoPath, language = 'es' } = req.body;
  if (!videoPath) return res.status(400).json({ error: 'videoPath requerido' });

  const transcription = await transcribeAudio(videoPath, language);
  res.json({ transcription });
}));

router.post('/suggest-cites', asyncHandler(async (req, res) => {
  const { transcription, language = 'es' } = req.body;
  if (!transcription) return res.status(400).json({ error: 'transcription requerida' });

  const cites = await suggestCites(transcription, language);
  res.json({ cites });
}));

// --- Media Processing ---

router.post('/detect-face', asyncHandler(async (req, res) => {
  const { videoPath, fps = 1 } = req.body;
  if (!videoPath) return res.status(400).json({ error: 'videoPath requerido' });

  const result = await detectFace(videoPath, fps);
  res.json(result);
}));

// --- Storage ---

router.post('/upload-drive', asyncHandler(async (req, res) => {
  const { filePath, destFolder, fileName } = req.body;
  if (!filePath || !destFolder || !fileName) {
    return res.status(400).json({ error: 'filePath, destFolder, fileName requeridos' });
  }
  const result = await uploadToDrive(filePath, destFolder, fileName);
  logDriveExport(fileName, destFolder);
  res.json(result);
}));

router.post('/export-local', asyncHandler(async (req, res) => {
  const { filePath, destPath, fileName } = req.body;
  if (!filePath || !destPath || !fileName) {
    return res.status(400).json({ error: 'filePath, destPath, fileName requeridos' });
  }
  const result = await exportLocal(filePath, destPath, fileName);
  res.json(result);
}));

router.get('/recent-exports', (req, res) => {
  res.json(getRecentExports());
});

// Reemplaza video existente en Drive (batch refine / re-edición de archivos ya publicados)
router.post('/replace-drive', asyncHandler(async (req, res) => {
  const { fileId, filePath } = req.body;
  if (!fileId || !filePath) return res.status(400).json({ error: 'fileId y filePath requeridos' });

  const result = await replaceInDrive(fileId, filePath);
  res.json(result);
}));

router.get('/drive-folder/:folderId/videos', asyncHandler(async (req, res) => {
  const files = await listVideosInFolder(req.params.folderId);
  res.json({ files });
}));

router.post('/download-drive', asyncHandler(async (req, res) => {
  const { fileId, destPath } = req.body;
  if (!fileId || !destPath) return res.status(400).json({ error: 'fileId y destPath requeridos' });

  const path = await downloadFromDrive(fileId, destPath);
  res.json({ path });
}));

export default router;
