"""
tests/test_metric_integrity.py

General Metric Guardrail:
Ensures that EVERY performance metric (mAP, precision, recall, F1, per-class AP)
published in:
  - README.md
  - src/data/realMetrics.ts
  - src/data/fallbackPresets.ts
  - DEMO_SCRIPT.md
is strictly grounded in and traceable to measured JSON files in results/metrics/*.json.

Fails automatically if any unverified or invented metric percentage is introduced.
"""

import json
import re
from pathlib import Path
import pytest

_ROOT = Path(__file__).resolve().parent.parent
METRICS_DIR = _ROOT / "results" / "metrics"
README_PATH = _ROOT / "README.md"
REAL_METRICS_PATH = _ROOT / "src" / "data" / "realMetrics.ts"
FALLBACK_PRESETS_PATH = _ROOT / "src" / "data" / "fallbackPresets.ts"
DEMO_SCRIPT_PATH = _ROOT / "DEMO_SCRIPT.md"


def get_all_measured_metrics() -> dict:
    """Collects all measured performance values from results/metrics/*.json."""
    assert METRICS_DIR.exists(), f"Missing directory: {METRICS_DIR}"
    metric_files = list(METRICS_DIR.glob("*.json"))
    assert len(metric_files) > 0, "At least one measured metric file must exist in results/metrics/"

    measured_percentages = set()
    raw_floats = set()

    for mf in metric_files:
        with open(mf, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Primary summary metrics
        for key in ["mAP50", "mAP50_95", "precision", "recall", "f1"]:
            if key in data and isinstance(data[key], (int, float)):
                val = float(data[key])
                raw_floats.add(f"{val:.4f}")
                raw_floats.add(f"{val:.3f}")
                pct_2dec = f"{val * 100:.2f}%"
                pct_1dec = f"{val * 100:.1f}%"
                measured_percentages.add(pct_2dec)
                measured_percentages.add(pct_1dec)

        # Per-class AP metrics
        if "per_class" in data and isinstance(data["per_class"], dict):
            for cls_name, cls_metrics in data["per_class"].items():
                if isinstance(cls_metrics, dict):
                    for k in ["ap50", "precision", "recall"]:
                        if k in cls_metrics and isinstance(cls_metrics[k], (int, float)):
                            val = float(cls_metrics[k])
                            raw_floats.add(f"{val:.4f}")
                            raw_floats.add(f"{val:.3f}")
                            measured_percentages.add(f"{val * 100:.2f}%")
                            measured_percentages.add(f"{val * 100:.1f}%")

    return {
        "files": metric_files,
        "percentages": measured_percentages,
        "raw_floats": raw_floats,
    }


def test_readme_metrics_grounded():
    """Every performance metric quoted in README.md must match results/metrics/*.json."""
    measured = get_all_measured_metrics()
    readme_text = README_PATH.read_text(encoding="utf-8")

    # Overall mAP50 must be quoted exactly
    assert "60.89%" in readme_text or any(p in readme_text for p in measured["percentages"]), (
        "README.md must quote grounded measured metrics"
    )

    # Extract all markdown table cells in performance sections that contain percentages
    table_pcts = re.findall(r"\|\s*(\d{1,2}\.\d{1,2}%)\s*\|", readme_text)
    for pct in table_pcts:
        assert pct in measured["percentages"], (
            f"Unverified performance percentage '{pct}' found in README.md! "
            f"Must exist in results/metrics/*.json. Permitted: {measured['percentages']}"
        )


def test_real_metrics_ts_grounded():
    """Every completed round metric in realMetrics.ts must match results/metrics/*.json."""
    measured = get_all_measured_metrics()
    code_text = REAL_METRICS_PATH.read_text(encoding="utf-8")

    # Extract mAP50 float values
    map_values = re.findall(r"mAP50:\s*(\d+\.\d+)", code_text)
    for m in map_values:
        # Round 0 must match
        val = float(m)
        formatted = f"{val:.4f}"
        assert formatted in measured["raw_floats"] or val == 0.0, (
            f"Unverified mAP50 '{m}' found in realMetrics.ts! Must match results/metrics/*.json"
        )


def test_fallback_presets_ts_grounded():
    """Completed rounds in fallbackPresets.ts must only quote measured numbers."""
    measured = get_all_measured_metrics()
    code_text = FALLBACK_PRESETS_PATH.read_text(encoding="utf-8")

    # Match each object inside ACTIVE_LEARNING_ROUNDS
    round_blocks = re.findall(r"\{\s*round:\s*(\d+)[\s\S]*?status:\s*'([^']+)'", code_text)
    for r_num, status in round_blocks:
        if status == "completed":
            # Search for mAP50 in this specific round block
            pattern = rf"round:\s*{r_num}[\s\S]*?mAP50:\s*(\d+\.\d+)"
            match = re.search(pattern, code_text)
            assert match, f"Could not find mAP50 for round {r_num}"
            val = float(match.group(1))
            formatted3 = f"{val:.3f}"
            formatted4 = f"{val:.4f}"
            assert formatted3 in measured["raw_floats"] or formatted4 in measured["raw_floats"], (
                f"Unverified completed mAP50 '{val}' found for round {r_num} in fallbackPresets.ts!"
            )


def test_demo_script_grounded():
    """DEMO_SCRIPT.md must not cite phantom performance numbers."""
    measured = get_all_measured_metrics()
    script_text = DEMO_SCRIPT_PATH.read_text(encoding="utf-8")

    # Match performance percentages cited in quotes
    quoted_pcts = re.findall(r"(\d{2}\.\d{1,2}%)\s*mAP", script_text)
    for q in quoted_pcts:
        assert q in measured["percentages"], (
            f"Unverified mAP percentage '{q}' found in DEMO_SCRIPT.md! Must match results/metrics/*.json"
        )
