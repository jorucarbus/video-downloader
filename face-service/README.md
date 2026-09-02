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
python app.py
```

Sirve en `http://localhost:5000/detect-face`. El backend Node (`backend/lib/mediapipe.js`)
le apunta vía `FACE_SERVICE_URL` (default: `http://localhost:5000/detect-face`).

## Notas

- Sin este servicio corriendo, el botón "Detectar rostro" en OrientationConverter falla.
- El modo Manual (crop/pan a mano) funciona sin este servicio.
- Tracking de pose/manos (stickers que sigan puntos) fue descartado — decisión de proyecto,
  demasiado costoso para el caso de uso (stickers son overlay fijo, ver StickersPanel.jsx).
