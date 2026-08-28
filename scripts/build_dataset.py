"""
build_dataset.py

Merges seed labels and human-reviewed labels into a YOLO-format training
dataset for a given active-learning round.

Workflow:
  1. Copy all seed images + labels as the base dataset.
  2. If round > 1, also include images/labels from previous rounds.
  3. Read human_labels.json and process each entry:
       - "accept"  → use the provided boxes as labels
       - "correct" → use the corrected boxes as labels
       - "reject"  → skip the image (exclude from training)
  4. Convert bounding boxes to YOLO format
     (class_id  x_center  y_center  width  height, normalised 0-1).
  5. Copy the corresponding images from the pool directory.
  6. Generate a dataset.yaml for Ultralytics YOLO training.

Two bbox input formats are auto-detected:
  • Person-C / percentage format:  {x, y, width, height}  (0-100)
  • Pixel format:                  {x1, y1, x2, y2}       (pixels)
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# ---------------------------------------------------------------------------
# Allow importing class_map from the same directory as this script
# ---------------------------------------------------------------------------
_SCRIPT_DIR = Path(__file__).resolve().parent
if str(_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPT_DIR))

from class_map import CLASS_NAMES, CLASS_TO_ID, NUM_CLASSES  # noqa: E402


# ---- bbox helpers ---------------------------------------------------------

def _is_percentage_format(box: dict) -> bool:
    """Return True if the box uses Person-C percentage keys {x, y, width, height}."""
    return "width" in box and "height" in box and "x" in box and "y" in box


def _is_pixel_format(box: dict) -> bool:
    """Return True if the box uses pixel-coord keys {x1, y1, x2, y2}."""
    return all(k in box for k in ("x1", "y1", "x2", "y2"))


def _percentage_to_yolo(box: dict) -> tuple[float, float, float, float]:
    """Convert {x, y, width, height} (0-100 percentages) → YOLO normalised."""
    x = float(box["x"])
    y = float(box["y"])
    w = float(box["width"])
    h = float(box["height"])
    x_center = (x + w / 2.0) / 100.0
    y_center = (y + h / 2.0) / 100.0
    return x_center, y_center, w / 100.0, h / 100.0


def _pixel_to_yolo(box: dict, img_w: int, img_h: int) -> tuple[float, float, float, float]:
    """Convert {x1, y1, x2, y2} pixel coords → YOLO normalised."""
    x1 = float(box["x1"])
    y1 = float(box["y1"])
    x2 = float(box["x2"])
    y2 = float(box["y2"])
    x_center = ((x1 + x2) / 2.0) / img_w
    y_center = ((y1 + y2) / 2.0) / img_h
    w = (x2 - x1) / img_w
    h = (y2 - y1) / img_h
    return x_center, y_center, w, h


def _get_image_dimensions(image_path: Path) -> tuple[int, int]:
    """Return (width, height) of an image using PIL."""
    from PIL import Image

    with Image.open(image_path) as img:
        return img.size  # (width, height)


def _convert_box(box: dict, image_path: Path | None = None) -> tuple[float, float, float, float]:
    """Auto-detect format and return YOLO-normalised (xc, yc, w, h)."""
    if _is_percentage_format(box):
        return _percentage_to_yolo(box)
    elif _is_pixel_format(box):
        if image_path is None or not image_path.exists():
            raise FileNotFoundError(
                f"Image required for pixel→YOLO conversion but not found: {image_path}"
            )
        img_w, img_h = _get_image_dimensions(image_path)
        return _pixel_to_yolo(box, img_w, img_h)
    else:
        raise ValueError(f"Unrecognised bounding-box format: {box}")


# ---- dataset builder ------------------------------------------------------

def _copy_seed(seed_dir: Path, out_images: Path, out_labels: Path) -> int:
    """Copy seed images and labels into the output directories.

    Returns the number of images copied.
    """
    seed_images = seed_dir / "images"
    seed_labels = seed_dir / "labels"

    if not seed_images.exists():
        print(f"  [WARN] Seed images directory not found: {seed_images}")
        return 0

    count = 0
    for img_path in sorted(seed_images.iterdir()):
        if img_path.suffix.lower() in (".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"):
            shutil.copy2(img_path, out_images / img_path.name)

            # Copy matching label file if it exists
            label_name = img_path.stem + ".txt"
            label_path = seed_labels / label_name
            if label_path.exists():
                shutil.copy2(label_path, out_labels / label_name)
            count += 1

    return count


def _copy_previous_rounds(current_round: int, output_base: Path,
                          out_images: Path, out_labels: Path) -> int:
    """Copy images/labels from rounds 1..(current_round-1).

    Returns total images copied.
    """
    total = 0
    for r in range(1, current_round):
        prev_dir = output_base.parent / f"round_{r}"
        prev_images = prev_dir / "images"
        prev_labels = prev_dir / "labels"

        if not prev_images.exists():
            print(f"  [WARN] Previous round directory not found: {prev_dir}")
            continue

        for img_path in sorted(prev_images.iterdir()):
            if img_path.suffix.lower() in (".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"):
                dst_img = out_images / img_path.name
                if not dst_img.exists():  # avoid overwriting seed images
                    shutil.copy2(img_path, dst_img)

                    label_name = img_path.stem + ".txt"
                    label_src = prev_labels / label_name
                    if label_src.exists():
                        shutil.copy2(label_src, out_labels / label_name)
                    total += 1

    return total


def _process_human_labels(
    human_labels_path: Path,
    pool_dir: Path,
    out_images: Path,
    out_labels: Path,
) -> dict[str, int]:
    """Process human_labels.json and write YOLO labels + copy images.

    Returns a dict with counts: {"accepted": N, "corrected": N, "rejected": N, "total": N}.
    """
    with open(human_labels_path, "r", encoding="utf-8") as f:
        raw = json.load(f)

    stats: dict[str, int] = {"accepted": 0, "corrected": 0, "rejected": 0, "total": 0}

    # Handle both {"labels": [...]} wrapper and flat list formats
    if isinstance(raw, dict) and "labels" in raw:
        entries = raw["labels"]
    elif isinstance(raw, list):
        entries = raw
    else:
        print(f"  [WARN] Unexpected JSON structure in {human_labels_path}")
        entries = []

    for entry in entries:
        stats["total"] += 1
        action = entry.get("action", "").lower().strip()
        image_name = entry.get("image_id", entry.get("image", entry.get("filename", "")))

        if not image_name:
            print(f"  [WARN] Entry missing image name, skipping: {entry}")
            continue

        # Locate the pool image
        pool_image = pool_dir / image_name
        if not pool_image.exists():
            # Try common subdirectories
            for sub in ("", "images"):
                candidate = pool_dir / sub / image_name if sub else pool_dir / image_name
                if candidate.exists():
                    pool_image = candidate
                    break

        if action == "reject":
            stats["rejected"] += 1
            print(f"    [REJ] Rejected: {image_name}")
            continue

        if action == "accept":
            boxes = entry.get("boxes", entry.get("bboxes", entry.get("predictions", [])))
            stats["accepted"] += 1
        elif action == "correct":
            boxes = entry.get("corrected_boxes", entry.get("corrections",
                     entry.get("boxes", entry.get("bboxes", []))))
            stats["corrected"] += 1
        else:
            print(f"  [WARN] Unknown action '{action}' for {image_name}, skipping")
            continue

        # Copy pool image to output
        if pool_image.exists():
            shutil.copy2(pool_image, out_images / image_name)
        else:
            print(f"  [WARN] Pool image not found: {pool_image}")
            continue

        # Convert boxes → YOLO label file
        label_name = Path(image_name).stem + ".txt"
        label_path = out_labels / label_name

        yolo_lines: list[str] = []
        for box in boxes:
            class_name = box.get("class", box.get("class_name", box.get("label", "")))
            class_id = box.get("class_id")

            # Resolve class_id
            if class_id is None:
                if class_name in CLASS_TO_ID:
                    class_id = CLASS_TO_ID[class_name]
                else:
                    # Try case-insensitive / stripped match
                    normalised = class_name.lower().strip().replace(" ", "").replace("_", "")
                    matched = False
                    for cname, cid in CLASS_TO_ID.items():
                        if cname.lower().replace("_", "") == normalised:
                            class_id = cid
                            matched = True
                            break
                    if not matched:
                        print(f"    [WARN] Unknown class '{class_name}' in {image_name}, skipping box")
                        continue

            try:
                xc, yc, w, h = _convert_box(box, pool_image)
            except (FileNotFoundError, ValueError) as exc:
                print(f"    [WARN] Box conversion failed for {image_name}: {exc}")
                continue

            # Clamp to [0, 1]
            xc = max(0.0, min(1.0, xc))
            yc = max(0.0, min(1.0, yc))
            w = max(0.0, min(1.0, w))
            h = max(0.0, min(1.0, h))

            yolo_lines.append(f"{class_id} {xc:.6f} {yc:.6f} {w:.6f} {h:.6f}")

        with open(label_path, "w", encoding="utf-8") as lf:
            lf.write("\n".join(yolo_lines))
            if yolo_lines:
                lf.write("\n")

        action_sym = "[OK]" if action == "accept" else "[MOD]"
        print(f"    {action_sym} {action.capitalize()}: {image_name}  ({len(yolo_lines)} boxes)")

    return stats


def _write_dataset_yaml(
    output_dir: Path,
    test_dir: Path | None,
) -> Path:
    """Write dataset.yaml for Ultralytics YOLO training.

    Returns the path to the written file.
    """
    yaml_path = output_dir / "dataset.yaml"
    abs_output = output_dir.resolve()

    val_path = str((test_dir / "images").resolve()) if test_dir else str(abs_output / "images")

    lines = [
        f"path: {abs_output}",
        f"train: images",
        f"val: {val_path}",
        f"test: {val_path}",
        "",
        "names:",
    ]
    for idx, name in enumerate(CLASS_NAMES):
        lines.append(f"  {idx}: {name}")
    lines.append("")

    yaml_path.write_text("\n".join(lines), encoding="utf-8")
    return yaml_path


# ---- main -----------------------------------------------------------------

def build_dataset(
    seed_dir: Path,
    pool_dir: Path,
    human_labels: Path,
    round_num: int,
    output_dir: Path,
    test_dir: Path | None = None,
) -> None:
    """Build a YOLO training dataset for the given active-learning round."""
    print(f"\n{'='*60}")
    print(f"  Building dataset for Round {round_num}")
    print(f"{'='*60}")
    print(f"  Seed dir      : {seed_dir}")
    print(f"  Pool dir      : {pool_dir}")
    print(f"  Human labels  : {human_labels}")
    print(f"  Output dir    : {output_dir}")
    print(f"  Test dir      : {test_dir}")
    print()

    # ---- Clean output dir (idempotent) ----
    if output_dir.exists():
        print(f"  Cleaning existing output directory: {output_dir}")
        shutil.rmtree(output_dir)

    out_images = output_dir / "images"
    out_labels = output_dir / "labels"
    out_images.mkdir(parents=True, exist_ok=True)
    out_labels.mkdir(parents=True, exist_ok=True)

    # ---- Step 1: Copy seed data ----
    print("[1/5] Copying seed data ...")
    seed_count = _copy_seed(seed_dir, out_images, out_labels)
    print(f"  -> Copied {seed_count} seed images\n")

    # ---- Step 2: Copy previous rounds (if round > 1) ----
    if round_num > 1:
        print(f"[2/5] Copying data from rounds 1..{round_num - 1} ...")
        prev_count = _copy_previous_rounds(round_num, output_dir, out_images, out_labels)
        print(f"  -> Copied {prev_count} images from previous rounds\n")
    else:
        print("[2/5] Round 1 - no previous rounds to include\n")

    # ---- Step 3: Process human labels ----
    if human_labels.exists():
        print("[3/5] Processing human labels ...")
        stats = _process_human_labels(human_labels, pool_dir, out_images, out_labels)
        print(f"\n  -> Accepted : {stats['accepted']}")
        print(f"  -> Corrected: {stats['corrected']}")
        print(f"  -> Rejected : {stats['rejected']}")
        print(f"  -> Total    : {stats['total']}\n")
    else:
        print(f"[3/5] Human labels file not found: {human_labels}")
        print("  -> Skipping (dataset will contain only seed + previous rounds)\n")

    # ---- Step 4: Count final dataset ----
    final_images = list(out_images.glob("*"))
    final_labels = list(out_labels.glob("*.txt"))
    print(f"[4/5] Final dataset:")
    print(f"  -> Images: {len(final_images)}")
    print(f"  -> Labels: {len(final_labels)}\n")

    # ---- Step 5: Write dataset.yaml ----
    print("[5/5] Writing dataset.yaml ...")
    yaml_path = _write_dataset_yaml(output_dir, test_dir)
    print(f"  -> {yaml_path}\n")

    print(f"{'='*60}")
    print(f"  [OK] Dataset for Round {round_num} built successfully!")
    print(f"{'='*60}\n")


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Build a YOLO training dataset for a given active-learning round.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Example:\n"
            "  python scripts/build_dataset.py \\\n"
            "      --seed-dir data/seed \\\n"
            "      --pool-dir data/pool/images \\\n"
            "      --human-labels inputs/human_labels.json \\\n"
            "      --round 1 \\\n"
            "      --output data/rounds/round_1 \\\n"
            "      --test-dir data/test\n"
        ),
    )

    parser.add_argument(
        "--seed-dir", type=Path, required=True,
        help="Path to the seed dataset directory (should contain images/ and labels/).",
    )
    parser.add_argument(
        "--pool-dir", type=Path, required=True,
        help="Path to the pool images directory.",
    )
    parser.add_argument(
        "--human-labels", type=Path, required=True,
        help="Path to human_labels.json with reviewed annotations.",
    )
    parser.add_argument(
        "--round", type=int, required=True, dest="round_num",
        help="Current active-learning round number (1-indexed).",
    )
    parser.add_argument(
        "--output", type=Path, required=True,
        help="Output directory for the built dataset (e.g. data/rounds/round_1).",
    )
    parser.add_argument(
        "--test-dir", type=Path, default=None,
        help="Path to the test dataset directory (used as val in dataset.yaml).",
    )

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    build_dataset(
        seed_dir=args.seed_dir,
        pool_dir=args.pool_dir,
        human_labels=args.human_labels,
        round_num=args.round_num,
        output_dir=args.output,
        test_dir=args.test_dir,
    )
