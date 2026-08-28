"""
generate_predictions.py

Person A's main deliverable.

Runs a YOLOv8 model on a folder of "pool" images and writes out
predictions.json in the format Person B expects.

Usage:
    python generate_predictions.py \
        --input data/pool/images \
        --model models/model.pt \
        --output outputs/predictions.json \
        --conf 0.25

If you don't have a trained model yet, just point --model at a
pretrained checkpoint name like "yolov8n.pt" -- ultralytics will
download it automatically. That's enough to unblock Person B while
the seed-trained model is still being prepared.
"""

import argparse
import json
from pathlib import Path

from ultralytics import YOLO

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def parse_args():
    p = argparse.ArgumentParser(description="Run YOLOv8 on pool images and produce predictions.json")
    p.add_argument("--input", required=True, help="Folder of pool images")
    p.add_argument("--model", required=True, help="Path to a .pt model, or a pretrained name like yolov8n.pt")
    p.add_argument("--output", required=True, help="Where to write predictions.json")
    p.add_argument("--conf", type=float, default=0.25, help="Confidence threshold (default 0.25)")
    p.add_argument("--device", default=None, help="Optional device override, e.g. 'cpu' or '0' for GPU")
    return p.parse_args()


def run_inference(input_dir: Path, model_path: str, conf: float, device):
    model = YOLO(model_path)
    class_names = model.names

    image_paths = sorted([f for f in input_dir.iterdir() if f.suffix.lower() in IMAGE_EXTS])
    if not image_paths:
        raise SystemExit(f"No images found in {input_dir}")

    results_out = []
    for img_path in image_paths:
        results = model.predict(source=str(img_path), conf=conf, verbose=False, device=device)
        r = results[0]

        predictions = []
        for box in r.boxes:
            cls_id = int(box.cls[0])
            confidence = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()  # [x1, y1, x2, y2] in pixel coords
            predictions.append({
                "class": class_names[cls_id],
                "confidence": round(confidence, 4),
                "bbox": [round(v, 2) for v in xyxy],
            })

        results_out.append({
            "image": img_path.name,
            "predictions": predictions,
        })

        print(f"{img_path.name}: {len(predictions)} detections")

    return results_out


def main():
    args = parse_args()
    input_dir = Path(args.input)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    data = run_inference(input_dir, args.model, args.conf, args.device)

    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)

    total_detections = sum(len(item["predictions"]) for item in data)
    print(f"\nWrote {output_path}")
    print(f"Images processed: {len(data)}")
    print(f"Total detections: {total_detections}")


if __name__ == "__main__":
    main()
