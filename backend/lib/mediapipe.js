// Face detection para conversión H→V automática.
// NOTA: sin pose/hand tracking (descartado — decisión del proyecto:
// stickers son overlay fijo, no siguen puntos de referencia).
//
// MVP usa un microservicio Python local (MediaPipe FaceMesh) porque
// el binding JS de MediaPipe no corre bien en Node puro. El microservicio
// se ejecuta en la máquina local (RTX 3070 / Mac Studio M2 Ultra), no en Railway.

import axios from 'axios';
import { execFile } from 'child_process';
import { promisify } from 'util';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import os from 'os';

const execFileAsync = promisify(execFile);
const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:5000/detect-face';

async function extractFrames(videoPath, samplesPerSecond = 1) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'frames-'));
  await execFileAsync(ffmpegPath, [
    '-i', videoPath,
    '-vf', `fps=${samplesPerSecond}`,
    path.join(tmpDir, 'frame-%03d.jpg'),
  ]);
  return fs.readdirSync(tmpDir).map((f) => path.join(tmpDir, f));
}

function averageBoundingBoxes(boxes) {
  if (!boxes.length) return null;
  const sum = boxes.reduce(
    (acc, b) => ({ x: acc.x + b.x, y: acc.y + b.y, width: acc.width + b.width, height: acc.height + b.height }),
    { x: 0, y: 0, width: 0, height: 0 }
  );
  const n = boxes.length;
  return { x: sum.x / n, y: sum.y / n, width: sum.width / n, height: sum.height / n };
}

/**
 * Detecta rostro promedio en el video (para centrar crop H→V).
 * Requiere microservicio local corriendo (ver /docs futuro face-service/).
 */
export async function detectFace(videoPath, samplesPerSecond = 1) {
  const frames = await extractFrames(videoPath, samplesPerSecond);
  const boxes = [];

  for (const framePath of frames) {
    const image = fs.readFileSync(framePath, { encoding: 'base64' });
    try {
      const { data } = await axios.post(FACE_SERVICE_URL, { image });
      if (data.face) boxes.push(data.face);
    } finally {
      fs.unlinkSync(framePath);
    }
  }

  const box = averageBoundingBoxes(boxes);
  if (!box) return { boundingBox: null, confidence: 0 };

  return { boundingBox: box, confidence: boxes.length / frames.length };
}
