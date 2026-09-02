# 🎬 Video Downloader & Editor

**Aplicación independiente** para descargar, editar y exportar videos desde cualquier URL hacia Google Drive y almacenamiento local.

Pensada para alimentar las carpetas de **Farándula** (famosos, citas, adicionales) con videos editados, recortados, ajustados a orientación vertical, censurados (blur/recuadros), enriquecidos con stickers PNG fijos, y con sugerencias de citas mediante análisis de IA del audio. Incluye **batch refine**: editar y reemplazar en lote videos ya publicados en Drive sin duplicarlos.

---

## 🚦 Estado actual (2026-09-02)

**Rama activa: `feature/phase1-core-infra`** (no mergeada a `main` todavía).
Repo clonado en **`E:\claude pro apps\video-downloader`** — **no en D:** (ver sección Troubleshooting, exFAT rompe symlinks de npm workspaces).

| Fase | Estado |
|---|---|
| Phase 1 (Core Infra) | ✅ Completa y verificada (descarga, render, batch refine contra Drive real) |
| Phase 2 (Editor) | 🟡 Parcial — preview funciona (fix reciente), timeline/canvas/effects básicos ok |
| Phase 3 (Shapes/Censura) | 🟡 Backend listo y verificado (blur+drawtext), drag-to-position en canvas pendiente |
| Phase 4 (IA — Whisper/Gemini) | 🔴 **Bloqueada: cuenta OpenAI sin créditos**, código listo |
| Phase 5 (Orientación H→V) | ✅ Completa y verificada (face-service + detect-face end-to-end) |
| Phase 6 (Export/Storage) | ✅ Completa y verificada (upload-drive, export-local, recent-exports) |
| Phase 7 (Electron/Deploy) | 🔴 Sin empezar — Electron GUI sin probar a propósito, Railway sin desplegar a propósito |

Detalle completo, con qué se verificó y cómo, en **[ROADMAP.md](./ROADMAP.md)**.

