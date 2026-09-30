"""
tests/test_config.py - Validates canonical config.yaml and load_config.py
"""

import sys
from pathlib import Path
import yaml
import pytest

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(_ROOT / "scripts"))

from load_config import cfg, get_ranking_weights, get_routing, get_yolo_to_display


def test_config_file_exists():
    config_path = _ROOT / "config.yaml"
    assert config_path.exists(), "config.yaml must exist in the project root"


def test_ranking_weights_sum_to_one():
    w_unc, w_rare, w_div = get_ranking_weights()
    total = w_unc + w_rare + w_div
    assert abs(total - 1.0) < 1e-6, f"Ranking weights must sum to 1.0, got {total}"
    assert w_unc == 0.7, f"Expected uncertainty weight 0.7, got {w_unc}"
    assert w_rare == 0.2, f"Expected rare class weight 0.2, got {w_rare}"
    assert w_div == 0.1, f"Expected diversity weight 0.1, got {w_div}"


def test_thresholds_hierarchy():
    routing = get_routing()
    p_levels = routing["priority_levels"]
    crit = p_levels["critical"]
    high = p_levels["high"]
    med = p_levels["medium"]
    
    assert 0.0 < med < high < crit <= 1.0, (
        f"Priority levels hierarchy invalid: med={med}, high={high}, crit={crit}"
    )
    assert 0.0 < routing["confidence_threshold"] <= 1.0


def test_classes_definition():
    yolo_map = get_yolo_to_display()
    assert len(yolo_map) >= 4, "Must define at least 4 disaster classes"
    assert "undamagedbuilding" in yolo_map or "0" in yolo_map or any("undamaged" in k.lower() for k in yolo_map)
    assert any("damaged" in k.lower() for k in yolo_map)
