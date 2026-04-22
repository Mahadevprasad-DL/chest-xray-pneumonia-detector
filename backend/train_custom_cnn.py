from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow.keras import callbacks
from tensorflow.keras.preprocessing.image import ImageDataGenerator

from config import (
    IMAGE_SIZE,
    LABELS_PATH,
    METRICS_PATH,
    MODEL_PATH,
    THRESHOLD_PATH,
    ensure_artifacts_dir,
    resolve_dataset_dir,
)
from model import build_custom_cnn, build_transfer_learning_model


def _str2bool(value: str) -> bool:
    return value.lower() in {"1", "true", "t", "yes", "y"}


def set_seed(seed: int) -> None:
    tf.keras.utils.set_random_seed(seed)


def _to_plain_history(history_obj: tf.keras.callbacks.History) -> dict[str, list[float]]:
    history: dict[str, list[float]] = {}
    for key, values in history_obj.history.items():
        history[key] = [float(v) for v in values]
    return history


def _balanced_accuracy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    tp = np.sum((y_true == 1) & (y_pred == 1))
    tn = np.sum((y_true == 0) & (y_pred == 0))
    fp = np.sum((y_true == 0) & (y_pred == 1))
    fn = np.sum((y_true == 1) & (y_pred == 0))

    tpr = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    tnr = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    return float((tpr + tnr) / 2.0)


def _find_best_threshold(y_true: np.ndarray, y_prob: np.ndarray) -> tuple[float, float]:
    best_threshold = 0.5
    best_score = -1.0

    for threshold in np.arange(0.10, 0.91, 0.01):
        y_pred = (y_prob >= threshold).astype(int)
        score = _balanced_accuracy(y_true, y_pred)
        if score > best_score:
            best_score = score
            best_threshold = float(threshold)

    return best_threshold, best_score


