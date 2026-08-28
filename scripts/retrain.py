#!/usr/bin/env python3
"""
retrain.py - Train YOLO on a round's dataset, building from the previous round's model.

Round 0: fine-tunes from pretrained yolov8n.pt on the seed dataset.
Round N (N>=1): fine-tunes from models/round_{N-1}/best.pt.

Results are saved to models/round_N/ with best.pt and last.pt copied from
the Ultralytics training output directory.

Usage:
    # Round 0 - initial training from pretrained weights
    python scripts/retrain.py \\
        --data data/rounds/round_0/dataset.yaml \\
        --round 0 \\
        --epochs 50

    # Round N - fine-tune from previous round
    python scripts/retrain.py \\
        --data data/rounds/round_1/dataset.yaml \\
        --model models/round_0/best.pt \\
        --round 1 \\
        --epochs 20 \\
        --batch 16 \\
        --imgsz 640 \\
        --device auto

Classes:
    0: undamagedbuilding
    1: damagedbuilding
    2: fire
    3: smoke
"""

import argparse
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
# Device detection utility
# ---------------------------------------------------------------------------

def detect_device(preference='auto'):
    """Detect the best available compute device for training.

    Priority order: CUDA > MPS > CPU.

    Args:
        preference: Explicit device string ('0', 'cpu', 'mps') or 'auto'
                    to let the function choose the best available device.

    Returns:
        Device string suitable for the Ultralytics YOLO API.
    """
    if preference != 'auto':
        return preference

    import torch

    if torch.cuda.is_available():
        return '0'  # first CUDA GPU
    if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        return 'mps'
    return 'cpu'


# ---------------------------------------------------------------------------
# Core training logic
# ---------------------------------------------------------------------------

def resolve_model_path(model_arg, round_num, project_root):
    """Resolve which model weights to start training from.

    Args:
        model_arg: Explicit model path provided via CLI (may be None).
        round_num: Current training round number.
        project_root: Path to the project root directory.

    Returns:
        Path object pointing to the model weights file.

    Raises:
        FileNotFoundError: If the resolved model file does not exist
                           (only for round >= 1 with explicit/implicit paths).
    """
    if model_arg:
        model_str = str(model_arg)
        # Check if it's a standard ultralytics weight name that can be auto-downloaded
        standard_weights = {"yolov8n.pt", "yolov8s.pt", "yolov8m.pt", "yolov8l.pt", "yolov8x.pt"}
        if model_str.lower() in standard_weights:
            return model_str

        model_path = Path(model_arg)
        if not model_path.is_absolute():
            model_path = project_root / model_path
        if not model_path.exists():
            raise FileNotFoundError(
                f"Specified model not found: {model_path}"
            )
        return model_path

    if round_num == 0:
        # Use pretrained YOLOv8-nano; Ultralytics downloads if needed
        return 'yolov8n.pt'

    # Default: pick up previous round's best weights
    prev_model = project_root / f'models/round_{round_num - 1}/best.pt'
    if not prev_model.exists():
        # If round 1, also check for Person A's finetuned seed model
        if round_num == 1:
            finetuned_model = project_root / 'models/finetuned/weights/best.pt'
            if finetuned_model.exists():
                return finetuned_model
        raise FileNotFoundError(
            f"Previous round model not found: {prev_model}\n"
            f"Train round {round_num - 1} first, or pass --model explicitly."
        )
    return prev_model


def copy_weights(ultralytics_run_dir, dest_dir):
    """Copy best.pt and last.pt from an Ultralytics run to the target directory.

    Args:
        ultralytics_run_dir: Path to the Ultralytics training run output
                             (e.g. runs/detect/round_1/).
        dest_dir: Destination directory (e.g. models/round_1/).

    Returns:
        Tuple of (best_dest, last_dest) Path objects.

    Raises:
        FileNotFoundError: If the expected weight files are missing.
    """
    weights_dir = Path(ultralytics_run_dir) / 'weights'
    best_src = weights_dir / 'best.pt'
    last_src = weights_dir / 'last.pt'

    if not best_src.exists():
        raise FileNotFoundError(
            f"best.pt not found in {weights_dir}. Training may have failed."
        )

    dest_dir = Path(dest_dir)
    dest_dir.mkdir(parents=True, exist_ok=True)

    best_dest = dest_dir / 'best.pt'
    last_dest = dest_dir / 'last.pt'

    shutil.copy2(best_src, best_dest)
    print(f"  Copied best.pt  -> {best_dest}")

    if last_src.exists():
        shutil.copy2(last_src, last_dest)
        print(f"  Copied last.pt  -> {last_dest}")
    else:
        print("  Warning: last.pt not found, skipping copy.")
        last_dest = None

    return best_dest, last_dest


