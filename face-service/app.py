"""
Microservicio local de detección de rostro (MediaPipe FaceDetection).
Corre en la máquina local (RTX 3070 / Mac Studio M2 Ultra) — NO en Railway.
Usado solo para la conversión H->V automática (backend/lib/mediapipe.js llama a esto).

Uso:
    pip install -r requirements.txt
    python app.py
    # sirve en http://localhost:5000/detect-face
"""

import base64
import io

import cv2
import mediapipe as mp
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)
mp_face_detection = mp.solutions.face_detection
detector = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)


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

    h, w = frame.shape[:2]
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = detector.process(rgb)

    if not results.detections:
        return jsonify({"face": None})

    # toma la detección con mayor confianza
    best = max(results.detections, key=lambda d: d.score[0])
    box = best.location_data.relative_bounding_box

    return jsonify({
        "face": {
            "x": max(0, box.xmin * w),
            "y": max(0, box.ymin * h),
            "width": box.width * w,
            "height": box.height * h,
        },
        "confidence": best.score[0],
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
