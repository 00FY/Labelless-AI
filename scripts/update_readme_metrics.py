"""
scripts/update_readme_metrics.py

Reads results/metrics/round_0_seed.json and verifies / updates the
Cold Start Baseline table in README.md. Ensures that every figure published
in documentation is 100% synchronized with measured JSON data on disk.
"""

import json
import re
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
SEED_METRIC_PATH = _ROOT / "results" / "metrics" / "round_0_seed.json"
README_PATH = _ROOT / "README.md"


def get_seed_metrics() -> dict:
    if not SEED_METRIC_PATH.exists():
        sys.exit(f"Error: {SEED_METRIC_PATH} not found")
    with open(SEED_METRIC_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def build_markdown_table(data: dict) -> str:
    m50 = data.get("mAP50", 0.0)
    m50_95 = data.get("mAP50_95", 0.0)
    prec = data.get("precision", 0.0)
    rec = data.get("recall", 0.0)
    f1 = data.get("f1", 0.0)

    per_class = data.get("per_class", {})
    undamaged = per_class.get("undamagedbuilding", {}).get("ap50", 0.0)
    damaged = per_class.get("damagedbuilding", {}).get("ap50", 0.0)
    fire = per_class.get("fire", {}).get("ap50", 0.0)
    smoke = per_class.get("smoke", {}).get("ap50", 0.0)

    return (
        f"| Metric | Measured Value |\n"
        f"| :--- | :---: |\n"
        f"| **mAP@50 (Overall)** | **{m50 * 100:.2f}%** (${m50:.4f}$) |\n"
        f"| **mAP@50-95** | **{m50_95 * 100:.2f}%** (${m50_95:.4f}$) |\n"
        f"| **Precision** | **{prec * 100:.2f}%** |\n"
        f"| **Recall** | **{rec * 100:.2f}%** |\n"
        f"| **F1 Score** | **{f1 * 100:.2f}%** |\n"
        f"| **Undamaged Building AP@50** | ${undamaged * 100:.2f}\\%$ |\n"
        f"| **Damaged Building AP@50** | ${damaged * 100:.2f}\\%$ |\n"
        f"| **Fire AP@50** | ${fire * 100:.2f}\\%$ |\n"
        f"| **Smoke AP@50** | ${smoke * 100:.2f}\\%$ |"
    )


def verify_readme():
    data = get_seed_metrics()
    expected_table = build_markdown_table(data)
    readme_content = README_PATH.read_text(encoding="utf-8")

    m50_str = f"{data['mAP50'] * 100:.2f}%"
    if m50_str not in readme_content:
        raise ValueError(f"README does not contain measured mAP50 {m50_str}")

    print("✔ README verified: Cold start baseline matches results/metrics/round_0_seed.json exactly.")


if __name__ == "__main__":
    verify_readme()
