# 🏗️ Architecture & Technical Details

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│           Video Downloader & Editor App                     │
└─────────────────────────────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼────┐      ┌─────▼──────┐    ┌─────▼──────┐
    │ Frontend │      │  Backend   │    │ External   │
    │ (React)  │      │ (Express)  │    │ Services   │
    └──────────┘      └────────────┘    └────────────┘
         │                  │                  │
    • Electron          • API Routes          • Google Drive
    • Web UI           • Video Processing     • Gemini API
    • Canvas Editor    • IA Integration       • Whisper
    • Shapes Panel     • Drive Sync           • MediaPipe
                       • File Management      • yt-dlp
```

---

## Backend Architecture

### Server Setup (Express)

```javascript
// backend/server.js
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api', apiRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
```

### Directory Structure

```
backend/
├── server.js              # Express app
├── package.json          
├── routes/
│   └── api.js            # API endpoints
├── lib/
│   ├── downloader.js     # yt-dlp wrapper
│   ├── ffmpeg-renderer.js # FFmpeg orchestration
│   ├── whisper.js        # OpenAI Whisper
│   ├── gemini.js         # Google Gemini
│   ├── drive-sync.js     # Google Drive API
│   └── mediapipe.js      # Face detection
├── temp-videos/          # Temporary video storage
└── logs/                 # Server logs
```

---

## API Endpoints

### Download & Metadata

```
POST /api/download
├── Body: {
│   "url": "https://youtube.com/watch?v=...",
│   "format": "mp4" // opcional
│ }
├── Response: {
│   "jobId": "uuid-1",
│   "videoPath": "/temp-videos/video-uuid.mp4",
│   "metadata": {
│     "duration": 120.5,
│     "fps": 30,
│     "width": 1920,
│     "height": 1080,
│     "orientation": "horizontal"
│   }
│ }
└── Status: 200 | 400 | 500

GET /api/metadata/:jobId
├── Response: metadata object
└── Status: 200 | 404
```

### Video Editing

```
POST /api/preview
├── Body: {
│   "videoPath": "...",
│   "effects": {
│     "brightness": 20,
│     "contrast": 10,
│     "saturation": 5
│   },
│   "crop": {x: 100, y: 50, width: 800, height: 600},
│   "trim": {start: 5.0, end: 60.0}
│ }
├── Response: {
│   "thumbnailUrl": "/preview/uuid",
│   "duration": 55.0
│ }
└── Status: 200 | 400

POST /api/render-final
├── Body: {
│   "videoPath": "...",
│   "edits": {
│     "trim": {start: 5, end: 60},
│     "crop": {...},
│     "effects": {...},
│     "shapes": [{...}, {...}],
│     "outputDimensions": "1080x1920"
│   }
│ }
├── Response: {
│   "jobId": "uuid",
│   "status": "rendering",
│   "progress": 0
│ }
└── Status: 202 Accepted | 400
```

### AI Analysis

```
POST /api/analyze-audio
├── Body: {
│   "videoPath": "...",
│   "language": "es"
│ }
├── Response: {
│   "jobId": "uuid",
│   "transcription": [
│     {"time": 0, "text": "Hola mundo", "duration": 2.5},
│     {"time": 2.5, "text": "¿Cómo estás?", "duration": 1.2}
│   ]
│ }
└── Status: 200 | 400

POST /api/suggest-cites
├── Body: {
│   "transcription": [...],
│   "language": "es"
│ }
├── Response: {
│   "cites": [
│     {
│       "start_time": 5.0,
│       "end_time": 15.3,
│       "reason": "cambio de tema",
│       "quote": "texto de la cita"
│     }
│   ]
│ }
└── Status: 200 | 400
```

### Media Processing

```
POST /api/detect-face
├── Body: {
│   "videoPath": "...",
│   "fps": 1  // samples per second
│ }
├── Response: {
│   "boundingBox": {
│     "x": 450,
│     "y": 200,
│     "width": 300,
│     "height": 400
│   },
│   "confidence": 0.95
│ }
└── Status: 200 | 400

