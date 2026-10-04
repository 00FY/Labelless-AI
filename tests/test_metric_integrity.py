"""
tests/test_metric_integrity.py

General Metric Guardrail:
Ensures that EVERY performance metric (mAP, precision, recall, F1, per-class AP)
published in:
  - README.md
  - src/data/measuredResults.ts
  - src/data/fallbackPresets.ts
  - src/components/*.tsx
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
MEASURED_RESULTS_PATH = _ROOT / "src" / "data" / "measuredResults.ts"
COMPONENTS_DIR = _ROOT / "src" / "components"
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


def _is_measured_fraction(val: float, measured: dict, tol: float = 0.0006) -> bool:
    return any(abs(val - float(f)) <= tol for f in measured["raw_floats"])


def test_measured_results_ts_grounded():
    """Every mAP50 / fireAP50 in measuredResults.ts must match results/metrics/*.json."""
    measured = get_all_measured_metrics()
    code_text = MEASURED_RESULTS_PATH.read_text(encoding="utf-8")

    values = re.findall(r"(?:mAP50|fireAP50):\s*(\d+\.\d+)", code_text)
    assert values, "measuredResults.ts should contain measured runs"
    for v in values:
        assert _is_measured_fraction(float(v), measured), (
            f"Unverified metric '{v}' found in measuredResults.ts! Must match results/metrics/*.json"
        )


def test_fallback_presets_ts_grounded():
    """Completed rounds in fallbackPresets.ts (stored in percent) must only quote measured numbers."""
    measured = get_all_measured_metrics()
    code_text = FALLBACK_PRESETS_PATH.read_text(encoding="utf-8")
    start = code_text.index("ACTIVE_LEARNING_ROUNDS")
    rounds_text = code_text[start:]

    for key in ["mAP50", "precision", "recall", "ap50"]:
        for v in re.findall(rf"\b{key}:\s*(\d+\.\d+)", rounds_text):
            assert _is_measured_fraction(float(v) / 100, measured), (
                f"Unverified {key} '{v}%' found in fallbackPresets.ts!"
            )


def test_components_have_no_unmeasured_percentages():
    """Page components must not hard-code accuracy-style percentages (e.g. '88.4%').

    Numbers belong in src/data/measuredResults.ts so they stay tied to results/metrics.
    """
    measured = get_all_measured_metrics()
    offenders = []
    for tsx in COMPONENTS_DIR.glob("*.tsx"):
        for lit in re.findall(r"(?<![\w.])(\d{2}\.\d{1,2})%", tsx.read_text(encoding="utf-8")):
            if not _is_measured_fraction(float(lit) / 100, measured, tol=0.0006):
                offenders.append(f"{tsx.name}: {lit}%")
    assert not offenders, f"Unmeasured percentage literals in components: {offenders}"


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
