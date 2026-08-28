"""
class_map.py

Shared class-name / class-ID mapping for the LabelLess AI disaster dataset.
Imported by build_dataset.py, retrain.py, evaluate.py, and run_experiment.py.
"""

CLASS_NAMES = ["undamagedbuilding", "damagedbuilding", "fire", "smoke"]
CLASS_TO_ID = {name: i for i, name in enumerate(CLASS_NAMES)}
ID_TO_CLASS = {i: name for i, name in enumerate(CLASS_NAMES)}
NUM_CLASSES = len(CLASS_NAMES)