def train(args):
    """Execute the full training pipeline.

    Args:
        args: Parsed argparse namespace with training configuration.
    """
    # Lazy import so --help is fast even without ultralytics installed
    from ultralytics import YOLO

    project_root = Path(__file__).resolve().parent.parent

    # --- Resolve paths -------------------------------------------------------
    data_path = Path(args.data)
    if not data_path.is_absolute():
        data_path = project_root / data_path
    if not data_path.exists():
        print(f"ERROR: Dataset YAML not found: {data_path}", file=sys.stderr)
        sys.exit(1)

    device = detect_device(args.device)
    model_path = resolve_model_path(args.model, args.round, project_root)

    output_dir = project_root / f'models/round_{args.round}'
    ultralytics_project = str(project_root / 'runs' / 'detect')
    ultralytics_name = f'round_{args.round}'

    # --- Print configuration summary -----------------------------------------
    print("=" * 60)
    print("  LabelLess AI - YOLO Retraining")
    print("=" * 60)
    print(f"  Round        : {args.round}")
    print(f"  Base model   : {model_path}")
    print(f"  Dataset YAML : {data_path}")
    print(f"  Device       : {device}")
    print(f"  Epochs       : {args.epochs}")
    print(f"  Batch size   : {args.batch}")
    print(f"  Image size   : {args.imgsz}")
    print(f"  Patience     : {args.patience}")
    print(f"  Output dir   : {output_dir}")
    print(f"  Ultralytics  : {ultralytics_project}/{ultralytics_name}")
    print("=" * 60)

    # --- Load model ----------------------------------------------------------
    print(f"\n[1/3] Loading model from {model_path} ...")
    model = YOLO(str(model_path))
    print("  Model loaded successfully.")

    # --- Train ---------------------------------------------------------------
    print(f"\n[2/3] Starting training for {args.epochs} epochs ...")
    start_time = time.time()

    results = model.train(
        data=str(data_path),
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        patience=args.patience,
        device=device,
        project=ultralytics_project,
        name=ultralytics_name,
        exist_ok=True,
        verbose=True,
    )

    elapsed = time.time() - start_time
    minutes, seconds = divmod(int(elapsed), 60)
    print(f"\n  Training completed in {minutes}m {seconds}s.")

    # --- Copy weights --------------------------------------------------------
    print(f"\n[3/3] Copying weights to {output_dir} ...")
    run_dir = Path(ultralytics_project) / ultralytics_name
    best_dest, last_dest = copy_weights(run_dir, output_dir)

    # --- Completion summary --------------------------------------------------
    print("\n" + "=" * 60)
    print("  Training Complete!")
    print("=" * 60)
    print(f"  Round          : {args.round}")
    print(f"  Best weights   : {best_dest}")
    if last_dest:
        print(f"  Last weights   : {last_dest}")
    print(f"  Ultralytics dir: {run_dir}")
    print(f"  Duration       : {minutes}m {seconds}s")
    print("=" * 60)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args():
    """Parse command-line arguments for YOLO retraining.

    Returns:
        argparse.Namespace with all training parameters.
    """
    parser = argparse.ArgumentParser(
        description=(
            "Train YOLO on a round's dataset, building from the previous "
            "round's model. Round 0 fine-tunes from pretrained yolov8n.pt; "
            "subsequent rounds fine-tune from models/round_{N-1}/best.pt."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  # Round 0 (seed training)\n"
            "  python scripts/retrain.py --data data/rounds/round_0/dataset.yaml --round 0\n"
            "\n"
            "  # Round 1 (fine-tune from round 0)\n"
            "  python scripts/retrain.py \\\n"
            "      --data data/rounds/round_1/dataset.yaml \\\n"
            "      --model models/round_0/best.pt \\\n"
            "      --round 1 --epochs 20 --batch 16\n"
        ),
    )

    parser.add_argument(
        '--data', type=str, required=True,
        help='Path to dataset YAML file (e.g. data/rounds/round_1/dataset.yaml).'
    )
    parser.add_argument(
        '--model', type=str, default=None,
        help=(
            'Path to base model weights. Defaults to yolov8n.pt for round 0, '
            'or models/round_{N-1}/best.pt for round N>=1.'
        ),
    )
    parser.add_argument(
        '--round', type=int, required=True,
        help='Current round number (0-indexed).'
    )
    parser.add_argument(
        '--epochs', type=int, default=50,
        help='Number of training epochs (default: 50).'
    )
    parser.add_argument(
        '--batch', type=int, default=16,
        help='Batch size (default: 16).'
    )
    parser.add_argument(
        '--imgsz', type=int, default=640,
        help='Input image size in pixels (default: 640).'
    )
    parser.add_argument(
        '--patience', type=int, default=10,
        help='Early stopping patience in epochs (default: 10).'
    )
    parser.add_argument(
        '--device', type=str, default='auto',
        help="Device: 'auto' (default), '0' for CUDA, 'mps', or 'cpu'."
    )

    return parser.parse_args()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    args = parse_args()

    try:
        train(args)
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nTraining interrupted by user.", file=sys.stderr)
        sys.exit(130)
    except Exception as exc:
        print(f"ERROR: Training failed: {exc}", file=sys.stderr)
        sys.exit(1)
