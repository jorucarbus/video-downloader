# 🗺️ Roadmap Video Downloader

## Timeline: 10 semanas (~70 días efectivos)

---

## 📌 Phase 1: Core Infrastructure (Semana 1-2)

**Objetivo**: Boilerplate funcional + APIs básicas

### Backend
- [x] **Express server** en `backend/server.js`
  - [x] CORS + middleware básico
  - [x] Health endpoint (`GET /health`)
  - [x] Error handling global

- [x] **Google Drive API integration** (`backend/lib/drive-sync.js`)
  - [x] Auth con service account
  - [x] Listar carpetas (Videos_Famosos_Carpetas)
  - [x] Upload/download básico
  - [x] Replace (overwrite) — para batch refine de videos ya publicados

- [x] **yt-dlp wrapper** (`backend/lib/downloader.js`)
  - [x] Detectar tipo de URL (valida con `new URL()`)
  - [x] Descargar a `/temp-videos/`
  - [ ] Manejo de errores (pendiente: casos específicos yt-dlp, ver Testing)

- [x] **FFmpeg wrapper** (`backend/lib/ffmpeg-renderer.js`)
  - [x] FFprobe para metadata (duración, fps, resolución)
  - [x] Render básico + filtros (crop, effects, shapes, censura, stickers fijos)

- [x] **Rutas API** (`backend/routes/api.js`)
  - [x] `POST /api/download` — descargar video
  - [x] `POST /api/render-final` — renderizar video con ediciones
  - [x] `GET /health` — estado del servidor

### Frontend
- [x] **React + Electron setup** (Vite + electron-builder, no create-react-app/electron-forge)
  - [x] Boilerplate
  - [x] Estructura de componentes

- [x] **UI skeleton** (8 paneles — se agregaron StickersPanel y BatchEditor sobre los 6 originales)
  - [x] DownloadPanel (input URL, funcional)
  - [x] TimelineEditor (funcional)
  - [x] CanvasEditor (funcional)
  - [x] ShapesPanel (funcional — recuadros + censura)
  - [x] StickersPanel (nuevo — PNG overlay fijo, sin tracking)
  - [x] AIAnalyzer (funcional)
  - [x] OrientationConverter (funcional — manual + auto vía face-service)
  - [x] ExportDialog (funcional)
  - [x] BatchEditor (nuevo — refine lote en Drive con replace)

- [x] **Conexión frontend ↔ backend**
  - [x] Axios setup (`frontend/src/utils/api.js`)
  - [x] Enviar URL a `/api/download`
  - [x] Mostrar preview de video descargado

### Testing
- [x] Backend `/health` responde 200 (verificado 2026-09-01)
- [x] Frontend renderiza los 8 paneles sin errores de consola (verificado 2026-09-01)
- [x] Descargar video real (URL directa) → archivo en disco + metadata correcta vía FFprobe
      (verificado 2026-09-01: 5.76s, 1920x1080, 30fps)
- [x] **Descargar de TikTok — RESUELTO 2026-09-03**: faltaba un runtime JS (yt-dlp lo pide
      explícitamente en el error: "No supported JavaScript runtime"). Instalado **Deno**
      (`winget install DenoLand.Deno`) — TikTok resuelve su challenge JS solo con Deno en el
      PATH, sin cookies ni curl_cffi. **Verificado vía la API real de la app**
      (`POST /api/download`), no solo CLI: video real descargado, 10.6s, 720x1280 vertical,
      metadata correcta. Requisito nuevo documentado en README (Deno debe estar instalado).
- [ ] **YouTube sigue bloqueado** — no es solo cookies. Con cookies de Firefox (las únicas
      extraíbles sin error, ver abajo) YouTube pide además un "Visitor Data"/PO Token de sesión
      real y logueada — el perfil de Firefox disponible en esta máquina no está logueado en
      YouTube. **Edge/Chrome dan `Failed to decrypt with DPAPI`** incluso con el navegador
      cerrado — no es el problema de "navegador abierto" que se pensó antes, es la App-Bound
      Encryption que Chromium introdujo (~2024) para cookies, sin salida limpia por CLI.
      **Camino real pendiente**: usar una extensión de navegador tipo "Get cookies.txt LOCALLY"
      para exportar cookies.txt manualmente desde una sesión de Chrome/Edge SÍ logueada en
      YouTube (bypassa DPAPI porque la extensión lee cookies ya desencriptadas dentro del
      navegador) — requiere acción del usuario, no se puede automatizar más desde acá.
