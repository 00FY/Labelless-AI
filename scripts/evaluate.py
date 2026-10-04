"""
evaluate.py

Evaluates a trained YOLO model against the fixed test set and saves
standardised metrics to results/metrics/round_N_method.json.

Usage:
    python scripts/evaluate.py \
        --model models/round_1/best.pt \
        --data dataset.yaml \
        --round 1 \
        --method labelless \
        --budget 100 \
        --total-pool 971

The script:
  1. Runs model.val() on the test split.
  2. Collects mAP50, mAP50-95, precision, recall, and computes F1.
  3. Collects per-class precision, recall, and AP50.
  4. Saves everything to results/metrics/round_{N}_{method}.json.
  5. Prints a formatted summary table.
"""

import argparse
import json
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from ultralytics import YOLO

# ---------------------------------------------------------------------------
# Import canonical class names from the shared class_map module.
# Support running both as `python scripts/evaluate.py` (from project root)
# and as `python evaluate.py` (from scripts/).
# ---------------------------------------------------------------------------
_SCRIPT_DIR = Path(__file__).resolve().parent
if str(_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPT_DIR))

from class_map import CLASS_NAMES, NUM_CLASSES  # noqa: E402


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def parse_args():
    """Parse command-line arguments."""
    p = argparse.ArgumentParser(
        description="Evaluate a YOLO model on the test split and save metrics."
    )
    p.add_argument(
        "--model", required=True,
        help="Path to the trained YOLO model (.pt file)."
    )
    p.add_argument(
        "--data", required=True,
        help="Path to the dataset YAML file (must define a 'test' split)."
    )
    p.add_argument(
        "--round", required=True, type=int, dest="round_num",
        help="Active-learning round number (e.g. 1, 2, …)."
    )
    p.add_argument(
        "--method", required=True,
        help="Selection method name (e.g. 'labelless', 'random', 'entropy')."
    )
    p.add_argument(
        "--budget", required=True, type=int,
        help="Number of pool images reviewed / labelled in this round."
    )
    p.add_argument(
        "--total-pool", required=True, type=int,
        help="Total number of images in the pool (default 971)."
    )
    p.add_argument(
        "--device", default=None,
        help="Device override, e.g. 'cpu' or '0' for GPU."
    )
    return p.parse_args()


# ---------------------------------------------------------------------------
# Core evaluation
# ---------------------------------------------------------------------------
def evaluate_model(model_path: str, data_yaml: str, device=None) -> dict:
    """Run YOLO validation on the test split and return raw metrics.

    Parameters
    ----------
    model_path : str
        Path to the .pt model file.
    data_yaml : str
        Path to the dataset YAML (must contain a ``test`` key).
    device : str or None
        Optional device override (e.g. ``'cpu'``, ``'0'``).

    Returns
    -------
    dict
        Dictionary with overall and per-class metrics.
    """
    model = YOLO(model_path)

    val_kwargs = dict(data=data_yaml, split="test", verbose=False)
    if device is not None:
        val_kwargs["device"] = device

    metrics = model.val(**val_kwargs)

    # ------------------------------------------------------------------
    # Overall metrics
    # ------------------------------------------------------------------
    map50 = float(metrics.box.map50)
    map50_95 = float(metrics.box.map)
    precision = float(metrics.box.mp)
    recall = float(metrics.box.mr)

    # Harmonic mean (F1)
    if precision + recall > 0:
        f1 = 2 * precision * recall / (precision + recall)
    else:
        f1 = 0.0

    # ------------------------------------------------------------------
    # Per-class metrics
    # metrics.box.p, .r, .ap50 are numpy arrays indexed by class id
    # ------------------------------------------------------------------
    per_class = {}
    for cls_id, cls_name in enumerate(CLASS_NAMES):
        if cls_id < len(metrics.box.p):
            per_class[cls_name] = {
                "precision": round(float(metrics.box.p[cls_id]), 4),
                "recall":    round(float(metrics.box.r[cls_id]), 4),
                "ap50":      round(float(metrics.box.ap50[cls_id]), 4),
            }
        else:
            # Class was not present in the test set
            per_class[cls_name] = {
                "precision": 0.0,
                "recall":    0.0,
                "ap50":      0.0,
            }

    return {
        "mAP50":     round(map50, 4),
        "mAP50_95":  round(map50_95, 4),
        "precision":  round(precision, 4),
        "recall":     round(recall, 4),
        "f1":         round(f1, 4),
        "per_class":  per_class,
    }


