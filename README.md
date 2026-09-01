# 🎬 Video Downloader & Editor

**Aplicación independiente** para descargar, editar y exportar videos desde cualquier URL hacia Google Drive y almacenamiento local.

Pensada para alimentar las carpetas de **Farándula** (famosos, citas, adicionales) con videos editados, recortados, ajustados a orientación vertical, y enriquecidos con sugerencias de citas mediante análisis de IA del audio.

---

## 🎯 Visión General

```
URL (YouTube, TikTok, IG, etc.)
        ↓
   [DESCARGAR]
        ↓
   [EDITAR] → Timeline + Canvas + Formas + Efectos
        ↓
  [IA ANALIZA] → Whisper (transcribe) + Gemini (sugiere citas)
        ↓
[EXPORTAR] → MP4 (resolución flexible) → Drive + Local
```

### ✨ Features Clave

- ✅ **Descarga universal**: cualquier URL con video (yt-dlp)
- ✅ **Editor visual potente**:
  - Timeline para recortar audio/video
  - Canvas con crop, pan, zoom (sin distorsión)
  - Efectos: brillo, contraste, saturación
  - **Recuadros/formas** sincronizadas con timeline (aparecen/desaparecen)
- ✅ **IA análisis de audio** (botón, no automático):
  - Whisper transcribe
  - Gemini sugiere citas + cambios de tema
- ✅ **Conversión H→V**:
  - Manual: usuario controla crop/pan
  - Automático: MediaPipe detecta cara/hombros
- ✅ **Almacenamiento dual**:
  - Google Drive (Videos_Famosos_Carpetas)
  - Local (filesystem, sin DB)
- ✅ **Web app + Desktop app** (un codebase):
  - React en navegador
  - Electron para Mac/Windows/Linux

---

## 📦 Stack

| Capa | Tecnología |
|------|-----------|
| **Backend** | Node.js + Express (Railway) |
| **Frontend** | React + Electron |
| **Video** | FFmpeg + FFprobe |
| **Audio** | Whisper (OpenAI) + Gemini API |
| **Detección** | MediaPipe (caras/hombros) |
| **Descarga** | yt-dlp |
| **Storage** | Google Drive API + filesystem |

---

## 🚀 Quick Start

### Requisitos
- Node.js 18+
- Git
- Google Drive credenciales (service account JSON)
- API keys:
  - `GEMINI_API_KEY` (Google Gemini)
  - `OPENAI_API_KEY` (Whisper)

### Setup Local

```bash
# 1. Clonar repo
git clone https://github.com/jorucarbus/video-downloader.git
cd video-downloader

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus API keys + Drive credentials

# 4. Backend (Terminal 1)
npm run server

# 5. Frontend (Terminal 2)
npm run dev

# 6. (Opcional) Desktop app
npm run electron-dev
```

---

## 📁 Estructura del Proyecto

```
video-downloader/
├── backend/
│   ├── server.js              # Express app principal
│   ├── lib/
│   │   ├── downloader.js      # yt-dlp wrapper
│   │   ├── ffmpeg-renderer.js # FFmpeg filter builder + render
│   │   ├── whisper.js         # Transcripción con Whisper
│   │   ├── gemini.js          # Análisis de citas (Gemini)
│   │   ├── drive-sync.js      # Google Drive API
│   │   └── mediapipe.js       # Face detection wrapper
│   ├── routes/
│   │   └── api.js             # Endpoints /api/*
│   ├── temp-videos/           # Videos temporales
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── DownloadPanel.jsx      # Input URL
│   │   │   ├── TimelineEditor.jsx     # Recorte timeline
│   │   │   ├── CanvasEditor.jsx       # Crop, pan, zoom, effects
│   │   │   ├── ShapesPanel.jsx        # Crear recuadros
│   │   │   ├── AIAnalyzer.jsx         # Whisper + Gemini
│   │   │   ├── OrientationConverter.jsx # H→V
│   │   │   ├── ExportDialog.jsx       # Exportar
│   │   │   └── FileManager.jsx        # Historial
│   │   ├── hooks/
│   │   │   ├── useVideoEditor.js
│   │   │   └── useDriveSync.js
│   │   ├── styles/
│   │   │   └── App.css
│   │   └── index.js
│   ├── electron/
│   │   └── main.js            # Electron entry point
│   ├── electron-builder.config.js
│   └── package.json
│
├── .env.example               # Template de env vars
├── .gitignore
├── README.md                  # Este archivo
├── ARCHITECTURE.md            # Detalles técnicos
├── ROADMAP.md                 # Phases 1-7
└── package.json               # Workspace root

```

---

## 📋 Roadmap (10 Semanas)