- [x] Renderizar video con ediciones (trim + effects) → MP4 válido H264/AAC, duración exacta
      (verificado 2026-09-01: recorte 0.5s→4s dio 3.500000s exacto)
- [x] **Batch refine end-to-end contra Drive real** (verificado 2026-09-02): carpeta temporal →
      subir → listar → descargar → renderizar (trim+censura) → reemplazar (mismo fileId,
      modifiedTime y tamaño cambiados) → limpieza. El caso de uso principal del proyecto
      (refinar videos ya publicados en Drive sin duplicar) funciona de punta a punta.

**Fin de Phase**: Video descargado → preview en UI

---

## 🎬 Phase 2: Video Editor Core (Semana 3-4)

**Objetivo**: Editor visual funcional (sin IA aún)

### Components
- [ ] **TimelineEditor** (`frontend/src/components/TimelineEditor.jsx`)
  - [ ] Waveform display (opcional)
  - [ ] Scrubber (play/pause/seek)
  - [ ] Trim handles (inicio/final)
  - [ ] Mostrar duración actual/total

- [x] **CanvasEditor** (`frontend/src/components/CanvasEditor.jsx`)
  - [x] Preview del video — **bug real encontrado y arreglado 2026-09-02**: usaba
        `src="file://<ruta>"`, bloqueado por todos los navegadores (rompía la versión WEB
        de la app por completo, solo Electron con flags especiales lo hubiera tolerado).
        Fix: backend sirve `temp-videos/` por HTTP (`/media/*`, con `Accept-Ranges` para
        seek); `/api/download` y `/api/render-status` devuelven `previewUrl` junto al
        `videoPath`. Verificado en Browser real: `video.readyState=4`, dimensiones y
        duración correctas, requests `206 Partial Content` confirmando seek funcional.
  - [ ] Mostrar resolución + orientación actual (dato ya disponible en `metadata`, falta UI)
  - [ ] Botones para full-screen preview

- [ ] **Effect Controls**
  - [ ] Brightness slider (-100 to +100)
  - [ ] Contrast slider
  - [ ] Saturation slider
  - [ ] Preview en vivo (mediante FFmpeg thumbnails)

### Backend
- [ ] `POST /api/render-preview` — thumbnail rápida con efectos
- [ ] `POST /api/get-metadata` — info de video (duración, fps, res)

### Hooks
- [ ] `useVideoEditor` — estado de ediciones (trim, effects)
- [ ] `usePreview` — actualizar preview en tiempo real

### Testing
1. Descargar video
2. Recortar inicio: 5s, final: 55s → preview actualizado ✓
3. Cambiar brillo +20 → se ve en preview ✓
4. Play/pause en timeline ✓

**Fin de Phase**: Editor básico funcionando, recortes + efectos visuales

---

## ✨ Phase 3: Shapes & Advanced Effects (Semana 5)

**Objetivo**: Recuadros + timeline sync + renderizado con formas

### Components
- [x] **ShapesPanel** (`frontend/src/components/ShapesPanel.jsx`)
  - [x] Botón "Agregar recuadro" (agrega con posición/tamaño default, se reposiciona en canvas)
  - [ ] Inspector de propiedades:
    - [ ] Color de relleno + opacidad slider (fijo en código, sin UI todavía)
    - [ ] Borde: color, grosor, estilo (no implementado)
    - [ ] Sombra: offset, blur, color (no implementado)
    - [ ] Esquinas redondeadas (no implementado)
    - [ ] Texto: contenido, fuente, tamaño, color (campo `text.content` existe en el modelo de
          datos y FFmpeg lo renderiza vía `drawtext`, pero sin UI para editarlo todavía)
  - [x] Timeline sync: start time + end time para cada forma
  - [ ] Presets guardables ("Dark box", "Highlight yellow", etc.)