# ---------------------------------------------------------------------------
# Saving & printing
# ---------------------------------------------------------------------------
def build_results_dict(eval_metrics: dict, round_num: int,
                       method: str, budget: int, total_pool: int,
                       label: str | None = None) -> dict:
    """Assemble the full results dictionary ready for JSON serialisation.

    Parameters
    ----------
    eval_metrics : dict
        Output of evaluate_model().
    round_num : int
        Active-learning round number.
    method : str
        Selection method name (e.g. 'labelless', 'random').
    budget : int
        Number of images reviewed this round.
    total_pool : int
        Total pool size.
    label : str or None
        Optional ablation label appended to the result filename
        (e.g. 'budget50', 'no_diversity').  When provided it is stored in the
        results dict so aggregate_metrics.py can display it.
    """
    result = {
        "method":            method,
        "round":             round_num,
        "budget":            budget,
        "total_pool_images": total_pool,
        "images_reviewed":   budget,
        "mAP50":             eval_metrics["mAP50"],
        "mAP50_95":          eval_metrics["mAP50_95"],
        "precision":         eval_metrics["precision"],
        "recall":            eval_metrics["recall"],
        "f1":                eval_metrics["f1"],
        "per_class":         eval_metrics["per_class"],
    }
    if label:
        result["label"] = label
    return result


def save_metrics(results: dict, output_dir: Path,
                 label: str | None = None) -> Path:
    """Write the results dict to ``round_N_method[_label].json``.

    Parameters
    ----------
    results : dict
        Full results dictionary.
    output_dir : Path
        Directory for metric files (created if absent).
    label : str or None
        Optional suffix appended to the filename before the extension, so
        ablation variants at the same round/method do not overwrite each other.
        E.g. label='budget50' → ``round_1_labelless_budget50.json``.

    Returns
    -------
    Path
        The written JSON file path.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    base = f"round_{results['round']}_{results['method']}"
    if label:
        base = f"{base}_{label}"
    filename = f"{base}.json"
    out_path = output_dir / filename

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    return out_path


def print_summary(results: dict, saved_path: Path) -> None:
    """Print a formatted summary table to stdout."""
    r = results
    sep = "=" * 50

    print(sep)
    print(f"  Round {r['round']} | Method: {r['method']}")
    print(f"  Budget: {r['budget']} / {r['total_pool_images']} pool images")
    print(sep)
    print(f"  mAP50:       {r['mAP50']:.4f}")
    print(f"  mAP50-95:    {r['mAP50_95']:.4f}")
    print(f"  Precision:   {r['precision']:.4f}")
    print(f"  Recall:      {r['recall']:.4f}")
    print(f"  F1:          {r['f1']:.4f}")
    print(sep)
    print("  Per-class AP50:")
    for cls_name, cls_metrics in r["per_class"].items():
        print(f"    {cls_name:<20s} {cls_metrics['ap50']:.4f}")
    print(sep)
    print(f"  Saved -> {saved_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    """Entry point: parse args -> evaluate -> save -> print."""
    args = parse_args()

    # Resolve the metrics output directory relative to the project root
    project_root = Path(__file__).resolve().parent.parent
    metrics_dir = project_root / "results" / "metrics"

    print(f"Loading model from {args.model} ...")
    eval_metrics = evaluate_model(args.model, args.data, device=args.device)

    results = build_results_dict(
        eval_metrics,
        round_num=args.round_num,
        method=args.method,
        budget=args.budget,
        total_pool=args.total_pool,
    )

    saved_path = save_metrics(results, metrics_dir)
    print_summary(results, saved_path)


if __name__ == "__main__":
    main()
