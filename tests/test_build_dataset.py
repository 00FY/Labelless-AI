"""
tests/test_build_dataset.py - Validates Bounding Box transformations and Dataset building
"""

import sys
from pathlib import Path
import pytest

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(_ROOT / "scripts"))

from build_dataset import (
    _percentage_to_yolo,
    _pixel_to_yolo,
    _is_percentage_format,
    _is_pixel_format
)


def test_percentage_format_detection():
    pct_box = {"x": 10, "y": 20, "width": 30, "height": 40}
    pix_box = {"x1": 50, "y1": 100, "x2": 200, "y2": 300}
    
    assert _is_percentage_format(pct_box) is True
    assert _is_percentage_format(pix_box) is False
    assert _is_pixel_format(pix_box) is True
    assert _is_pixel_format(pct_box) is False


def test_percentage_to_yolo_conversion():
    # Box located at x=10%, y=20%, width=30%, height=40%
    # x_center = (10 + 15) / 100 = 0.25
    # y_center = (20 + 20) / 100 = 0.40
    # w = 0.30, h = 0.40
    box = {"x": 10, "y": 20, "width": 30, "height": 40}
    xc, yc, w, h = _percentage_to_yolo(box)
    
    assert abs(xc - 0.25) < 1e-4
    assert abs(yc - 0.40) < 1e-4
    assert abs(w - 0.30) < 1e-4
    assert abs(h - 0.40) < 1e-4


def test_pixel_to_yolo_conversion():
    # Image 1000x1000, Box from (100, 200) to (400, 600)
    # x_center = (100 + 400)/2 / 1000 = 0.25
    # y_center = (200 + 600)/2 / 1000 = 0.40
    # w = 300 / 1000 = 0.30, h = 400 / 1000 = 0.40
    box = {"x1": 100, "y1": 200, "x2": 400, "y2": 600}
    xc, yc, w, h = _pixel_to_yolo(box, img_w=1000, img_h=1000)
    
    assert abs(xc - 0.25) < 1e-4
    assert abs(yc - 0.40) < 1e-4
    assert abs(w - 0.30) < 1e-4
    assert abs(h - 0.40) < 1e-4
