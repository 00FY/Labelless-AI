"""
tests/test_server.py - Validates FastAPI server endpoints and persistence
"""

import json
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from server import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data.get("status") == "online"
    assert "version" in data


def test_config_endpoint():
    res = client.get("/api/config")
    assert res.status_code == 200
    data = res.json()
    assert "weights" in data
    assert data["weights"]["uncertainty"] == 0.7
    assert data["weights"]["rarity"] == 0.2
    assert data["weights"]["diversity"] == 0.1
    assert "thresholds" in data


def test_queue_endpoint():
    res = client.get("/api/queue")
    assert res.status_code == 200
    data = res.json()
    assert "total" in data
    assert "items" in data
    assert isinstance(data["items"], list)


def test_label_persistence():
    payload = {
        "image_id": "test_ci_image_001",
        "status": "reviewed",
        "boxes": [
            {
                "className": "Damaged Building",
                "x": 15.0,
                "y": 25.0,
                "width": 30.0,
                "height": 40.0,
                "confidence": 1.0
            }
        ],
        "user": "ci_test_suite",
        "notes": "CI test validation annotation"
    }
    
    res = client.post("/api/label", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data.get("success") is True
    assert "saved" in data
    assert data["saved"]["image_id"] == "test_ci_image_001"


def test_label_persistence_with_ui_box_shape():
    """The React UI sends boxes with "label" (not "className") plus isHumanCorrected."""
    payload = {
        "image_id": "test_ci_image_002",
        "status": "human_reviewed",
        "boxes": [
            {
                "id": "b-1",
                "label": "Smoke",
                "x": 1.0,
                "y": 2.0,
                "width": 30.0,
                "height": 40.0,
                "confidence": 0.31,
                "isHumanCorrected": True,
            }
        ],
        "user": "expert_reviewer",
        "dominant_class": "Smoke",
    }

    res = client.post("/api/label", json=payload)
    assert res.status_code == 200
    box = res.json()["saved"]["boxes"][0]
    assert box["label"] == "Smoke"
    assert box["className"] == "Smoke"
    assert box["isHumanCorrected"] is True


def test_label_rejects_box_without_class():
    payload = {"image_id": "test_ci_image_003", "status": "human_reviewed", "boxes": [{"x": 1, "y": 2, "width": 3, "height": 4}]}
    assert client.post("/api/label", json=payload).status_code == 422


def test_round_advance_endpoint():
    res = client.post("/api/round/next", json={"round_number": 4})
    assert res.status_code == 200
    data = res.json()
    assert data.get("success") is True
    assert "round_summary" in data
    summary = data["round_summary"]
    assert "mAP50" in summary["metrics"]
    assert "time_saved_hours" in summary


def test_label_save_does_not_rewrite_public_dataset():
    """Rewriting public/ranked_dataset.json makes the Vite dev server reload the page after every save."""
    dataset = Path(__file__).resolve().parent.parent / "public" / "ranked_dataset.json"
    before = dataset.read_bytes()
    first_id = json.loads(before)[0]["id"]
    payload = {"image_id": first_id, "status": "human_reviewed", "boxes": []}
    assert client.post("/api/label", json=payload).status_code == 200
    assert dataset.read_bytes() == before