- [x] **Shape Drawing on Canvas — verificado end-to-end 2026-09-03** (Browser pane real)
  - [ ] Click en canvas → crear rectángulo (hoy se agrega desde ShapesPanel con posición
        default, no dibujando directo)
  - [x] **Drag para mover** — `CanvasEditor.jsx` renderiza cada shape como overlay absoluto
        sobre el `<video>`, escalado de píxeles reales↔pantalla (`metadata.width` vs
        `clientWidth`). Verificado: overlay en posición inicial correcta (100px reales ×
        escala = 12.8px pantalla en el viewport probado), drag de 50px/20px en pantalla movió
        el shape exactamente esa proporción en píxeles reales, con clamp a los bordes del video.
        **Resize no implementado** (solo mover, no cambiar ancho/alto arrastrando).
  - [x] Delete shape — botón ✕ en el overlay mismo (además del que ya existía en la lista)
  - [x] Múltiples formas simultáneamente — el `.map()` sobre `edits.shapes` ya lo soporta,
        cada una con su propio drag handler independiente

### Backend
- [ ] `POST /api/render-with-shapes` — FFmpeg con drawbox + drawtext
  - [ ] Generar comandos complejos de FFmpeg
  - [ ] Aplicar shapes solo en sus timeframes

### Testing
1. Crear rectángulo negro semi-transparente ✓
2. Posicionarlo sobre logo/texto en video ✓
3. Añadir texto dentro ("Logo") ✓
4. Sincronizar: aparece en segundo 5, desaparece en segundo 15 ✓
5. Renderizar → se ve en MP4 final ✓

**Fin de Phase**: Editor completo con formas sincronizadas

---

## 🤖 Phase 4: AI Analysis (Semana 6)

**Objetivo**: Análisis de audio + sugerencias de citas

### Components
- [x] **AIAnalyzer** (`frontend/src/components/AIAnalyzer.jsx`) — **verificado end-to-end
      2026-09-03** con video real (voz TTS, 2 frases con cambio de tema deliberado) vía UI real
      en Browser pane, no solo curl
  - [x] Botón "Analizar Audio & Sugerir Citas"
  - [x] Spinner mientras procesa (`{loading ? 'Analizando...' : ...}`)
  - [x] Lista de sugerencias:
    - [x] `[00:05-00:12]` Frase sugerida — formato exacto verificado (`[00:00-00:03]`)
    - [x] Botones: Aprobar, Rechazar, Editar — los 3 verificados con clicks reales, estado
          visual correcto (borde verde/rojo, opacidad)
    - [x] Timeline scrubber para previewizar cada cita — mini `<video>` con `previewUrl`
          (reusa el fix de `/media/*`), seek a `start_time`, auto-pausa en `end_time`,
          verificado: reprodujo y se detuvo exacto
  - [x] Panel para refinar timestamps — inputs numéricos + textarea de la cita, verificado
        editando `start_time` y confirmando que el cambio se refleja en la vista normal

### Backend
- [x] **Whisper integration** (`backend/lib/whisper.js`) — **verificado end-to-end 2026-09-03**
      con audio TTS real (4 frases, incl. cambio de tema deliberado)
  - [x] Extraer audio del video con FFmpeg (Whisper acepta el archivo directo, sin extracción
        previa necesaria para wav/mp3)
  - [x] Llamar API OpenAI Whisper
  - [x] Retornar transcripción con timestamps — 4 segmentos, timestamps y duración exactos

- [x] **Gemini integration** (`backend/lib/gemini.js`) — **verificado end-to-end 2026-09-03**
  - [x] Analizar transcripción
  - [x] Detectar cambios de tema — identificó correctamente el cambio de tema deliberado en
        la prueba ("Ahora vamos a hablar de otro tema completamente distinto")
  - [x] Sugerir fragmentos interesantes (5-20s) — 2 citas sugeridas, rangos coherentes
  - [x] Retornar JSON con citas — parseo correcto

- [x] Rutas API:
  - [x] `POST /api/analyze-audio` — **verificado**, transcripción real correcta
  - [ ] `POST /api/refine-cites` — usuario ajusta timestamps (no implementado)

✅ **RESUELTO (2026-09-03): créditos OpenAI recargados por el usuario.** El bloqueo de
`credit_balance_exhausted` documentado el 2026-09-02 se resolvió — Whisper y Gemini funcionan
correctamente. De paso se encontró y arregló un segundo bug real: `gemini.js` tenía hardcodeado
el modelo `gemini-1.5-pro`, que Google retiró (`404 Not Found`). Cambiado a `gemini-flash-latest`
con fallback a `gemini-3.5-flash` (alias auto-actualizable, mismo patrón que usa
farandula-video-generator — evita fijar un nombre de modelo versionado que Google puede retirar).

