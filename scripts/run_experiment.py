"""
run_experiment.py

End-to-end experiment runner for LabelLess AI.
Orchestrates: select images → build dataset → train YOLO → evaluate → save metrics.

Supports three selection methods:
  --method random      : Randomly pick N images from pool
  --method confidence  : Pick the N lowest-confidence images from predictions.json
  --method labelless   : Use Person B's ranked_queue.json (top N)

For 'random' and 'confidence' methods, the script generates synthetic
human_labels.json by looking up ground-truth labels from
data/pool_ground_truth_hidden/ (simulating perfect human review).

Usage:
    python scripts/run_experiment.py \
        --method labelless \
        --round 1 \
        --budget 100

    python scripts/run_experiment.py \
        --method random \
        --round 1 \
        --budget 50 \
        --epochs 10
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


def select_by_confidence(predictions_path: Path, budget: int) -> list[str]:
    """Select the N lowest-confidence images from predictions.json."""
    with open(predictions_path, "r", encoding="utf-8") as f:
        predictions = json.load(f)

    # Compute average confidence per image
    image_confs = []
    for entry in predictions:
        preds = entry.get("predictions", [])
        if preds:
            avg_conf = sum(p["confidence"] for p in preds) / len(preds)
        else:
            avg_conf = 0.0  # No detections = most uncertain
        image_confs.append((entry["image"], avg_conf))

    # Sort by confidence ascending (lowest first)
    image_confs.sort(key=lambda x: x[1])
    return [img for img, _ in image_confs[:budget]]


def select_labelless(ranked_queue_path: Path, budget: int) -> list[str]:
    """Select the top-N images from Person B's ranked_queue.json."""
    with open(ranked_queue_path, "r", encoding="utf-8") as f:
        queue = json.load(f)

    ranked = queue.get("ranked_images", queue if isinstance(queue, list) else [])
    # Already sorted by priority descending
    return [entry["image_id"] for entry in ranked[:budget]]


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

    print("\n" + "=" * 60)
    print("  LabelLess AI - Experiment Runner")
    print("=" * 60)
    print(f"  Method       : {method}")
    print(f"  Round        : {round_num}")
    print(f"  Budget       : {budget}")
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

    elif method == "confidence":
        selected = select_by_confidence(predictions_path, budget)

    elif method == "labelless":
        selected = select_labelless(ranked_queue_path, budget)

    else:
        print(f"ERROR: Unknown method '{method}'", file=sys.stderr)
        sys.exit(1)

    print(f"  -> Selected {len(selected)} images")

    # ---- Step 2: Generate/load human labels ----
    print("Loading human labels...        ", end="")

    round_output = rounds_dir / f"round_{round_num}"
    human_labels_path = round_output / "human_labels.json"
    round_output.mkdir(parents=True, exist_ok=True)

    if getattr(args, "use_real_human_labels", False) and method == "labelless" and Path(args.human_labels).exists():
        # Use the actual human labels file
        shutil.copy2(args.human_labels, human_labels_path)
        print("[OK] (from real human labels)")
    else:
        # Generate synthetic labels from ground truth for all selected pool images
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
    elif getattr(args, "base_model", None) and Path(args.base_model).exists():
        base_model = args.base_model
        print(f"\n  [INFO] Using specified base model: {base_model}")
    else:
        round0_model = PROJECT_ROOT / "models/round_0/best.pt"
        prev_model = PROJECT_ROOT / f"models/round_{round_num - 1}/best.pt"
        finetuned_model = PROJECT_ROOT / "models/finetuned/weights/best.pt"
        if round0_model.exists():
            base_model = str(round0_model)
            print(f"\n  [INFO] Using seed baseline model (round 0): {round0_model}")
        elif prev_model.exists():
            base_model = str(prev_model)
            print(f"\n  [INFO] Using previous round model: {prev_model}")
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
    )

    metrics_dir = PROJECT_ROOT / "results" / "metrics"
    saved_path = save_metrics(results, metrics_dir)
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
            "  python scripts/run_experiment.py --method confidence --round 1 --budget 100\n"
            "  python scripts/run_experiment.py --method labelless --round 1 --budget 100\n"
        ),
    )

    parser.add_argument(
        "--method", required=True, choices=["random", "confidence", "labelless"],
        help="Image selection strategy.",
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
        "--base-model", default=None,
        help="Optional path to base .pt model to finetune from.",
    )
    parser.add_argument(
        "--use-real-human-labels", action="store_true",
        help="Use inputs/human_labels.json directly instead of synthetic labels.",
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
