"""
run_experiment.py

End-to-end experiment runner for LabelLess AI.
Orchestrates: select images → build dataset → train YOLO → evaluate → save metrics.

Supports selection methods:
  --method random              : Randomly pick N images from pool
  --method uncertainty         : Pick the N highest-uncertainty images (U = 0.60*(1-avg) + 0.40*(1-min))
  --method confidence          : (Alias for uncertainty)
  --method uncertainty_rarity  : Score by uncertainty + rarity only (w_unc=0.70, w_rare=0.20, w_div=0.0)
  --method labelless           : Full tri-factor score (uncertainty + rarity + diversity)
                                 Uses Person B's ranked_queue.json (top N)

For 'random', 'uncertainty', and 'uncertainty_rarity' methods, the script
generates synthetic human_labels.json by looking up ground-truth labels from
data/pool_ground_truth_hidden/ (simulating perfect human review).

Use --label <name> to give an experiment a unique suffix in its result filename,
preventing ablation variants from overwriting each other:
    round_1_labelless.json            (no label)
    round_1_labelless_budget50.json   (--label budget50)

Usage:
    python scripts/run_experiment.py --method uncertainty --round 1 --budget 100
    python scripts/run_experiment.py --method uncertainty_rarity --round 1 --budget 100
    python scripts/run_experiment.py --method labelless --round 1 --budget 100
    python scripts/run_experiment.py --method random --round 1 --budget 50 --epochs 10
    python scripts/run_experiment.py --method labelless --round 1 --budget 50 --label budget50
"""

from __future__ import annotations

import argparse
import json
import random
import shutil
import sys
import time
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# ---------------------------------------------------------------------------
# Allow importing from the same directory
# ---------------------------------------------------------------------------
_SCRIPT_DIR = Path(__file__).resolve().parent
if str(_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPT_DIR))

from class_map import CLASS_NAMES, CLASS_TO_ID, NUM_CLASSES  # noqa: E402

# Project root
PROJECT_ROOT = _SCRIPT_DIR.parent

# Default paths
DEFAULT_DATA_DIR = PROJECT_ROOT / "data"
DEFAULT_PREDICTIONS = PROJECT_ROOT / "outputs" / "predictions.json"
DEFAULT_RANKED_QUEUE = PROJECT_ROOT / "inputs" / "ranked_queue.json"
DEFAULT_HUMAN_LABELS = PROJECT_ROOT / "inputs" / "human_labels.json"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}


# ---------------------------------------------------------------------------
# Image selection strategies
# ---------------------------------------------------------------------------

def select_random(pool_images: list[str], budget: int, seed: int = 42) -> list[str]:
    """Select N random images from the pool."""
    rng = random.Random(seed)
    selected = rng.sample(pool_images, min(budget, len(pool_images)))
    return selected


def select_uncertainty(predictions_path: Path, budget: int) -> list[str]:
    """Select the top-N images ranked by canonical uncertainty score.

    Uses rank.py's rank_predictions() with w_unc=1.0, w_rare=0.0, w_div=0.0.
    The underlying uncertainty formula matches the full pipeline:
        U = 0.60 * (1.0 - avg_conf) + 0.40 * (1.0 - min_conf)
    (or U = 1.0 for images with 0 detections).
    """
    from rank import rank_predictions

    with open(predictions_path, "r", encoding="utf-8") as f:
        predictions = json.load(f)

    ranked = rank_predictions(predictions, w_unc=1.0, w_rare=0.0, w_div=0.0)
    return [item["image_id"] for item in ranked[:budget]]


def select_by_confidence(predictions_path: Path, budget: int) -> list[str]:
    """Backwards-compatible alias for select_uncertainty.

    Delegates directly to select_uncertainty() using canonical uncertainty scoring.
    """
    return select_uncertainty(predictions_path, budget)


def select_labelless(predictions_path: Path, budget: int) -> list[str]:
    """Select the top-N images using the full canonical LabelLess tri-factor formula.

    Freshly scores outputs/predictions.json with:
        P = w_uncertainty * U + w_rare_class * R + w_diversity * D
    using the weights from config.yaml (frozen at 0.70 / 0.20 / 0.10).
    Does NOT rely on a pre-existing inputs/ranked_queue.json.
    """
    from rank import rank_predictions
    from load_config import cfg

    with open(predictions_path, "r", encoding="utf-8") as f:
        predictions = json.load(f)

    ranking = cfg["ranking"]
    w_unc  = ranking["w_uncertainty"]   # 0.70
    w_rare = ranking["w_rare_class"]    # 0.20
    w_div  = ranking["w_diversity"]     # 0.10

    ranked = rank_predictions(predictions, w_unc=w_unc, w_rare=w_rare, w_div=w_div)
    return [item["image_id"] for item in ranked[:budget]]