### Testing
1. Audio con cambio de tema deliberado ✓ (verificado 2026-09-03)
2. Whisper transcribe con timestamps exactos ✓
3. Gemini sugiere 2 citas con rangos coherentes ✓
4. Gemini detecta el cambio de tema correctamente ✓
5. Ajusta timestamps manualmente ✓ (verificado 2026-09-03, UI real en Browser pane)
6. Aprobar/Rechazar cambia estado visual ✓
7. Previsualizar reproduce el rango exacto y se detiene solo ✓

**Fin de Phase**: ✅ **Completa.** Backend y UI de IA funcionan y están verificados end-to-end,
incluida la interacción completa (aprobar/rechazar/editar/previsualizar cada cita).

---

## 🔄 Phase 5: Orientation Conversion (Semana 7)

**Objetivo**: Convertir horizontal → vertical automático + manual

### Components
- [ ] **OrientationConverter** (`frontend/src/components/OrientationConverter.jsx`)
  - [ ] Radio buttons: Manual / Automático (MediaPipe)
  - [ ] Si Manual:
    - [ ] Crop tool (dibuja rectángulo)
    - [ ] Pan controls (flechas arriba/abajo/izq/der)
    - [ ] Zoom slider (1.0 - 2.0)
  - [ ] Si Automático:
    - [ ] "Detectando cara..." spinner
    - [ ] Mostrar bounding box de cara detectada
    - [ ] Botón "Ajustar manualmente" si no detecta

- [ ] **Canvas enhancements**
  - [ ] Mostrar crop zone en rojo punteado
  - [ ] Indicador de orientación actual (H vs V)
  - [ ] Presets: "1080x1920", "1920x1080", "Custom"

### Backend
- [x] **MediaPipe wrapper** (`backend/lib/mediapipe.js`)
  - [x] Detectar caras en frames del video (vía face-service local, Tasks API)
  - [x] Calcular bounding box promedio
  - [x] Retornar coordenadas para crop

- [x] Ruta API:
  - [x] `POST /api/detect-face` — face-service (MediaPipe) analysis — **verificado end-to-end
        2026-09-02**: video de prueba (cara real, imagen Lena) → 3 frames extraídos → 100%
        confianza en cada uno → bounding box promediado correcto (x:195, y:219, 164x164)
  - [ ] `POST /api/preview-orientation` — preview con nueva orientación (pendiente)

⚠️ **Nota de instalación (2026-09-02)**: `mediapipe==0.10.14` (versión original del
`requirements.txt`) no existe para Python 3.13 — se usa `0.10.35`. Además la API legacy
`mp.solutions.face_detection` fue removida en todas las versiones disponibles para 3.13;
`face-service/app.py` se reescribió con la Tasks API (`mediapipe.tasks.python.vision.
FaceDetector`), que requiere descargar un modelo `.tflite` aparte (instrucciones en
`face-service/README.md`, no versionado en git).

### Testing
1. Video YouTube horizontal (1920x1080) ✓
2. Modo automático → detecta cara ✓
3. Canvas centra automáticamente en rostro ✓
4. Modo manual → usuario hace crop ✓
5. Preview muestra 1080x1920 sin distorsión ✓

**Fin de Phase**: H→V conversion funcionando, ambos modos

---

## 💾 Phase 6: Export & Storage (Semana 8)

**Objetivo**: Exportar video + sincronizar con Drive + local

### Components
- [ ] **ExportDialog** (`frontend/src/components/ExportDialog.jsx`)
  - [ ] Elegir destino (Drive folder):
    - [ ] Videos_Famosos_Carpetas/[Famoso]/
    - [ ] Videos_Famosos_Carpetas/Citas/
    - [ ] Videos_Famosos_Carpetas/Adicionales/
    - [ ] Carpeta personalizada
  - [ ] Elegir destino local (path input)
  - [ ] Elegir formato + dimensiones:
    - [ ] 1080x1920 (vertical default)
    - [ ] 1920x1080 (horizontal)
    - [ ] Custom (input W x H)
  - [ ] Nombre de archivo (auto + editable)
  - [ ] Botón "Renderizar & Exportar"
  - [ ] Progreso bar (0-100%)

- [ ] **FileManager** (`frontend/src/components/FileManager.jsx`)
  - [ ] Últimos videos exportados
  - [ ] Carpetas recientes
  - [ ] Abrir carpeta en Finder/Explorer

