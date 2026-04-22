from __future__ import annotations

import io
import json
from functools import lru_cache
from typing import Any

import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from config import (
    DEFAULT_CLASS_LABELS,
    IMAGE_SIZE,
    LABELS_PATH,
    MAX_FILE_MB,
    MODEL_PATH,
    THRESHOLD_PATH,
)

app = FastAPI(title="AI powered medicial diagnosis assistant Custom CNN Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@lru_cache(maxsize=1)
def get_model() -> tf.keras.Model:
    if not MODEL_PATH.exists():
        raise RuntimeError(
            f"Model not found at {MODEL_PATH}. Run `python train_custom_cnn.py` first."
        )
    base_model = tf.keras.models.load_model(MODEL_PATH)

    # Re-wrap the loaded Sequential model in a functional graph so symbolic
    # inputs/outputs are defined for Grad-CAM and other inspection steps.
    input_shape = base_model.input_shape[1:]
    inputs = tf.keras.Input(shape=input_shape, name="xray_input")
    outputs = base_model(inputs, training=False)
    return tf.keras.Model(inputs=inputs, outputs=outputs, name="custom_cnn_inference")


@lru_cache(maxsize=1)
def get_labels() -> list[str]:
    if LABELS_PATH.exists():
        with LABELS_PATH.open("r", encoding="utf-8") as f:
            labels = json.load(f)
        if isinstance(labels, list) and labels:
            return [str(x) for x in labels]
        if isinstance(labels, dict):
            maybe_labels = labels.get("labels")
            if isinstance(maybe_labels, list) and maybe_labels:
                return [str(x) for x in maybe_labels]
    return DEFAULT_CLASS_LABELS


@lru_cache(maxsize=1)
def get_decision_threshold() -> float:
    if THRESHOLD_PATH.exists():
        try:
            with THRESHOLD_PATH.open("r", encoding="utf-8") as f:
                payload = json.load(f)
            value = float(payload.get("threshold", 0.5))
            # Keep threshold in a valid sigmoid decision range.
            return float(min(0.95, max(0.05, value)))
        except Exception:
            pass
    return 0.5


def _load_rgb_image(file_bytes: bytes) -> Image.Image:
    try:
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        return image
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {exc}") from exc


def _preprocess_image(image: Image.Image, channels: int) -> np.ndarray:
    image = image.resize(IMAGE_SIZE)

    if channels == 1:
        image = image.convert("L")
        array = np.asarray(image, dtype=np.float32) / 255.0
        array = np.expand_dims(array, axis=-1)
    else:
        image = image.convert("RGB")
        # Keep RGB values in [0, 255] to match the transfer-learning training path.
        array = np.asarray(image, dtype=np.float32)

    return np.expand_dims(array, axis=0)


def _last_conv_layer_name(model: tf.keras.Model) -> str:
    if isinstance(model, tf.keras.Sequential):
        for layer in reversed(model.layers):
            if isinstance(layer, tf.keras.layers.Conv2D):
                return layer.name

    for layer in reversed(model.layers):
        if isinstance(layer, tf.keras.Model):
            try:
                return _last_conv_layer_name(layer)
            except RuntimeError:
                pass
        if isinstance(layer, tf.keras.layers.Conv2D):
            return layer.name
    raise RuntimeError("Could not find a Conv2D layer for Grad-CAM generation.")


def _generate_gradcam(model: tf.keras.Model, processed: np.ndarray) -> np.ndarray:
    try:
        base_model = model
        if isinstance(model, tf.keras.Model) and len(model.layers) == 1 and isinstance(model.layers[0], tf.keras.Model):
            base_model = model.layers[0]

        conv_name = _last_conv_layer_name(base_model)
        grad_model = tf.keras.models.Model(
            inputs=base_model.inputs,
            outputs=[base_model.get_layer(conv_name).output, base_model.output],
        )

        input_tensor = tf.convert_to_tensor(processed)

        with tf.GradientTape() as tape:
            conv_outputs, predictions = grad_model(input_tensor, training=False)
            class_output = predictions[:, 0]

        grads = tape.gradient(class_output, conv_outputs)
        if grads is None:
            raise RuntimeError("Could not compute gradients for Grad-CAM.")

        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
        conv_outputs = conv_outputs[0]

        heatmap = tf.reduce_sum(tf.multiply(pooled_grads, conv_outputs), axis=-1)
        heatmap = tf.maximum(heatmap, 0)

        max_val = tf.reduce_max(heatmap)
        if float(max_val) > 0:
            heatmap = heatmap / max_val

        heatmap = tf.image.resize(heatmap[..., tf.newaxis], IMAGE_SIZE)
        heatmap = tf.squeeze(heatmap, axis=-1)
        return heatmap.numpy()
    except Exception:
        return np.zeros(IMAGE_SIZE, dtype=np.float32)


def _severity_from_confidence(confidence_pct: float, diagnosis: str) -> str:
    if diagnosis.upper() == "NORMAL":
        if confidence_pct >= 80:
            return "low"
        return "moderate"

    if confidence_pct >= 90:
        return "critical"
    if confidence_pct >= 75:
        return "high"
    return "moderate"


def _build_notes(diagnosis: str, confidence_pct: float) -> str:
    if diagnosis.upper() == "PNEUMONIA":
        return (
            "Custom CNN indicates radiographic features compatible with pneumonia. "
            f"Predicted confidence is {confidence_pct:.2f}%. "
            "Correlate with clinical findings and radiologist review."
        )

    return (
        "Custom CNN indicates no significant pneumonia pattern in the image. "
        f"Predicted confidence is {confidence_pct:.2f}%. "
        "Clinical interpretation is still required."
    )


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "AI powered medicial diagnosis assistant Custom CNN backend is running"}


