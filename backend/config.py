from __future__ import annotations

from pathlib import Path

# Base paths
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent
ARTIFACTS_DIR = BACKEND_DIR / "artifacts"

# Model artifacts
MODEL_PATH = ARTIFACTS_DIR / "custom_cnn.keras"
LABELS_PATH = ARTIFACTS_DIR / "labels.json"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"
THRESHOLD_PATH = ARTIFACTS_DIR / "threshold.json"

# Image settings
IMAGE_SIZE = (192, 192)
MAX_FILE_MB = 20

# Class labels used as fallback when labels artifact does not exist
DEFAULT_CLASS_LABELS = ["NORMAL", "PNEUMONIA"]


def ensure_artifacts_dir() -> None:
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)


def resolve_dataset_dir() -> Path:
    """Resolve chest X-ray dataset directory that contains train/val/test.

    After cleanup, the main dataset should be at PROJECT_DIR/dataset/chest_xray
    """
    candidates = [
        PROJECT_DIR / "dataset" / "chest_xray",
        PROJECT_DIR / "dataset",
    ]

    for candidate in candidates:
        if (candidate / "train").exists() and (candidate / "val").exists() and (candidate / "test").exists():
            return candidate

    raise FileNotFoundError(
        "Could not find dataset directory with train/val/test under project/dataset. "
        "Please ensure duplicates (__MACOSX and nested chest_xray) have been deleted."
    )
