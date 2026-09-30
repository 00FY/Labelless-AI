"""
run_pipeline.py - One-command end-to-end pipeline runner for LabelLess AI.

Executes:
  1. scripts/export_config_for_ui.py  (Sync config.yaml -> public/pipeline_config.json)
  2. scripts/rank.py                  (Rank outputs/predictions.json -> inputs/ranked_queue.json)
  3. scripts/sync_queue_to_ui.py      (Sync inputs/ranked_queue.json -> public/ranked_dataset.json)
  4. scripts/aggregate_metrics.py     (Compile results/metrics/ -> results/summary.json)

Usage:
    python run_pipeline.py
"""

import subprocess
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

_ROOT = Path(__file__).resolve().parent


def run_step(step_name: str, cmd: list[str]) -> bool:
    print(f"\n=======================================================")
    print(f"▶ Step: {step_name}")
    print(f"  Command: {' '.join(cmd)}")
    print(f"=======================================================")
    res = subprocess.run(cmd, cwd=str(_ROOT))
    if res.returncode != 0:
        print(f"\n❌ Step '{step_name}' failed with exit code {res.returncode}")
        return False
    print(f"✔ Step '{step_name}' completed successfully.")
    return True


def main():
    print("\n🚀 Starting LabelLess AI Full Active Learning Pipeline Execution...\n")

    steps = [
        ("Export Canonical Config to UI", [sys.executable, "scripts/export_config_for_ui.py"]),
        ("Tri-Factor Active Learning Ranking", [sys.executable, "scripts/rank.py"]),
        ("Sync Ranked Queue & Predictions to UI", [sys.executable, "scripts/sync_queue_to_ui.py"]),
        ("Aggregate Multi-Round Metrics", [sys.executable, "scripts/aggregate_metrics.py"]),
    ]

    for name, cmd in steps:
        success = run_step(name, cmd)
        if not success:
            sys.exit(1)

    print("\n" + "=" * 60)
    print("🎉 ALL PIPELINE STEPS COMPLETED SUCCESSFULLY!")
    print("   - Canonical Config synced to public/pipeline_config.json")
    print("   - Active queue ranked to inputs/ranked_queue.json")
    print("   - UI dataset synchronized to public/ranked_dataset.json")
    print("   - Evolution metrics compiled in results/summary.json")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