def select_uncertainty_rarity(predictions_path: Path, budget: int) -> list[str]:
    """Select the top-N images ranked by uncertainty + rarity only (no diversity).

    Uses rank.py's existing scoring functions directly with w_div=0.0 so that
    diversity contributes nothing to the composite score.  The uncertainty and
    rarity weights are taken from config.yaml (w_uncertainty and w_rare_class)
    and re-normalised to sum to 1.0, preserving their ratio.

    This avoids duplicating any scoring logic: all calculation is delegated to
    rank.py's rank_predictions() with an explicit diversity-weight override.
    """
    from rank import rank_predictions
    from load_config import cfg

    with open(predictions_path, "r", encoding="utf-8") as f:
        predictions = json.load(f)

    ranking = cfg["ranking"]
    w_unc_raw = ranking["w_uncertainty"]
    w_rare_raw = ranking["w_rare_class"]

    # Re-normalise the two active weights so they sum to 1.0
    total = w_unc_raw + w_rare_raw
    if total <= 0:
        # Degenerate config — fall back to equal split
        w_unc, w_rare = 0.5, 0.5
    else:
        w_unc = w_unc_raw / total
        w_rare = w_rare_raw / total

    ranked = rank_predictions(predictions, w_unc=w_unc, w_rare=w_rare, w_div=0.0)
    return [item["image_id"] for item in ranked[:budget]]


# ---------------------------------------------------------------------------
# Synthetic human labels (for random/confidence methods)
# ---------------------------------------------------------------------------

def generate_synthetic_human_labels(
    selected_images: list[str],
    ground_truth_dir: Path,
    pool_images_dir: Path,
) -> dict:
    """Create synthetic human_labels.json from hidden ground truth.

    For each selected image, look up its ground-truth YOLO label file
    and convert it back to the human_labels.json format.
    If no ground truth exists, mark as 'reject'.
    """
    labels = []

    for image_name in selected_images:
        stem = Path(image_name).stem
        gt_label = ground_truth_dir / "labels" / f"{stem}.txt"

        if gt_label.exists():
            boxes = []
            lines = gt_label.read_text(encoding="utf-8").strip().split("\n")
            for line in lines:
                parts = line.strip().split()
                if len(parts) >= 5:
                    cls_id = int(parts[0])
                    xc, yc, w, h = float(parts[1]), float(parts[2]), float(parts[3]), float(parts[4])
                    # Convert YOLO normalized → percentage (0-100) for consistency
                    boxes.append({
                        "class_id": cls_id,
                        "class_name": CLASS_NAMES[cls_id] if cls_id < len(CLASS_NAMES) else f"class_{cls_id}",
                        "x": round((xc - w / 2) * 100, 2),
                        "y": round((yc - h / 2) * 100, 2),
                        "width": round(w * 100, 2),
                        "height": round(h * 100, 2),
                        "confidence": 1.0,
                    })

            labels.append({
                "image_id": image_name,
                "action": "accept",
                "boxes": boxes,
            })
        else:
            # No ground truth available — still include as accept with no boxes
            # (the image was in the pool but had no labels)
            labels.append({
                "image_id": image_name,
                "action": "accept",
                "boxes": [],
            })

    return {"labels": labels}


# ---------------------------------------------------------------------------
# Main experiment runner
# ---------------------------------------------------------------------------

