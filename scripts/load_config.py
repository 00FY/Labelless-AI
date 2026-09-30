"""
scripts/load_config.py

Loads config.yaml from the project root and provides typed accessors.
Every Python script in the pipeline imports from here instead of
hardcoding weights, thresholds or class names.

Usage:
    from load_config import cfg, get_class_names, get_class_to_id
"""

from __future__ import annotations

import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# pyyaml may not be installed; give a clear message.
# ---------------------------------------------------------------------------
try:
    import yaml
except ImportError:
    sys.exit(
        "ERROR: PyYAML is required.  Install it with:\n"
        "  pip install pyyaml"
    )

# ---------------------------------------------------------------------------
# Locate config.yaml relative to this script (scripts/ → project root)
# ---------------------------------------------------------------------------
_SCRIPT_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _SCRIPT_DIR.parent
_CONFIG_PATH = _PROJECT_ROOT / "config.yaml"

if not _CONFIG_PATH.exists():
    sys.exit(f"ERROR: config.yaml not found at {_CONFIG_PATH}")

with open(_CONFIG_PATH, "r", encoding="utf-8") as _f:
    cfg: dict = yaml.safe_load(_f)


# ── Convenience helpers ────────────────────────────────────────────────────

def get_class_names() -> list[str]:
    """Return YOLO class names in index order."""
    return [c["yolo_name"] for c in cfg["classes"]]


def get_class_display_names() -> list[str]:
    """Return human-readable class names in index order."""
    return [c["display_name"] for c in cfg["classes"]]


def get_class_to_id() -> dict[str, int]:
    """Return {yolo_name: id} mapping."""
    return {c["yolo_name"]: c["id"] for c in cfg["classes"]}


def get_display_to_yolo() -> dict[str, str]:
    """Return {display_name: yolo_name} mapping."""
    return {c["display_name"]: c["yolo_name"] for c in cfg["classes"]}


def get_yolo_to_display() -> dict[str, str]:
    """Return {yolo_name: display_name} mapping."""
    return {c["yolo_name"]: c["display_name"] for c in cfg["classes"]}


def get_num_classes() -> int:
    return len(cfg["classes"])


def get_ranking_weights() -> tuple[float, float, float]:
    """Return (w_uncertainty, w_rare_class, w_diversity)."""
    r = cfg["ranking"]
    return r["w_uncertainty"], r["w_rare_class"], r["w_diversity"]


def get_routing() -> dict:
    """Return the routing sub-config."""
    return cfg["routing"]


def get_training() -> dict:
    """Return the training sub-config."""
    return cfg["training"]


def get_paths() -> dict:
    """Return the paths sub-config."""
    return cfg["paths"]


def get_project_root() -> Path:
    return _PROJECT_ROOT