GET /api/render-status/:jobId
├── Response: {
│   "status": "rendering" | "completed" | "failed",
│   "progress": 45,  // 0-100
│   "outputPath": "/temp-videos/output.mp4"  // si completado
│ }
└── Status: 200 | 404
```

### Storage

```
POST /api/upload-drive
├── Body: {
│   "filePath": "/temp-videos/output.mp4",
│   "destFolder": "Videos_Famosos_Carpetas/Shakira",
│   "fileName": "20260901-clip.mp4"
│ }
├── Response: {
│   "driveId": "file-id",
│   "driveUrl": "https://drive.google.com/file/d/..."
│ }
└── Status: 200 | 400

POST /api/export-local
├── Body: {
│   "filePath": "/temp-videos/output.mp4",
│   "destPath": "~/Descargas/Videos_Editados/",
│   "fileName": "20260901-clip.mp4"
│ }
├── Response: {
│   "saved": true,
│   "path": "/Users/.../20260901-clip.mp4"
│ }
└── Status: 200 | 400

GET /api/recent-exports
├── Response: [
│   {
│     "fileName": "20260901-clip.mp4",
│     "dateExported": "2026-09-01T14:30:00Z",
│     "destination": "drive" | "local" | "both",
│     "driveFolder": "Videos_Famosos_Carpetas/Shakira"
│   }
│ ]
└── Status: 200
```

---

## Key Libraries & Integration

### 1. FFmpeg Processing

```javascript
// backend/lib/ffmpeg-renderer.js
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

