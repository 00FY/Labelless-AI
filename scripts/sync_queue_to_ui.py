"""
scripts/sync_queue_to_ui.py

Bridges Person B's ranked_queue.json and Person A's predictions.json with
Person C's frontend review dashboard.

Generates a clean JSON file that the React application can consume directly
or updates the mock dataset with real model inferences.

Usage:
    python scripts/sync_queue_to_ui.py
    python scripts/sync_queue_to_ui.py --queue inputs/ranked_queue.json --predictions outputs/predictions.json
"""

import argparse
import json
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def parse_args():
    parser = argparse.ArgumentParser(description="Sync ranked queue and predictions to frontend review dataset")
    parser.add_argument("--queue", default="inputs/ranked_queue.json", help="Path to ranked_queue.json")
    parser.add_argument("--predictions", default="outputs/predictions.json", help="Path to predictions.json")
    parser.add_argument("--output", default="public/ranked_dataset.json", help="Path to write frontend dataset")
    return parser.parse_args()


CLASS_NAME_MAP = {
    "damagedbuilding": "Damaged Building",
    "undamagedbuilding": "Undamaged Building",
    "fire": "Fire",
    "smoke": "Smoke",
}


def sync_data(queue_path: Path, preds_path: Path, output_path: Path):
    if not queue_path.exists():
        sys.exit(f"❌ ERROR: Queue file not found: {queue_path}")
    if not preds_path.exists():
        sys.exit(f"❌ ERROR: Predictions file not found: {preds_path}")

    with open(queue_path, "r", encoding="utf-8") as f:
        q_data = json.load(f)

    with open(preds_path, "r", encoding="utf-8") as f:
        p_data = json.load(f)

    # Index predictions by image id
    pred_map = {}
    for entry in p_data:
        img_name = entry.get("image") or entry.get("image_id")
        if img_name:
            pred_map[img_name] = entry.get("predictions", [])

    ranked_items = q_data.get("ranked_images", q_data if isinstance(q_data, list) else [])

    frontend_items = []
    for idx, item in enumerate(ranked_items):
        img_id = item.get("image_id")
        boxes_raw = pred_map.get(img_id, item.get("predictions", []))

        # Determine dominant predicted class
        if boxes_raw:
            pred_class = boxes_raw[0].get("class", "Damaged Building")
            pred_class_formatted = CLASS_NAME_MAP.get(pred_class.lower(), pred_class.title())
        else:
            pred_class_formatted = "Undamaged Building"

        # Format bounding boxes
        boxes = []
        for b_idx, b in enumerate(boxes_raw):
            cls_name = b.get("class", "Damaged Building")
            formatted_cls = CLASS_NAME_MAP.get(cls_name.lower(), cls_name.title())

            # Handle bounding box coordinates (normalize to percentage if needed)
            bbox = b.get("bbox", [10, 10, 50, 50])
            if len(bbox) == 4:
                # Pixel coords [x1, y1, x2, y2]
                x1, y1, x2, y2 = bbox
                # Standard normalized percentage (assuming 640x640 base if not known)
                bx = max(0.0, min(100.0, (x1 / 640.0) * 100))
                by = max(0.0, min(100.0, (y1 / 640.0) * 100))
                bw = max(2.0, min(100.0, ((x2 - x1) / 640.0) * 100))
                bh = max(2.0, min(100.0, ((y2 - y1) / 640.0) * 100))
            else:
                bx, by, bw, bh = 20.0, 20.0, 30.0, 30.0

            boxes.append({
                "id": f"b-{idx}-{b_idx}",
                "label": formatted_cls,
                "x": round(bx, 1),
                "y": round(by, 1),
                "width": round(bw, 1),
                "height": round(bh, 1),
                "confidence": round(float(b.get("confidence", 0.85)), 2),
            })

        priority_score = float(item.get("priority_score", 0.5))
        priority_level = (
            "critical" if priority_score >= 0.70
            else "high" if priority_score >= 0.58
            else "medium" if priority_score >= 0.40
            else "low"
        )

        # AI auto-labels easy/confident cases (low priority score < 0.58)
        status = "auto_labeled" if priority_score < 0.58 else "pending"

        # Check if specific image file exists in public/predictions
        image_file_path = Path("public/predictions") / img_id
        if image_file_path.exists():
            image_url = f"/predictions/{img_id}"
        else:
            # Deterministically cycle through the available real disaster satellite images
            available_samples = [
                "00f205aea57febc8e82d4e99a18b1d51.png",
                "03db54200069482ff87cab702a6be150.png",
                "09e62858a678e6fcea8bced21d03ab1c.png",
                "0cc1d593cae6ffebfce45bf447fa6e69.png",
                "0decc9d19b769d6d641eaba36653f802.png",
                "10320cb5d267aebe2e10727a211d859b.png",
                "multidisaster_sample_1.jpg",
                "multidisaster_sample_2.jpg",
                "multidisaster_sample_3.jpg",
            ]
            fallback_img = available_samples[idx % len(available_samples)]
            image_url = f"/predictions/{fallback_img}"

        frontend_items.append({
            "id": f"#{idx+1:04d}",
            "title": f"{pred_class_formatted} - {img_id[:12]}",
            "filename": img_id,
            "imageUrl": image_url,
            "predictedClass": pred_class_formatted,
            "confidence": round(float(item.get("avg_confidence", 0.5)), 2),
            "uncertaintyScore": round(float(item.get("uncertainty_score", 0.5)), 2),
            "diversityScore": round(float(item.get("diversity_score", 0.5)), 2),
            "rareClassScore": round(float(item.get("rare_class_score", 0.2)), 2),
            "priorityScore": priority_score,
            "priorityLevel": priority_level,
            "reasons": item.get("reasons", [item.get("reason", "Active learning priority")]),
            "explanation": {
                "uncertaintyContribution": round(priority_score * 0.7, 2),
                "diversityContribution": round(priority_score * 0.1, 2),
                "rareClassContribution": round(priority_score * 0.2, 2),
                "recommendation": "Review suggested" if priority_score >= 0.45 else "Auto-labeled candidate",
                "bulletPoints": [
                    f"Model uncertainty: {item.get('uncertainty_score', 0.5):.1%}",
                    f"Detected objects: {len(boxes)}",
                    f"Active learning reason: {item.get('reason', 'Priority queue')}",
                ],
            },
            "status": status,
            "boxes": boxes,
            "estimatedManualSec": 30,
            "aiAssistedSec": 8,
            "createdAtRound": 1,
        })

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(frontend_items, f, indent=2)

    print(f"✅ SUCCESS: Synced {len(frontend_items)} items from Person A & B to UI dataset at {output_path}")


def main():
    args = parse_args()
    sync_data(Path(args.queue), Path(args.predictions), Path(args.output))


if __name__ == "__main__":
    main()
