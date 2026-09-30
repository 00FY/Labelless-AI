"""
class_map.py

Shared class-name / class-ID mapping for the LabelLess AI disaster dataset.
Imported by build_dataset.py, retrain.py, evaluate.py, and run_experiment.py.

All values are read from config.yaml via load_config.py — nothing is hardcoded here.
"""

from __future__ import annotations

import sys
from pathlib import Path

_SCRIPT_DIR = Path(__file__).resolve().parent
if str(_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPT_DIR))

from load_config import get_class_names, get_class_to_id, get_num_classes  # noqa: E402

CLASS_NAMES = get_class_names()
CLASS_TO_ID = get_class_to_id()
ID_TO_CLASS = {i: name for name, i in CLASS_TO_ID.items()}
NUM_CLASSES = get_num_classes()