@app.get("/health")
def health() -> dict[str, Any]:
    status = {
        "status": "ok",
        "model_path": str(MODEL_PATH),
        "model_loaded": MODEL_PATH.exists(),
        "labels_loaded": LABELS_PATH.exists(),
        "algorithm": "Custom CNN",
    }
    return status


@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file name")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_MB:
        raise HTTPException(status_code=413, detail=f"File exceeds {MAX_FILE_MB} MB")

    model = get_model()
    labels = get_labels()
    threshold = get_decision_threshold()

    image = _load_rgb_image(file_bytes)
    input_shape = model.input_shape[1:]
    channels = int(input_shape[-1]) if len(input_shape) == 3 else 3
    processed = _preprocess_image(image, channels)

    pred = model.predict(processed, verbose=0)
    pneumonia_prob = float(pred[0][0])

    # For binary sigmoid output: index 0 is NORMAL, index 1 is PNEUMONIA.
    probabilities = [1.0 - pneumonia_prob, pneumonia_prob]
    top_idx = 1 if pneumonia_prob >= threshold else 0
    diagnosis = labels[top_idx] if top_idx < len(labels) else DEFAULT_CLASS_LABELS[top_idx]
    confidence = float(probabilities[top_idx] * 100.0)

    risk_score = float(round(pneumonia_prob * 100.0, 2))
    severity = _severity_from_confidence(confidence, diagnosis)
    notes = _build_notes(diagnosis, confidence)

    heatmap = _generate_gradcam(model, processed)

    differentials = []
    for idx, prob in enumerate(probabilities):
        label = labels[idx] if idx < len(labels) else DEFAULT_CLASS_LABELS[idx]
        differentials.append({"label": label, "probability": float(round(prob * 100.0, 2))})

    differentials = sorted(differentials, key=lambda x: x["probability"], reverse=True)

    return {
        "diagnosis": diagnosis,
        "confidence": float(round(confidence, 2)),
        "severity": severity,
        "risk_score": risk_score,
        "notes": notes,
        "heatmap_data": {
            "gradcam": np.round(heatmap, 4).tolist(),
        },
        "differentials": differentials,
        "decision_threshold": float(round(threshold, 4)),
        "algorithm": "Custom CNN",
    }
