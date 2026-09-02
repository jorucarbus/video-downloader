"""
Microservicio local de detección de rostro (MediaPipe Tasks API — FaceDetector).
Corre en la máquina local (RTX 3070 / Mac Studio M2 Ultra) — NO en Railway.
Usado solo para la conversión H->V automática (backend/lib/mediapipe.js llama a esto).

Nota: la API legacy `mp.solutions.face_detection` ya no existe en las versiones de
mediapipe disponibles para Python 3.13 (fue reemplazada por la Tasks API). Este
archivo usa `mediapipe.tasks.python.vision.FaceDetector`, que requiere el modelo
.tflite en models/blaze_face_short_range.tflite (descargado aparte, no versionado).

Uso:
    pip install -r requirements.txt
    python app.py
    # sirve en http://localhost:5000/detect-face
"""

import base64
import os

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks.python import vision
from mediapipe.tasks.python.core.base_options import BaseOptions
from flask import Flask, request, jsonify

app = Flask(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "blaze_face_short_range.tflite")

options = vision.FaceDetectorOptions(
    base_options=BaseOptions(model_asset_path=MODEL_PATH),
    min_detection_confidence=0.5,
)
detector = vision.FaceDetector.create_from_options(options)


@app.route("/detect-face", methods=["POST"])
def detect_face():
    data = request.get_json(force=True)
    image_b64 = data.get("image")
    if not image_b64:
        return jsonify({"error": "image (base64) requerida"}), 400

    img_bytes = base64.b64decode(image_b64)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if frame is None:
        return jsonify({"error": "imagen inválida"}), 400

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result = detector.detect(mp_image)

    if not result.detections:
        return jsonify({"face": None})

    best = max(result.detections, key=lambda d: d.categories[0].score)
    box = best.bounding_box

    return jsonify({
        "face": {
            "x": max(0, box.origin_x),
            "y": max(0, box.origin_y),
            "width": box.width,
            "height": box.height,
        },
        "confidence": best.categories[0].score,
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