def train_model(
    dataset_dir: Path,
    epochs: int,
    batch_size: int,
    learning_rate: float,
    seed: int,
    use_transfer_learning: bool = True,
) -> None:
    set_seed(seed)
    ensure_artifacts_dir()

    train_dir = dataset_dir / "train"
    val_dir = dataset_dir / "val"
    test_dir = dataset_dir / "test"

    if not train_dir.exists() or not val_dir.exists() or not test_dir.exists():
        raise FileNotFoundError(
            f"Dataset must contain train/val/test folders. Missing in: {dataset_dir}"
        )

    if use_transfer_learning:
        color_mode = "rgb"
        target_size = IMAGE_SIZE

        train_datagen = ImageDataGenerator(
            rotation_range=10,
            width_shift_range=0.1,
            height_shift_range=0.1,
            zoom_range=0.1,
            horizontal_flip=True,
        )
        eval_datagen = ImageDataGenerator()
    else:
        color_mode = "grayscale"
        target_size = IMAGE_SIZE
        
        train_datagen = ImageDataGenerator(
            rescale=1.0 / 255.0,
            rotation_range=10,
            width_shift_range=0.1,
            height_shift_range=0.1,
            shear_range=0.05,
            zoom_range=0.1,
            horizontal_flip=True,
        )
        eval_datagen = ImageDataGenerator(rescale=1.0 / 255.0)

    train_gen = train_datagen.flow_from_directory(
        train_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode="binary",
        color_mode=color_mode,
        shuffle=True,
        seed=seed,
    )

    val_gen = eval_datagen.flow_from_directory(
        val_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode="binary",
        color_mode=color_mode,
        shuffle=False,
    )

    test_gen = eval_datagen.flow_from_directory(
        test_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode="binary",
        color_mode=color_mode,
        shuffle=False,
    )

    index_to_class = {v: k for k, v in train_gen.class_indices.items()}
    class_labels = [index_to_class[i] for i in sorted(index_to_class)]

    class_counts = np.bincount(train_gen.classes)
    class_weight = {
        class_index: float(len(train_gen.classes) / (len(class_counts) * count))
        for class_index, count in enumerate(class_counts)
        if count > 0
    }

    if use_transfer_learning:
        print("Using Transfer Learning with MobileNetV3Small...")
        model, base_model = build_transfer_learning_model(
            input_shape=(target_size[0], target_size[1], 3)
        )
    else:
        print("Using Custom CNN...")
        model = build_custom_cnn(input_shape=(target_size[0], target_size[1], 1))

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss="binary_crossentropy",
        metrics=[
            tf.keras.metrics.BinaryAccuracy(name="accuracy"),
            tf.keras.metrics.AUC(name="auc"),
        ],
    )

    cbs = [
        callbacks.ModelCheckpoint(
            filepath=str(MODEL_PATH),
            monitor="val_auc",
            mode="max",
            save_best_only=True,
            verbose=1,
        ),
        callbacks.EarlyStopping(
            monitor="val_auc",
            patience=4,
            mode="max",
            restore_best_weights=True,
            verbose=1,
        ),
        callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=3,
            min_lr=1e-7,
            verbose=1,
        ),
    ]

    print(f"\nStarting training with {len(train_gen.classes)} training images...")
    print(f"Class weights: {class_weight}")
    print(f"Image size: {target_size}, Color mode: {color_mode}")

    base_epochs = max(1, epochs)
    history = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=base_epochs,
        callbacks=cbs,
        class_weight=class_weight,
        verbose=1,
    )

    if use_transfer_learning:
        print("\nFine-tuning base model...")
        base_model.trainable = True

        for layer in base_model.layers[:-20]:
            layer.trainable = False
        
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate / 10),
            loss="binary_crossentropy",
            metrics=[
                tf.keras.metrics.BinaryAccuracy(name="accuracy"),
                tf.keras.metrics.AUC(name="auc"),
            ],
        )
        
        model.fit(
            train_gen,
            validation_data=val_gen,
            epochs=max(3, epochs // 4),
            callbacks=cbs,
            class_weight=class_weight,
            verbose=1,
        )

    print("\nEvaluating on test set...")
    test_metrics = model.evaluate(test_gen, verbose=1, return_dict=True)
    test_metrics = {name: float(value) for name, value in test_metrics.items()}

    print("\nCalibrating decision threshold on validation set...")
    val_gen.reset()
    val_probs = model.predict(val_gen, verbose=0).reshape(-1)
    val_true = val_gen.classes.astype(int)
    best_threshold, best_bal_acc = _find_best_threshold(val_true, val_probs)
    print(f"Best threshold: {best_threshold:.2f} (val balanced accuracy={best_bal_acc:.4f})")

    print(f"\nTest Metrics:")
    for metric, value in test_metrics.items():
        print(f"  {metric}: {value:.4f}")

    # Save model
    model.save(MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

    # Save labels
    with open(LABELS_PATH, "w") as f:
        json.dump(class_labels, f)
    print(f"Labels saved to {LABELS_PATH}")

    # Save metrics
    history_dict = _to_plain_history(history)
    history_dict.update(
        {
            "test": test_metrics,
            "threshold": {
                "value": best_threshold,
                "val_balanced_accuracy": best_bal_acc,
            },
        }
    )
    with open(METRICS_PATH, "w") as f:
        json.dump(history_dict, f, indent=2)
    print(f"Metrics saved to {METRICS_PATH}")

    with open(THRESHOLD_PATH, "w") as f:
        json.dump({"threshold": best_threshold}, f, indent=2)
    print(f"Threshold saved to {THRESHOLD_PATH}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train chest X-ray classifier using Transfer Learning."
    )
    parser.add_argument(
        "--dataset-dir",
        type=Path,
        default=None,
        help="Path to dataset directory containing train/val/test",
    )
    parser.add_argument("--epochs", type=int, default=12, help="Number of epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--learning-rate", type=float, default=1e-4, help="Learning rate")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument(
        "--use-transfer-learning",
        type=_str2bool,
        default=True,
        help="Use transfer learning with MobileNetV3Small (true/false)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    dataset_dir = args.dataset_dir if args.dataset_dir else resolve_dataset_dir()
    print(f"Using dataset from: {dataset_dir}")
    train_model(
        dataset_dir=dataset_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        seed=args.seed,
        use_transfer_learning=args.use_transfer_learning,
    )


if __name__ == "__main__":
    main()
