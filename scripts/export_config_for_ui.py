"""
scripts/export_config_for_ui.py

Reads config.yaml and writes public/pipeline_config.json so the React UI
can display the *actual* weights, thresholds and class info the pipeline uses.

Run this after any change to config.yaml:
    python scripts/export_config_for_ui.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

_SCRIPT_DIR = Path(__file__).resolve().parent
if str(_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPT_DIR))

from load_config import cfg, get_project_root  # noqa: E402


def export():
    project_root = get_project_root()
    out_path = project_root / cfg["paths"]["ui_config"]
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Build a clean JSON payload the UI can consume
    payload = {
        "project": cfg["project"],
        "classes": cfg["classes"],
        "ranking": cfg["ranking"],
        "routing": cfg["routing"],
        "training": {
            "base_model": cfg["training"]["base_model"],
            "image_size": cfg["training"]["image_size"],
        },
        "dataset": {
            "total_pool_fallback": cfg["dataset"]["total_pool_fallback"],
        },
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print(f"✅ Exported pipeline config → {out_path}")
    print(f"   Ranking weights: uncertainty={cfg['ranking']['w_uncertainty']}, "
          f"rare={cfg['ranking']['w_rare_class']}, "
          f"diversity={cfg['ranking']['w_diversity']}")
    print(f"   Confidence threshold: {cfg['routing']['confidence_threshold']}")
    print(f"   Classes: {[c['display_name'] for c in cfg['classes']]}")


if __name__ == "__main__":
    export()
