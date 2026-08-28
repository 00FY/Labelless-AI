# Person A — YOLO Prediction Pipeline

Produces `predictions.json` from a folder of "pool" images, for Person B's
active-learning selection step to consume.

```
Images -> YOLOv8 -> predictions + confidence -> predictions.json
```

## 1. Setup (5 min)

```bash
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install ultralytics
```

Verify:

```bash
python3 -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

If that downloads a model with no errors, you're set.

## 2. Get a dataset

Drop all your raw images into `data/all_images/` (and labels, if you have
them, into `data/all_labels/` as YOLO-format `.txt` files, same filename
as the image).

Small object-detection datasets to grab quickly if you don't have one yet:
COCO128, a subset of COCO, or any Roboflow Universe dataset export in
YOLO format.

## 3. Split into seed / pool / test

```bash
python3 scripts/split_dataset.py \
    --images data/all_images \
    --labels data/all_labels \
    --output data \
    --seed-pct 0.1 \
    --pool-pct 0.7 \
    --test-pct 0.2
```

This creates:

```
data/
├── seed/images  (+ labels)   <- train the initial model on this
├── pool/images                <- treated as "unlabeled"
└── test/images  (+ labels)   <- never touched until final evaluation
```

Ground truth for pool images (if you have it) is copied to
`data/pool_ground_truth_hidden/` — kept separate so the active-learning
code genuinely can't see it, but you can still use it later to check
how good the selection strategy is.

## 4. (Optional) Train an initial model on seed

If you have time, fine-tune on the seed set:

```bash
yolo detect train data=seed_dataset.yaml model=yolov8n.pt epochs=20 imgsz=640
```

This needs a `data.yaml` describing your classes and seed folder paths
(see Ultralytics docs). **If you're short on time, skip this** — the
main script below works fine with a plain pretrained `yolov8n.pt` and
you can swap in the fine-tuned model later without changing anything
else.

## 5. Generate predictions.json (the actual deliverable)

```bash
python3 scripts/generate_predictions.py \
    --input data/pool/images \
    --model yolov8n.pt \
    --output outputs/predictions.json \
    --conf 0.25
```

Swap `--model yolov8n.pt` for `models/model.pt` once you have a
fine-tuned model.

## 6. Validate before handing off

```bash
python3 scripts/test_predictions.py --input outputs/predictions.json
```

This simulates what Person B will do: load the JSON, print every
image/class/confidence/bbox, and check confidences are in [0,1] and
bboxes have 4 values.

## Output format (agreed schema)

```json
[
  {
    "image": "image_001.jpg",
    "predictions": [
      {
        "class": "car",
        "confidence": 0.93,
        "bbox": [120, 80, 450, 300]
      }
    ]
  }
]
```

`bbox` is `[x1, y1, x2, y2]` in pixel coordinates.

## Hand off to Person B

Give them:
- `outputs/predictions.json`
- `scripts/generate_predictions.py` (so they can re-run it if the model changes)
- This README

They don't need to know anything about how YOLO works internally —
just that `predictions.json` follows the schema above.
