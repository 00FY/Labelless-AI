"""
test_predictions.py

Pretends to be Person B: loads predictions.json, prints out its contents,
and validates the structure so we catch problems before handing it off.

Usage:
    python test_predictions.py --input outputs/predictions.json
"""

import argparse
import json
import sys
from pathlib import Path


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--input", default="outputs/predictions.json")
    return p.parse_args()


def main():
    args = parse_args()
    path = Path(args.input)

    if not path.exists():
        sys.exit(f"ERROR: {path} does not exist")

    with open(path) as f:
        data = json.load(f)

    if not isinstance(data, list):
        sys.exit("ERROR: top-level JSON must be a list")

    errors = []
    for i, entry in enumerate(data):
        if "image" not in entry or "predictions" not in entry:
            errors.append(f"Entry {i} missing 'image' or 'predictions' key")
            continue

        print(f"\n{entry['image']}")
        for pred in entry["predictions"]:
            for key in ("class", "confidence", "bbox"):
                if key not in pred:
                    errors.append(f"{entry['image']}: prediction missing '{key}'")

            conf = pred.get("confidence")
            if conf is not None and not (0.0 <= conf <= 1.0):
                errors.append(f"{entry['image']}: confidence {conf} out of range [0,1]")

            bbox = pred.get("bbox")
            if bbox is not None and len(bbox) != 4:
                errors.append(f"{entry['image']}: bbox {bbox} does not have 4 values")

            print(f"  {pred.get('class')}: conf={pred.get('confidence')} bbox={pred.get('bbox')}")

    print("\n" + "=" * 40)
    if errors:
        print(f"FAILED: {len(errors)} problem(s) found:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print(f"OK: {len(data)} images, all predictions valid.")


if __name__ == "__main__":
    main()