### **Phase 1: Core Infra** (Semana 1-2)
- [ ] Setup Express + React + Electron boilerplate
- [ ] Google Drive API (read/write)
- [ ] yt-dlp integration
- [ ] FFmpeg básico
- [ ] UI skeleton (6 paneles)

### **Phase 2: Video Editor** (Semana 3-4)
- [ ] Timeline component
- [ ] Canvas + preview
- [ ] Crop, pan, zoom
- [ ] Effects sliders

### **Phase 3: Shapes & Effects** (Semana 5)
- [ ] Recuadros dibujables
- [ ] Timeline sync para formas
- [ ] Renderizado en FFmpeg

### **Phase 4: IA Analysis** (Semana 6)
- [ ] Whisper integration
- [ ] Gemini para citas
- [ ] UI de sugerencias

### **Phase 5: Orientation** (Semana 7)
- [ ] MediaPipe detection
- [ ] Manual vs automático

### **Phase 6: Export** (Semana 8)
- [ ] Export dialog
- [ ] Renderizado final
- [ ] Drive + local sync

### **Phase 7: Polish** (Semana 9-10)
- [ ] Electron builds (Mac/Win/Linux)
- [ ] Railway deploy
- [ ] Testing
- [ ] Performance

---

## 🔗 Integration con Farándula

Esta app **alimenta** el pipeline de Farándula:

```
Video Downloader
      ↓ (exporta clips editados)
Videos_Famosos_Carpetas/
      ↓ (Farándula descubre automáticamente)
Farándula Pipeline
      ↓
Videos finales en TikTok
```

Carpetas objetivo:
- `Videos_Famosos_Carpetas/[Famoso A]/` — clips de celebridades
- `Videos_Famosos_Carpetas/Citas/` — fragmentos de citas
- `Videos_Famosos_Carpetas/Adicionales/` — otros clips

---

## 💾 Variables de Entorno

Copia `.env.example` a `.env` y completa:

```bash
# Gemini API
GEMINI_API_KEY=tu_gemini_key_aqui

# OpenAI (Whisper)
OPENAI_API_KEY=tu_openai_key_aqui

# Google Drive
GOOGLE_DRIVE_SERVICE_ACCOUNT={"type":"service_account",...}
GOOGLE_DRIVE_VIDEOS_FOLDER_ID=tu_folder_id

# Railway / Local
PORT=3000
NODE_ENV=development
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E (Playwright)
npm run test:e2e

# Dev con hot reload
npm run dev

# Build for production
npm run build

# Electron dev
npm run electron-dev
npm run electron-build
```

---

## 📚 Documentación Complementaria

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Detalles técnicos, APIs, flows
- **[ROADMAP.md](./ROADMAP.md)** — Phases detalladas + checklist
- **[PLAN.md](./PLAN.md)** — Plan original (phases, features, decisiones)

---

## 🤝 Desarrollo Remoto

Estructura pensada para trabajar desde **varios lugares**:

### Desde la oficina (aquí) / Casa

1. **Pull** antes de empezar
   ```bash
   git pull origin main
   ```

2. **Crea rama feature**
   ```bash
   git checkout -b feature/timeline-editor
   ```

3. **Commit + Push**
   ```bash
   git add .
   git commit -m "feat: timeline scrubber"
   git push origin feature/timeline-editor
   ```

4. **PR en GitHub** → review → merge

### Sincronización de .env

⚠️ **NO** commitear `.env` (está en `.gitignore`)

Opciones:
- Mantener copia local en `~/.video-downloader/.env`
- O sincronizar via Google Drive (carpeta privada)

---

## 🐛 Troubleshooting

### FFmpeg no se ejecuta en Railway
→ Fallback a workers Electron locales (máquinas casa + trabajo)

### Descarga lenta en Railway
→ Dejar yt-dlp local en Electron, API solo orquesta

### Errores de Google Drive
→ Verificar credenciales en `.env` + permisos de Drive

---

## 📞 Notas

- **Respaldo de estado**: Si Railway redeploya, Electron sigue funcionando localmente
- **Historial**: Carpetas como "BD" (sin SQLite)
- **Preview**: Real-time mediante FFmpeg → thumbnails
- **Rendering**: < 5 minutos para 1080×1920 @ 30fps

---

## 📄 License

(Pendiente definir)

---

**Última actualización**: 2026-09-01  
**Status**: 🔵 En planeación → listo para Phase 1 (Core Infra)

---

### 🚀 Próximas acciones

- [ ] Pushear repo a GitHub
- [ ] Crear ramas: `main` + `develop`
- [ ] Setup CI/CD (GitHub Actions)
- [ ] Phase 1: Core Infra boilerplate
