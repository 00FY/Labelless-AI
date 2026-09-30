"""
tests/test_sync_queue.py - Validates queue synchronization logic for frontend
"""

import json
import sys
from pathlib import Path
import pytest

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(_ROOT / "scripts"))

from sync_queue_to_ui import sync_data


def test_sync_data_execution(tmp_path):
    queue_file = tmp_path / "ranked_queue.json"
    preds_file = tmp_path / "predictions.json"
    output_file = tmp_path / "ranked_dataset.json"

    sample_queue = {
        "ranked_images": [
            {
                "image_id": "test_img_1.jpg",
                "priority_score": 0.85,
                "uncertainty_score": 0.90,
                "diversity_score": 0.70,
                "rare_class_score": 0.80,
                "reason": "High uncertainty and rare class detected"
            }
        ]
    }

    sample_preds = [
        {
            "image": "test_img_1.jpg",
            "predictions": [
                {
                    "class": "damagedbuilding",
                    "confidence": 0.45,
                    "bbox": [10, 20, 80, 90]
                }
            ]
        }
    ]

    with open(queue_file, "w", encoding="utf-8") as f:
        json.dump(sample_queue, f)

    with open(preds_file, "w", encoding="utf-8") as f:
        json.dump(sample_preds, f)

    sync_data(queue_file, preds_file, output_file)

    assert output_file.exists()
    with open(output_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert len(data) == 1
    item = data[0]
    assert item["id"] == "#0001"
    assert item["filename"] == "test_img_1.jpg"
    assert "boxes" in item
    assert item["status"] in ("pending", "needs_review", "pending_review", "auto_labeled")
