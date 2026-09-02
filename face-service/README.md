# Face Service (local)

Microservicio Python + MediaPipe para detección de rostro, usado solo por
la conversión H→V automática. Corre en tu máquina local (RTX 3070 en casa,
Mac Studio M2 Ultra en trabajo) — **nunca en Railway** (sin GPU, CPU compartida,
sería impracticable — ver decisión de arquitectura en memoria del proyecto).

## Setup

```bash
cd face-service
python -m venv venv
source venv/bin/activate  # o venv\Scripts\activate en Windows
pip install -r requirements.txt

# Modelo de detección (no versionado, ~230KB):
mkdir -p models
curl -sL "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite" -o models/blaze_face_short_range.tflite

python app.py
```

⚠️ **`requirements.txt` no fija `mediapipe==0.10.14`** como decía la primera versión de este
archivo — esa versión no existe para Python 3.13. Usa `mediapipe==0.10.35` (última con soporte
razonable). Además, la API legacy `mp.solutions.face_detection` **no existe** en ninguna versión
disponible para Python 3.13 — `app.py` usa la Tasks API nueva (`mediapipe.tasks.python.vision.
FaceDetector`), que requiere el modelo `.tflite` descargado arriba.

Sirve en `http://localhost:5000/detect-face`. El backend Node (`backend/lib/mediapipe.js`)
le apunta vía `FACE_SERVICE_URL` (default: `http://localhost:5000/detect-face`).

## Notas

- Sin este servicio corriendo, el botón "Detectar rostro" en OrientationConverter falla.
- El modo Manual (crop/pan a mano) funciona sin este servicio.
- Tracking de pose/manos (stickers que sigan puntos) fue descartado — decisión de proyecto,
  demasiado costoso para el caso de uso (stickers son overlay fijo, ver StickersPanel.jsx).