async function renderVideo(inputPath, edits) {
  return new Promise((resolve, reject) => {
    let cmd = ffmpeg(inputPath);

    // Build filter complex
    let filters = [];
    
    // Crop
    if (edits.crop) {
      filters.push(`crop=${edits.crop.width}:${edits.crop.height}:${edits.crop.x}:${edits.crop.y}`);
    }

    // Effects
    if (edits.effects) {
      filters.push(`eq=brightness=${edits.effects.brightness/100}:contrast=${edits.effects.contrast/100}:saturation=${edits.effects.saturation/100}`);
    }

    // Shapes (drawbox + drawtext)
    if (edits.shapes && edits.shapes.length) {
      edits.shapes.forEach(shape => {
        const enable = `between(t,${shape.timeline.startTime},${shape.timeline.endTime})`;
        filters.push(`drawbox=x=${shape.properties.x}:y=${shape.properties.y}:w=${shape.properties.width}:h=${shape.properties.height}:color=${shape.properties.fillColor}:thickness=fill:alpha=${shape.properties.fillOpacity}:enable='${enable}'`);
        
        if (shape.text.content) {
          filters.push(`drawtext=text='${shape.text.content}':x=${shape.properties.x + 10}:y=${shape.properties.y + 10}:fontsize=${shape.text.fontSize}:fontcolor=${shape.text.fontColor}:enable='${enable}'`);
        }
      });
    }

    cmd
      .inputOptions([`-ss ${edits.trim.start}`, `-to ${edits.trim.end}`])
      .outputOptions([
        `-filter_complex "${filters.join(',')}\"`,
        `-c:v h264_nvenc`, // NVIDIA GPU, fallback: libx264
        `-c:a aac`,
        `-crf 23`,
        `-y`
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}
```

### 2. Whisper Integration

```javascript
// backend/lib/whisper.js
const { Configuration, OpenAIApi } = require('openai');

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

async function transcribeAudio(audioPath, language = 'es') {
  const audioFile = fs.createReadStream(audioPath);
  
  const transcript = await openai.createTranscription(
    audioFile,
    'whisper-1',
    undefined,
    language,
    undefined,
    'verbose_json' // incluye timestamps
  );

  return transcript.data.segments.map(seg => ({
    time: seg.start,
    text: seg.text,
    duration: seg.end - seg.start
  }));
}
```

### 3. Gemini Analysis

```javascript
// backend/lib/gemini.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function suggestCites(transcription, language = 'es') {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
Analiza esta transcripción de video y sugiere fragmentos de "cita" (5-20 segundos cada uno).

Transcripción con timestamps:
${transcription.map(seg => `[${seg.time.toFixed(1)}s] ${seg.text}`).join('\n')}

Identifica:
- Cambios de tema
- Frases clave/impactantes
- Momentos de énfasis

Responde en JSON con este formato:
[
  {
    "start_time": 12.5,
    "end_time": 25.3,
    "reason": "cambio de tema: ahora habla de X",
    "quote": "texto exacto del fragmento"
  }
]
`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  // Parse JSON from response
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  return JSON.parse(jsonMatch[0]);
}
```

### 4. MediaPipe Face Detection

```javascript
// backend/lib/mediapipe.js
const Holistic = require('@mediapipe/holistic');

async function detectFace(videoPath, samplesPerSecond = 1) {
  // Nota: Esta es una simplificación. 
  // En producción usarías OpenCV + MediaPipe Python
  // o servicio web tipo:
  
  const axios = require('axios');
  
  // Extraer frames
  const frames = await extractFrames(videoPath, samplesPerSecond);
  
  let boundingBoxes = [];
  
  for (let frame of frames) {
    // Enviar a servicio MediaPipe local
    const response = await axios.post(
      'http://localhost:5000/detect-face',
      { image: frame },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (response.data.face) {
      boundingBoxes.push(response.data.face);
    }
  }
  
  // Promediar bounding boxes
  return averageBoundingBoxes(boundingBoxes);
}
```

### 5. Google Drive API

```javascript
// backend/lib/drive-sync.js
const { google } = require('googleapis');
const fs = require('fs');

const drive = google.drive({ version: 'v3' });

async function uploadToDrive(filePath, folderId, fileName) {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = { name: fileName, parents: [folderId] };
  const media = { body: fs.createReadStream(filePath) };

  const file = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, webViewLink',
  });

  return {
    driveId: file.data.id,
    driveUrl: file.data.webViewLink,
  };
}
```

---

## Frontend Architecture (React)

### Component Hierarchy

```
App.jsx
├── DownloadPanel
│   ├── URLInput
│   └── PreviewWindow
├── TimelineEditor
│   ├── Waveform (optional)
│   ├── Scrubber
│   └── TrimHandles
├── CanvasEditor
│   ├── VideoCanvas
│   ├── CropOverlay
│   └── EffectsPanel
│       ├── BrightnessSlider
│       ├── ContrastSlider
│       └── SaturationSlider
├── ShapesPanel
│   ├── ShapesList
│   ├── ShapeProperties
│   │   ├── FillColor
│   │   ├── Stroke
│   │   ├── Shadow
│   │   └── Text
│   └── TimelineSyncEditor
├── AIAnalyzer
│   ├── AnalyzeButton
│   ├── TranscriptionViewer
│   └── CitesList
│       └── CiteCard (approve/reject/edit)
├── OrientationConverter
│   ├── ModeSelector (Manual/Auto)
│   └── CropTool / FaceDetector
├── ExportDialog
│   ├── DestinationSelector
│   ├── FormatOptions
│   └── ProgressBar
└── FileManager
    └── RecentExports
```

### State Management (Hooks)

```javascript
// frontend/src/hooks/useVideoEditor.js
import { useState, useCallback } from 'react';

export function useVideoEditor(videoPath) {
  const [edits, setEdits] = useState({
    trim: { start: 0, end: null },
    crop: null,
    effects: { brightness: 0, contrast: 0, saturation: 0 },
    shapes: [],
    outputDimensions: '1080x1920',
  });

  const updateTrim = useCallback((start, end) => {
    setEdits(prev => ({ ...prev, trim: { start, end } }));
  }, []);

  const addShape = useCallback((shape) => {
    setEdits(prev => ({
      ...prev,
      shapes: [...prev.shapes, { id: uuid(), ...shape }]
    }));
  }, []);

  const updateEffect = useCallback((effect, value) => {
    setEdits(prev => ({
      ...prev,
      effects: { ...prev.effects, [effect]: value }
    }));
  }, []);

  return { edits, updateTrim, addShape, updateEffect };
}
```

### Axios Setup

```javascript
// frontend/src/utils/api.js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
});

// Interceptor para errores
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    throw error;
  }
);

export default api;
```

---

## Electron Integration

### Main Process

```javascript
// frontend/electron/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  const isDev = require('electron-is-dev');
  const startUrl = isDev
    ? 'http://localhost:3000'  // Dev server
    : `file://${path.join(__dirname, '../build/index.html')}`; // Build

  mainWindow.loadURL(startUrl);
  if (isDev) mainWindow.webDevTools.openDevTools();
}

app.on('ready', createWindow);
```

### IPC (Inter-Process Communication)

```javascript
// frontend/electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
  openPath: (path) => ipcRenderer.invoke('dialog:openPath', path),
  saveFile: (data, path) => ipcRenderer.invoke('file:save', data, path),
});
```

---

## Data Flow Examples

### Download Video Flow

```
User Input (URL)
    ↓
POST /api/download
    ↓
Backend: yt-dlp downloads
    ↓
Backend: FFprobe gets metadata
    ↓
Response: {videoPath, metadata}
    ↓
Frontend: Display preview + timeline
    ↓
Ready for editing
```

### Edit & Render Flow

```
User edits:
  - Trim timeline (start: 5s, end: 60s)
  - Crop image (x: 100, y: 50, w: 800, h: 600)
  - Brightness: +20
  - Add shape: black box, opacity 0.7, time 10s-15s
    ↓
POST /api/render-final (edits JSON)
    ↓
Backend: FFmpeg with complex filter
    ↓
Response: {jobId, status: 'rendering', progress: 0}
    ↓
Frontend: Poll GET /api/render-status/:jobId every 2s
    ↓
When progress === 100:
    ↓
POST /api/upload-drive + POST /api/export-local
    ↓
Video in Drive + Local disk
```

---

## Performance Considerations

### Frontend
- Real-time preview via thumbnail (not full video)
- Lazy load components
- Canvas resizing with debounce

### Backend
- FFmpeg render timeout: 10 minutes
- Concurrent jobs limit: 2 (avoid resource exhaustion)
- Temp file cleanup after 24 hours

### Storage
- Videos kept in `/temp-videos` only during editing
- Deleted after export
- Google Drive as permanent storage

---

## Error Handling

### Backend

```javascript
// Example error handling
async function downloadVideo(url) {
  try {
    // Validate URL
    new URL(url);

    // Download
    const videoPath = await yt_dlp.download(url);

    // Get metadata
    const metadata = await ffprobe(videoPath);

    return { videoPath, metadata };
  } catch (err) {
    if (err.message.includes('Invalid URL')) {
      return { error: 'URL inválida', status: 400 };
    } else if (err.message.includes('No video found')) {
      return { error: 'No se encontró video en esa URL', status: 400 };
    } else {
      return { error: err.message, status: 500 };
    }
  }
}
```

### Frontend

```javascript
// React error boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Algo salió mal. Por favor, recarga la página.</div>;
    }
    return this.props.children;
  }
}
```

---

## Security Considerations

- ✅ Service Account para Google Drive (no OAuth manual)
- ✅ API keys en `.env` (nunca en git)
- ✅ Sanitize file paths antes de FFmpeg
- ✅ CORS configurado en Express
- ✅ Rate limiting en endpoints pesados
- ✅ Validar URLs antes de descargar

---

## Deployment

### Development
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# (Optional) Terminal 3: Electron
cd frontend && npm run electron-dev
```

### Production (Railway)
```bash
# Build
npm run build:all

# Deploy
git push origin main
# Railway auto-detects package.json, builds, deploys
```

### Local Build (Electron)
```bash
# Build and sign
cd frontend
npm run electron-build

# Output: dist/video-downloader-*.dmg (Mac)
#         dist/video-downloader-*.exe (Win)
```

---

**Última actualización**: 2026-09-01
