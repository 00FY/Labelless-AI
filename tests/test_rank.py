"""
tests/test_rank.py - Validates Active Learning Ranking Engine (Person B)
"""

import sys
from pathlib import Path
import pytest

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(_ROOT / "scripts"))

from rank import score_item, rank_predictions, calculate_class_rarity_weights


@pytest.fixture
def sample_predictions():
    return [
        {
            "image": "img_high_conf.jpg",
            "predictions": [
                {"class": "undamagedbuilding", "confidence": 0.98, "bbox": [10, 10, 50, 50]},
                {"class": "undamagedbuilding", "confidence": 0.95, "bbox": [60, 60, 90, 90]},
            ]
        },
        {
            "image": "img_uncertain.jpg",
            "predictions": [
                {"class": "damagedbuilding", "confidence": 0.42, "bbox": [20, 20, 80, 80]},
            ]
        },
        {
            "image": "img_rare_fire.jpg",
            "predictions": [
                {"class": "fire", "confidence": 0.65, "bbox": [15, 15, 45, 45]},
                {"class": "smoke", "confidence": 0.55, "bbox": [50, 50, 85, 85]},
            ]
        },
        {
            "image": "img_empty.jpg",
            "predictions": []
        }
    ]


def test_rarity_weights_calculation(sample_predictions):
    rarity = calculate_class_rarity_weights(sample_predictions)
    # Undamagedbuilding has 2 instances, fire has 1, smoke has 1, damagedbuilding has 1
    # Max count is 2 (undamagedbuilding), so its rarity should be 0.0
    assert rarity.get("undamagedbuilding") == 0.0
    assert rarity.get("fire") > 0.0
    assert rarity.get("smoke") > 0.0


def test_score_item_uncertainty_priority():
    rarity = {"undamagedbuilding": 0.0, "damagedbuilding": 0.5, "fire": 1.0}
    
    # High confidence item
    high_conf_item = {
        "image": "high.jpg",
        "predictions": [{"class": "undamagedbuilding", "confidence": 0.99, "bbox": [10, 10, 20, 20]}]
    }
    high_res = score_item(high_conf_item, rarity, w_unc=0.7, w_rare=0.2, w_div=0.1)
    
    # Low confidence item
    low_conf_item = {
        "image": "low.jpg",
        "predictions": [{"class": "damagedbuilding", "confidence": 0.35, "bbox": [10, 10, 20, 20]}]
    }
    low_res = score_item(low_conf_item, rarity, w_unc=0.7, w_rare=0.2, w_div=0.1)
    
    assert low_res["priority_score"] > high_res["priority_score"], (
        "Uncertain item must receive higher priority than certain item"
    )
    assert low_res["uncertainty_score"] > high_res["uncertainty_score"]


def test_rank_predictions_sorting(sample_predictions):
    ranked_queue = rank_predictions(sample_predictions, w_unc=0.7, w_rare=0.2, w_div=0.1)
    assert len(ranked_queue) == 4
    
    # Verify descending order of priority scores
    scores = [item["priority_score"] for item in ranked_queue]
    assert scores == sorted(scores, reverse=True), "Queue must be sorted in descending priority order"
    
    # Verify each item has required schema fields
    for item in ranked_queue:
        assert "image_id" in item
        assert "priority_score" in item
        assert "uncertainty_score" in item
        assert "rare_class_score" in item
        assert "diversity_score" in item
        assert 0.0 <= item["priority_score"] <= 1.0