### Backend
- [x] `POST /api/render-final` — renderizado completo (verificado, ver Phase 1)
  - [x] Aplicar ediciones (trim, effects, shapes) — verificado; crop aún sin probar aislado
  - [x] Codificar a MP4 (libx264 — h264_nvenc listado como fallback en código, sin probar GPU)
  - [ ] Timeout 10 minutos (no implementado explícitamente aún)

- [x] `POST /api/upload-drive` — subir a Google Drive (llamado `upload-drive`, no
      `export-to-drive` como decía el plan original) — **verificado 2026-09-02**: subida real,
      `driveId` + `driveUrl` devueltos, archivo confirmado en Drive y limpiado después
- [x] `POST /api/export-local` — guardar localmente — **verificado 2026-09-02**: copia real de
      2.8MB, archivo confirmado en disco
- [x] `GET /api/recent-exports` — historial — **verificado**: ambos exports (drive + local)
      quedaron registrados correctamente, orden más-reciente-primero

### Testing
1. Editar video completamente ✓
2. Exportar a Drive (famoso folder) ✓
3. Guardar local (~/Descargas/) ✓
4. Renderizado < 5 min para 1080p ✓
5. MP4 se abre correctamente en VLC/QuickTime ✓
6. Sync a Google Drive completado ✓

**Fin de Phase**: Ciclo completo: descargar → editar → exportar

---

## 🎨 Phase 7: Polish & Deployment (Semana 9-10)

**Objetivo**: Electron builds + Railway deploy + testing

### Electron
- [ ] **electron-builder config**
  - [ ] DMG (Mac)
  - [ ] EXE (Windows)
  - [ ] AppImage (Linux)
  - [ ] Code signing (si aplica)

- [ ] **Auto-update**
  - [ ] Electron-updater setup
  - [ ] GitHub Releases para binarios

- [ ] **Testing Electron**
  - [ ] Funciones core en app nativa ✓
  - [ ] IPC (Electron ↔ React) ✓
  - [ ] File dialog acceso a filesystem ✓

### Web (Railway)
- [ ] **Environment setup**
  - [ ] Build pack: Node.js
  - [ ] Env vars en Railway dashboard
  - [ ] yt-dlp en railway (o fallback a local)

- [ ] **Build & Deploy**
  - [ ] `npm run build:all`
  - [ ] Test en staging
  - [ ] Deploy a producción

- [ ] **Monitoring**
  - [ ] Logs en Railway
  - [ ] Error tracking (Sentry opcional)

### Testing
- [ ] E2E: Download → Edit → Export (todo flow) ✓
- [ ] Performance: 1920x1080 video → render < 5 min ✓
- [ ] Electron app en Mac + Windows ✓
- [ ] Web en navegador + Railway ✓
- [ ] Drive sync funcionando ✓

### Documentación
- [ ] README.md completo ✓
- [ ] ARCHITECTURE.md (diagramas, APIs) ✓
- [ ] Contributing guidelines
- [ ] Troubleshooting section

### CI/CD
- [ ] GitHub Actions workflow
  - [ ] Lint + test en push
  - [ ] Build Electron en releases

---

## 📊 Summary

| Phase | Semanas | Status | Output |
|-------|---------|--------|--------|
| 1 | 1-2 | 🔵 Pending | Boilerplate + APIs básicas |
| 2 | 3-4 | 🔵 Pending | Editor visual (recortes + efectos) |
| 3 | 5 | 🔵 Pending | Formas + timeline sync |
| 4 | 6 | 🔵 Pending | IA análisis de citas |
| 5 | 7 | 🔵 Pending | H→V conversion |
| 6 | 8 | 🔵 Pending | Export + Drive sync |
| 7 | 9-10 | 🔵 Pending | Electron + deploy |

---

## 🎯 Success Criteria (MVP)

- ✅ Descargar video desde URL
- ✅ Editar timeline (recorte inicio/final)
- ✅ Ajustar imagen (crop, pan, zoom)
- ✅ Aplicar efectos (brillo, contraste, saturación)
- ✅ Crear recuadros con timeline sync
- ✅ IA sugiere citas (botón, no automático)
- ✅ Convertir horizontal → vertical sin distorsión
- ✅ Exportar MP4 a Google Drive + local
- ✅ Corre como web app + Electron app
- ✅ Performance < 5 min render en 1080p

---

**Nota**: Cada fase puede iterar/ajustarse según aprendizajes.
