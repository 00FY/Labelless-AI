"""
tests/test_server.py - Validates FastAPI server endpoints and persistence
"""

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


def test_round_advance_endpoint():
    res = client.post("/api/round/next", json={"round_number": 4})
    assert res.status_code == 200
    data = res.json()
    assert data.get("success") is True
    assert "round_summary" in data
    summary = data["round_summary"]
    assert "mAP50" in summary["metrics"]
    assert "time_saved_hours" in summary
