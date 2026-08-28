"""
split_dataset.py

Splits a folder of images (and optional YOLO-format .txt label files)
into seed / pool / test sets.

- seed: small labeled set, used to train the initial YOLO model
- pool: images treated as "unlabeled" by the active-learning system
        (labels, if they exist, are copied to a hidden eval folder,
        NOT into pool/, so the pool stays "blind")
- test: untouched, used only for final evaluation

Usage:
    python split_dataset.py \
        --images data/all_images \
        --labels data/all_labels \
        --output data \
        --seed-pct 0.10 \
        --pool-pct 0.70 \
        --test-pct 0.20 \
        --seed 42
"""

import argparse
import random
import shutil
from pathlib import Path


def parse_args():
    p = argparse.ArgumentParser(description="Split dataset into seed/pool/test")
    p.add_argument("--images", required=True, help="Folder containing all images")
    p.add_argument("--labels", default=None,
                    help="Folder containing YOLO .txt labels (same basename as images). Optional.")
    p.add_argument("--output", default="data", help="Output root folder (will contain seed/pool/test)")
    p.add_argument("--seed-pct", type=float, default=0.10)
    p.add_argument("--pool-pct", type=float, default=0.70)
    p.add_argument("--test-pct", type=float, default=0.20)
    p.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    return p.parse_args()


IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def main():
    args = parse_args()

    assert abs(args.seed_pct + args.pool_pct + args.test_pct - 1.0) < 1e-6, \
        "seed-pct + pool-pct + test-pct must sum to 1.0"

    images_dir = Path(args.images)
    labels_dir = Path(args.labels) if args.labels else None
    out_root = Path(args.output)

    all_images = sorted([f for f in images_dir.iterdir() if f.suffix.lower() in IMAGE_EXTS])
    if not all_images:
        raise SystemExit(f"No images found in {images_dir}")

    random.seed(args.seed)
    random.shuffle(all_images)

    n = len(all_images)
    n_seed = int(n * args.seed_pct)
    n_pool = int(n * args.pool_pct)
    # test gets the remainder so we don't lose images to rounding
    seed_files = all_images[:n_seed]
    pool_files = all_images[n_seed:n_seed + n_pool]
    test_files = all_images[n_seed + n_pool:]

    splits = {
        "seed": seed_files,
        "pool": pool_files,
        "test": test_files,
    }

    for split_name, files in splits.items():
        split_img_dir = out_root / split_name / "images"
        split_img_dir.mkdir(parents=True, exist_ok=True)

        # seed and test get labels copied alongside (needed for training / eval)
        # pool's ground-truth labels (if any) go to a separate hidden eval folder,
        # NOT into pool/, so the active-learning system genuinely can't see them.
        needs_labels_visible = split_name in ("seed", "test")
        if needs_labels_visible and labels_dir:
            split_lbl_dir = out_root / split_name / "labels"
            split_lbl_dir.mkdir(parents=True, exist_ok=True)

        if split_name == "pool" and labels_dir:
            hidden_lbl_dir = out_root / "pool_ground_truth_hidden" / "labels"
            hidden_lbl_dir.mkdir(parents=True, exist_ok=True)

        for img_path in files:
            shutil.copy2(img_path, split_img_dir / img_path.name)

            if labels_dir:
                label_path = labels_dir / (img_path.stem + ".txt")
                if label_path.exists():
                    if needs_labels_visible:
                        shutil.copy2(label_path, split_img_dir.parent / "labels" / label_path.name)
                    else:  # pool
                        shutil.copy2(label_path, out_root / "pool_ground_truth_hidden" / "labels" / label_path.name)

        print(f"{split_name}: {len(files)} images -> {split_img_dir}")

    print("\nDone. NOTE: pool_ground_truth_hidden/ contains pool labels ONLY for later")
    print("evaluation purposes -- do not let the active-learning code read from it.")


if __name__ == "__main__":
    main()