def run_experiment(args):
    """Execute the full experiment pipeline."""
    from build_dataset import build_dataset
    from retrain import train as run_training, detect_device
    from evaluate import evaluate_model, build_results_dict, save_metrics, print_summary

    data_dir = Path(args.data_dir)
    seed_dir = data_dir / "seed"
    pool_dir = data_dir / "pool" / "images"
    test_dir = data_dir / "test"
    gt_dir = data_dir / "pool_ground_truth_hidden"
    rounds_dir = data_dir / "rounds"
    predictions_path = Path(args.predictions)
    ranked_queue_path = Path(args.ranked_queue)

    round_num = args.round
    budget = args.budget
    method = args.method
    label = getattr(args, "label", None) or None  # None when empty string

    print("\n" + "=" * 60)
    print("  LabelLess AI - Experiment Runner")
    print("=" * 60)
    print(f"  Method       : {method}")
    print(f"  Round        : {round_num}")
    print(f"  Budget       : {budget}")
    if label:
        print(f"  Label        : {label}")
    print(f"  Epochs       : {args.epochs}")
    print(f"  Data dir     : {data_dir}")
    print("=" * 60)

    # ---- Step 1: Select images ----
    print(f"\n[1/5] Selecting {budget} images using '{method}' strategy ...")

    if method == "random":
        # Get list of pool image names
        if pool_dir.exists():
            pool_images = [f.name for f in sorted(pool_dir.iterdir())
                          if f.suffix.lower() in IMAGE_EXTS]
        else:
            # Fall back to predictions.json
            with open(predictions_path, "r") as f:
                preds = json.load(f)
            pool_images = [e["image"] for e in preds]
        selected = select_random(pool_images, budget, seed=42 + round_num)

    elif method in ("uncertainty", "confidence"):
        selected = select_uncertainty(predictions_path, budget)
        method = "uncertainty"  # Normalize method name for results output

    elif method == "uncertainty_rarity":
        selected = select_uncertainty_rarity(predictions_path, budget)

    elif method == "labelless":
        selected = select_labelless(predictions_path, budget)

    else:
        print(f"ERROR: Unknown method '{method}'", file=sys.stderr)
        sys.exit(1)

    print(f"  -> Selected {len(selected)} images")

    # ---- Step 2: Generate/load human labels ----
    print("\nLoading human labels...        ", end="")

    round_output = rounds_dir / f"round_{round_num}"
    human_labels_path = round_output / "human_labels.json"
    round_output.mkdir(parents=True, exist_ok=True)

    # labelless uses real human labels (from Person C's UI review).
    # All other methods simulate perfect labelling from hidden ground truth.
    if method == "labelless" and Path(args.human_labels).exists():
        shutil.copy2(args.human_labels, human_labels_path)
        print("[OK] (from real human labels)")
    else:
        # random, uncertainty (or confidence alias), uncertainty_rarity → synthetic labels from ground truth
        synthetic = generate_synthetic_human_labels(selected, gt_dir, pool_dir)
        with open(human_labels_path, "w", encoding="utf-8") as f:
            json.dump(synthetic, f, indent=2)
        print(f"[OK] (synthetic from ground truth, {len(synthetic['labels'])} entries)")

    # ---- Step 3: Build dataset ----
    print("Building dataset...            ", end="")
    dataset_output = round_output / "dataset"

    build_dataset(
        seed_dir=seed_dir,
        pool_dir=pool_dir,
        human_labels=human_labels_path,
        round_num=round_num,
        output_dir=dataset_output,
        test_dir=test_dir,
    )
    print("[OK]")

    dataset_yaml = dataset_output / "dataset.yaml"

    # ---- Step 4: Train YOLO ----
    print("Training YOLO...               ", end="")

    # Determine base model
    if round_num == 0:
        base_model = "yolov8n.pt"
    else:
        prev_model = PROJECT_ROOT / f"models/round_{round_num - 1}/best.pt"
        finetuned_model = PROJECT_ROOT / "models/finetuned/weights/best.pt"
        if prev_model.exists():
            base_model = str(prev_model)
        elif round_num == 1 and finetuned_model.exists():
            base_model = str(finetuned_model)
            print(f"\n  [INFO] Using seed baseline model: {finetuned_model}")
        else:
            base_model = "yolov8n.pt"
            print(f"\n  [WARN] Previous round model not found: {prev_model}")
            print(f"  [WARN] Falling back to pretrained yolov8n.pt")

    # Create a namespace object for the train function
    class TrainArgs:
        pass

    train_args = TrainArgs()
    train_args.data = str(dataset_yaml)
    train_args.model = base_model
    train_args.round = round_num
    train_args.epochs = args.epochs
    train_args.batch = args.batch
    train_args.imgsz = args.imgsz
    train_args.patience = args.patience
    train_args.device = args.device

    start_time = time.time()
    run_training(train_args)
    train_elapsed = time.time() - start_time
    print("[OK]")

    # ---- Step 5: Evaluate ----
    print("Evaluating on test set...      ", end="")

    model_path = PROJECT_ROOT / f"models/round_{round_num}/best.pt"
    if not model_path.exists():
        print(f"\n  ERROR: Trained model not found at {model_path}")
        sys.exit(1)

    eval_metrics = evaluate_model(
        str(model_path),
        str(dataset_yaml),
        device=args.device if args.device != "auto" else None,
    )

    # Count total pool
    if pool_dir.exists():
        total_pool = len([f for f in pool_dir.iterdir() if f.suffix.lower() in IMAGE_EXTS])
    else:
        total_pool = 971  # fallback

    results = build_results_dict(
        eval_metrics,
        round_num=round_num,
        method=method,
        budget=budget,
        total_pool=total_pool,
        label=label,
    )

    metrics_dir = PROJECT_ROOT / "results" / "metrics"
    saved_path = save_metrics(results, metrics_dir, label=label)
    print("[OK]")

    # ---- Summary ----
    print("\n")
    print_summary(results, saved_path)

    minutes, seconds = divmod(int(train_elapsed), 60)
    print(f"\n  Total training time: {minutes}m {seconds}s")
    print(f"  Experiment complete!\n")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(
        description="LabelLess AI — End-to-end experiment runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python scripts/run_experiment.py --method random --round 1 --budget 100\n"
            "  python scripts/run_experiment.py --method uncertainty --round 1 --budget 100\n"
            "  python scripts/run_experiment.py --method uncertainty_rarity --round 1 --budget 100\n"
            "  python scripts/run_experiment.py --method labelless --round 1 --budget 100\n"
            "\n"
            "  # Ablation: same method, different budgets — filenames won't collide\n"
            "  python scripts/run_experiment.py --method labelless --round 1 --budget 50 --label budget50\n"
            "  python scripts/run_experiment.py --method labelless --round 1 --budget 100 --label budget100\n"
        ),
    )

    parser.add_argument(
        "--method", required=True,
        choices=["random", "uncertainty", "confidence", "uncertainty_rarity", "labelless"],
        help="Image selection strategy ('uncertainty', 'uncertainty_rarity', 'labelless', 'random'; 'confidence' is an alias for 'uncertainty').",
    )
    parser.add_argument(
        "--round", type=int, required=True,
        help="Active-learning round number (0-indexed).",
    )
    parser.add_argument(
        "--budget", type=int, required=True,
        help="Number of images to select for human review.",
    )
    parser.add_argument(
        "--label", default=None,
        help=(
            "Optional suffix added to the result filename to prevent ablation "
            "variants from overwriting each other.  "
            "E.g. --label budget50 produces round_1_labelless_budget50.json."
        ),
    )
    parser.add_argument(
        "--epochs", type=int, default=20,
        help="Training epochs (default: 20).",
    )
    parser.add_argument(
        "--batch", type=int, default=16,
        help="Batch size (default: 16).",
    )
    parser.add_argument(
        "--imgsz", type=int, default=640,
        help="Image size (default: 640).",
    )
    parser.add_argument(
        "--patience", type=int, default=10,
        help="Early stopping patience (default: 10).",
    )
    parser.add_argument(
        "--device", default="auto",
        help="Device: 'auto', '0' for CUDA, 'mps', 'cpu' (default: auto).",
    )
    parser.add_argument(
        "--data-dir", default=str(DEFAULT_DATA_DIR),
        help=f"Data directory (default: {DEFAULT_DATA_DIR}).",
    )
    parser.add_argument(
        "--predictions", default=str(DEFAULT_PREDICTIONS),
        help=f"Path to predictions.json (default: {DEFAULT_PREDICTIONS}).",
    )
    parser.add_argument(
        "--ranked-queue", default=str(DEFAULT_RANKED_QUEUE),
        help=f"Path to ranked_queue.json (default: {DEFAULT_RANKED_QUEUE}).",
    )
    parser.add_argument(
        "--human-labels", default=str(DEFAULT_HUMAN_LABELS),
        help=f"Path to human_labels.json (default: {DEFAULT_HUMAN_LABELS}).",
    )

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    try:
        run_experiment(args)
    except KeyboardInterrupt:
        print("\nExperiment interrupted by user.", file=sys.stderr)
        sys.exit(130)
    except Exception as exc:
        print(f"\nERROR: Experiment failed: {exc}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
