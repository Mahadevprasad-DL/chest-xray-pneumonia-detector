from __future__ import annotations

from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator

from config import IMAGE_SIZE, LABELS_PATH, MODEL_PATH, THRESHOLD_PATH, resolve_dataset_dir


def main() -> None:
    dataset_dir = resolve_dataset_dir()
    test_dir = dataset_dir / "test"

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Train first.")

    model = tf.keras.models.load_model(MODEL_PATH)

    threshold = 0.5
    if THRESHOLD_PATH.exists():
        import json

        with THRESHOLD_PATH.open("r", encoding="utf-8") as f:
            payload = json.load(f)
        threshold = float(payload.get("threshold", 0.5))

    channels = int(model.input_shape[-1]) if len(model.input_shape) == 4 else 3
    color_mode = "grayscale" if channels == 1 else "rgb"

    if channels == 1:
        datagen = ImageDataGenerator(rescale=1.0 / 255.0)
    else:
        # Match transfer-learning training path (no rescale here).
        datagen = ImageDataGenerator()

    test_gen = datagen.flow_from_directory(
        test_dir,
        target_size=IMAGE_SIZE,
        batch_size=32,
        class_mode="binary",
        color_mode=color_mode,
        shuffle=False,
    )

    probs = model.predict(test_gen, verbose=0).reshape(-1)
    y_pred = (probs >= threshold).astype(int)
    y_true = test_gen.classes.astype(int)

    accuracy = float((y_pred == y_true).mean())
    pred_pneumonia_ratio = float((y_pred == 1).mean())

    tn = int(((y_true == 0) & (y_pred == 0)).sum())
    fp = int(((y_true == 0) & (y_pred == 1)).sum())
    fn = int(((y_true == 1) & (y_pred == 0)).sum())
    tp = int(((y_true == 1) & (y_pred == 1)).sum())

    print("Quick Evaluation")
    print(f"Model: {MODEL_PATH}")
    print(f"Labels artifact exists: {LABELS_PATH.exists()}")
    print(f"Input channels: {channels}")
    print(f"Decision threshold: {threshold:.2f}")
    print(f"Samples: {len(y_true)}")
    print(f"Accuracy: {accuracy:.4f}")
    print(f"Predicted Pneumonia Ratio: {pred_pneumonia_ratio:.4f}")
    print("Confusion Matrix (NORMAL=0, PNEUMONIA=1):")
    print(f"TN={tn}, FP={fp}, FN={fn}, TP={tp}")


if __name__ == "__main__":
    main()