### 🔴 Bloqueado, necesita acción humana
1. **Créditos OpenAI agotados** (`credit_balance_exhausted`) — recargar en
   [platform.openai.com/settings/organization/billing](https://platform.openai.com/settings/organization/billing/)
   para poder probar Whisper/Gemini (Phase 4).
2. **YouTube/TikTok bloquean la descarga por anti-bot** — yt-dlp actualizado no alcanza, necesita
   cookies de sesión real (`--cookies-from-browser` falla con DPAPI si el navegador está abierto:
   cerrarlo primero, o exportar cookies a archivo Netscape).
3. **Electron (GUI)** — nunca lanzado en esta máquina a propósito (evitar abrir ventana visible
   sin supervisión). Backend/frontend web sí están 100% probados.

---

## 🎯 Visión General

```
URL (YouTube, TikTok, IG, etc.)
        ↓
   [DESCARGAR]
        ↓
   [EDITAR] → Timeline + Canvas + Formas/Censura + Stickers + Efectos
        ↓
  [IA ANALIZA] → Whisper (transcribe) + Gemini (sugiere citas)      [bloqueado, sin créditos]
        ↓
[EXPORTAR] → MP4 → Drive + Local

     — o en lote —

Drive (carpeta con videos ya publicados)
        ↓
   [BATCH REFINE] → listar → editar → reemplazar (mismo archivo, sin duplicar)
```

### ✨ Features Clave

- ✅ **Descarga universal**: cualquier URL con video (yt-dlp) — verificado con URL directa;
  YouTube/TikTok bloqueados por anti-bot, ver arriba
- ✅ **Editor visual**:
  - Timeline para recortar audio/video
  - Canvas con preview real (HTTP, no `file://`) + efectos (brillo/contraste/saturación)
  - **Recuadros/censura** (blur, bloque opaco) sincronizados con timeline
  - **Stickers PNG fijos** (overlay manual, **sin tracking de puntos** — descartado por costo,
    ver ARCHITECTURE.md)
- 🔴 **IA análisis de audio** (Whisper + Gemini) — código listo, bloqueado por créditos OpenAI
- ✅ **Conversión H→V automática**: face-service local (MediaPipe) detecta rostro y centra el
  crop — corre en tu máquina (RTX 3070 / Mac Studio M2 Ultra), nunca en Railway
- ✅ **Almacenamiento dual**: Google Drive (OAuth) + local (filesystem, sin DB)
- ✅ **Batch Refine**: edita y reemplaza en lote videos ya subidos a una carpeta de Drive
  (mismo `fileId`, sin duplicar) — verificado end-to-end con Drive real
- 🟡 **Web app + Desktop app** (un codebase): web (React+Vite) probada a fondo; Electron
  construido pero sin probar la ventana en vivo

---

## 📦 Stack

| Capa | Tecnología |
|------|-----------|
| **Backend** | Node.js + Express |
| **Frontend** | React + Vite + Electron |
| **Video** | FFmpeg + FFprobe |
| **Audio** | Whisper (OpenAI) + Gemini API |
| **Detección de rostro** | MediaPipe Tasks API (microservicio Python local, `face-service/`) |
| **Descarga** | yt-dlp |
| **Storage** | Google Drive API (OAuth) + filesystem |

---

## 🚀 Quick Start

### Requisitos
- Node.js 18+ (probado con Node 24)
- Git
- Python 3.11+ (para `face-service/`, opcional si no usas H→V automático)
- yt-dlp instalado (`pip install yt-dlp`) — ver nota de PATH abajo
- Credenciales OAuth de Google (client ID/secret/refresh token) con acceso a tu Drive —
  **reusa las de otro proyecto tuyo si ya tienes uno**, no hace falta un service account nuevo
- API keys: `GEMINI_API_KEY`, `OPENAI_API_KEY`

### Setup Local

```bash
# 1. Clonar repo — IMPORTANTE: en un disco NTFS, no exFAT (ver Troubleshooting)
git clone https://github.com/jorucarbus/video-downloader.git
cd video-downloader
git checkout feature/phase1-core-infra   # rama activa, no main

# 2. Instalar dependencias (root, hoistea a backend + frontend vía npm workspaces)
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env: Gemini, OpenAI, OAuth Drive (client_id/secret/refresh_token), folder ID,
# y YTDLP_PATH si yt-dlp no está en el PATH del sistema (común en Windows con pip install)

# 4. (Opcional) face-service, para H→V automático
cd face-service
pip install -r requirements.txt
mkdir -p models
curl -sL "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite" -o models/blaze_face_short_range.tflite
python app.py   # puerto 5000, dejar corriendo en su propia terminal
cd ..

# 5. Backend (Terminal 1)
npm run server   # puerto 3000

# 6. Frontend (Terminal 2)
npm run dev      # puerto 5173, Vite

# 7. (Opcional, sin probar en esta máquina) Desktop app
npm run electron-dev
```

**Nota Windows**: si `npm install` falla con `EISDIR`/`symlink`, estás en un disco exFAT —
mudar el repo a un disco NTFS (`Get-Volume | Select DriveLetter, FileSystemType` para chequear).

---

## 📁 Estructura del Proyecto

```
video-downloader/
├── backend/
│   ├── server.js              # Express app — sirve /api/* y /media/* (preview HTTP)
│   ├── env.js                 # Carga .env desde la raíz (primer import de server.js)
│   ├── lib/
│   │   ├── downloader.js      # yt-dlp wrapper (YTDLP_PATH opcional)
│   │   ├── ffmpeg-renderer.js # FFmpeg filter builder + render (crop/effects/shapes/stickers)
│   │   ├── whisper.js         # Transcripción con Whisper
│   │   ├── gemini.js          # Análisis de citas (Gemini)
│   │   ├── drive-sync.js      # Google Drive API (OAuth) — incl. replace/list para batch
│   │   ├── mediapipe.js       # Cliente del face-service local
│   │   └── local-export.js    # Export local + historial en memoria
│   ├── routes/
│   │   └── api.js             # Endpoints /api/*
│   └── temp-videos/           # Videos temporales (gitignored)
│
├── face-service/               # Microservicio Python — MediaPipe Tasks API
│   ├── app.py
│   ├── requirements.txt
│   └── models/                 # .tflite descargado aparte, gitignored
│
├── frontend/
│   ├── index.html
│   ├── src/
│   │   ├── App.jsx              # 3 tabs: Editor / Batch Refine / Historial
│   │   ├── components/
│   │   │   ├── DownloadPanel.jsx
│   │   │   ├── TimelineEditor.jsx
│   │   │   ├── CanvasEditor.jsx       # Preview HTTP (no file://)
│   │   │   ├── ShapesPanel.jsx        # Recuadros + censura
│   │   │   ├── StickersPanel.jsx      # PNG overlay fijo
│   │   │   ├── AIAnalyzer.jsx
│   │   │   ├── OrientationConverter.jsx
│   │   │   ├── ExportDialog.jsx
│   │   │   ├── FileManager.jsx        # Historial
│   │   │   └── BatchEditor.jsx        # Refine en lote contra Drive
│   │   ├── hooks/
│   │   │   ├── useVideoEditor.js
│   │   │   └── useDriveSync.js
│   │   └── utils/api.js
│   ├── electron/
│   │   ├── main.js
│   │   └── preload.cjs         # .cjs porque package.json tiene "type":"module"
│   └── electron-builder.config.js
│
├── .env.example
├── README.md                  # Este archivo
├── ARCHITECTURE.md            # Detalles técnicos, APIs, flows
└── ROADMAP.md                 # Checklist detallado por fase, con qué está verificado y cómo
```

---

## 💾 Variables de Entorno

Copia `.env.example` a `.env` y completa:

```bash
# Gemini API
GEMINI_API_KEY=tu_gemini_key_aqui

# OpenAI (Whisper)
OPENAI_API_KEY=tu_openai_key_aqui

# Google Drive (OAuth — reusa credenciales de otro proyecto tuyo si tienes uno)
GOOGLE_OAUTH_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=tu_client_secret
GOOGLE_OAUTH_REFRESH_TOKEN=tu_refresh_token
GOOGLE_DRIVE_VIDEOS_FOLDER_ID=tu_folder_id_raiz

# Server
PORT=3000
NODE_ENV=development

# yt-dlp: solo si no está en el PATH del sistema
YTDLP_PATH=
```

⚠️ **Ya no usa Service Account JSON** (como pedía una versión anterior de este README) — el
proyecto real de Farándula usa OAuth, así que este proyecto reusa esas mismas credenciales en
vez de crear un service account nuevo.

---

## 📋 Roadmap

Ver **[ROADMAP.md](./ROADMAP.md)** para el checklist completo por fase, con qué está verificado,
cómo se verificó, y qué falta. Resumen arriba en "Estado actual".

---

## 🔗 Integration con Farándula

Esta app **alimenta** el pipeline de Farándula:

```
Video Downloader
      ↓ (exporta clips editados, o refina en lote los ya publicados)
Videos_Famosos_Carpetas/ (= Redes_Canales, raíz compartida)
      ↓ (Farándula descubre automáticamente)
Farándula Pipeline
      ↓
Videos finales en TikTok
```

Carpetas objetivo (subcarpetas de la raíz configurada en `GOOGLE_DRIVE_VIDEOS_FOLDER_ID`):
- `Videos_Famosos_Carpetas/[Famoso A]/` — clips de celebridades
- `Videos_Famosos_Carpetas/Citas/` — fragmentos de citas
- `Videos_Famosos_Carpetas/Adicionales/` — otros clips

---

## 🐛 Troubleshooting

### `npm install` falla con `EISDIR` / `symlink`
El disco donde clonaste es **exFAT**, que no soporta symlinks (necesarios para npm workspaces).
Mudar el repo a un disco NTFS. Chequear con PowerShell:
```powershell
Get-Volume | Where-Object { $_.DriveLetter } | Select-Object DriveLetter, FileSystemType
```

### El preview de video no carga (`ERR_FILE_NOT_FOUND` o similar)
Ya arreglado (2026-09-02) — si ves esto en una rama vieja, falta el fix de `previewUrl` +
`/media/*` en `server.js`/`CanvasEditor.jsx`. Actualizar a `feature/phase1-core-infra` o más nuevo.

### `yt-dlp` da `spawn yt-dlp ENOENT`
No está en el PATH. Encuentra la ruta real (`pip show yt-dlp` no la da directo — busca en
`site-packages/../Scripts/yt-dlp.exe` en Windows) y ponla en `YTDLP_PATH` del `.env`.

### YouTube da 429 / "Sign in to confirm you're not a bot"
Anti-bot de YouTube, no depende de la versión de yt-dlp. Necesita cookies de sesión:
`--cookies-from-browser edge` (o `chrome`) — si da error de DPAPI, cerrar el navegador primero.

### TikTok falla con "Unexpected response from webpage request"
Necesita `curl_cffi` (`pip install curl_cffi`) para impersonar TLS. Aun con eso puede fallar en
videos puntuales — sin causa raíz confirmada todavía, pendiente de más pruebas.

### face-service: `AttributeError: module 'mediapipe' has no attribute 'solutions'`
La API legacy de MediaPipe no existe en las versiones disponibles para Python 3.13+. Usar
`mediapipe==0.10.35` (no `0.10.14`, no existe para 3.13) — `face-service/app.py` ya usa la Tasks
API nueva (`FaceDetector`), que requiere el modelo `.tflite` (ver Quick Start paso 4).

### Whisper da `ECONNRESET`
Probablemente NO es un bug de red — el SDK oficial de OpenAI cierra la conexión abruptamente
cuando la cuenta no tiene créditos, en vez de devolver el error 429 limpio. Probar con
axios+form-data para ver el mensaje real, o simplemente revisar el balance de la cuenta en
platform.openai.com.

### FFmpeg no se ejecuta en Railway / Descarga lenta en Railway
Sin desplegar todavía a propósito (ver "Estado actual"). Cuando se despliegue: yt-dlp y
face-service **no deben correr en Railway** (anti-bot más agresivo con IPs de datacenter, y
face-service necesita CPU/GPU dedicada) — dejar esas dos tareas en Electron local, Railway solo
orquesta.

---

## 📞 Notas de Arquitectura

- **Sin tracking de puntos para stickers** — decisión de proyecto: el costo (CPU ~30min/min de
  video, GPU ~2min/min) no justificaba la complejidad. Stickers son overlay fijo (posición manual).
- **Face tracking sí se mantiene**, pero solo para H→V automático, vía `face-service/` local.
- **Censura en vez de apelar a TikTok**: preferencia explícita del usuario — blur/bloque directo
  sobre contenido que la moderación automática de TikTok suele confundir.
- **Historial**: en memoria (`local-export.js`), sin DB — se pierde al reiniciar el server.
- **Batch Refine**: mismo `fileId` al reemplazar en Drive — no duplica ni rompe enlaces existentes.

---

## 📄 License

(Pendiente definir)

---

**Última actualización**: 2026-09-02
**Status**: 🟢 Phase 1/5/6 verificadas end-to-end · 🔴 Phase 4 bloqueada por créditos OpenAI · 🟡 Electron sin probar

---

### 🚀 Próximas acciones (en orden de prioridad)

- [ ] **Recargar créditos OpenAI** → probar Whisper/Gemini real (Phase 4)
- [ ] Cerrar navegador → extraer cookies → probar descarga real de YouTube/TikTok
- [ ] Probar Electron (ventana visible, necesita supervisión del usuario)
- [ ] Drag-to-position de recuadros directo en el canvas (hoy son inputs numéricos)
- [ ] Merge `feature/phase1-core-infra` → `main` cuando el usuario confirme que todo funciona
- [ ] Decidir despliegue a Railway (backend orquesta; yt-dlp/face-service quedan locales)
