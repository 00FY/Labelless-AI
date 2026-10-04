"""
scripts/run_all_experiments.py

Runs all 6 experiments for the LabelLess AI paper in correct order:

  Phase 1 — Seed training (Round 0 baseline, shared by all strategies)
  Phase 2 — 3 strategy comparison runs (Random, Confidence, LabelLess)
  Phase 3 — 3 ablation runs (U only, U+R, U+R+D)

After every run, re-exports public/experiment_results.json automatically
so the Evidence page is always live.

Usage:
    python scripts/run_all_experiments.py
    python scripts/run_all_experiments.py --budget 100 --epochs-round 15
    python scripts/run_all_experiments.py --skip-seed   (if Round 0 model already exists)

CPU-friendly defaults: epochs_round=15, patience=5, batch=8, imgsz=416
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = Path("D:/Desktop/data")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def run(cmd: list[str], label: str) -> bool:
    """Run a subprocess command, print output live, return True on success."""
    print(f"\n{'='*60}")
    print(f"  RUNNING: {label}")
    print(f"{'='*60}")
    print("  CMD:", " ".join(cmd))
    t0 = time.time()
    proc = subprocess.run(cmd, cwd=str(PROJECT_ROOT))
    elapsed = time.time() - t0
    mins, secs = divmod(int(elapsed), 60)
    ok = proc.returncode == 0
    status = "OK" if ok else f"FAILED (exit {proc.returncode})"
    print(f"\n  [{status}] {label} — {mins}m {secs}s")
    return ok


def export_results():
    """Re-export public/experiment_results.json after each experiment."""
    print("\n  -> Re-exporting public/experiment_results.json ...")
    subprocess.run(
        [sys.executable, str(SCRIPT_DIR / "export_experiment_results.py")],
        cwd=str(PROJECT_ROOT),
    )


def seed_model_exists() -> bool:
    return (PROJECT_ROOT / "models" / "round_0" / "best.pt").exists()


def copy_seed_model_for_ablation(tag: str):
    """Copy round_0 best.pt into a tagged folder so ablations start from seed."""
    src = PROJECT_ROOT / "models" / "round_0" / "best.pt"
    dst = PROJECT_ROOT / "models" / f"round_0_{tag}"
    dst.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst / "best.pt")
    print(f"  Copied seed model -> models/round_0_{tag}/best.pt")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args():
    p = argparse.ArgumentParser(description="Run all LabelLess AI experiments")
    p.add_argument("--budget", type=int, default=100,
                   help="# images to label per strategy run (default: 100)")
    p.add_argument("--epochs-seed", type=int, default=50,
                   help="Epochs for Round 0 seed training (default: 50)")
    p.add_argument("--epochs-round", type=int, default=15,
                   help="Epochs per strategy round on CPU (default: 15)")
    p.add_argument("--patience", type=int, default=5,
                   help="Early stopping patience (default: 5)")
    p.add_argument("--batch", type=int, default=8,
                   help="Batch size (default: 8 for CPU)")
    p.add_argument("--imgsz", type=int, default=416,
                   help="Image size (default: 416 for CPU speed)")
    p.add_argument("--device", default="cpu",
                   help="Device: cpu / 0 / auto (default: cpu)")
    p.add_argument("--skip-seed", action="store_true",
                   help="Skip Phase 1 seed training if round_0 model already exists")
    p.add_argument("--data-dir", default=str(DATA_DIR),
                   help=f"Dataset root (default: {DATA_DIR})")
    return p.parse_args()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def pre_flight_check(data_dir_path: Path, budget: int, imgsz: int, batch: int, epochs_round: int, patience: int, device: str) -> bool:
    print("\n" + "=" * 60)
    print("  PRE-FLIGHT CHECK")
    print("=" * 60)

    seed_dir = data_dir_path / "seed" / "images"
    if not seed_dir.exists():
        seed_dir = data_dir_path / "seed"

    pool_dir = data_dir_path / "pool" / "images"
    test_dir = data_dir_path / "test" / "images"
    if not test_dir.exists():
        test_dir = data_dir_path / "test"
    gt_dir = data_dir_path / "pool_ground_truth_hidden" / "labels"

    seed_count = len([f for f in seed_dir.glob("*") if f.suffix.lower() in {".jpg", ".png", ".jpeg"}]) if seed_dir.exists() else 0
    pool_count = len([f for f in pool_dir.glob("*") if f.suffix.lower() in {".jpg", ".png", ".jpeg"}]) if pool_dir.exists() else 0
    test_count = len([f for f in test_dir.glob("*") if f.suffix.lower() in {".jpg", ".png", ".jpeg"}]) if test_dir.exists() else 0
    gt_count = len(list(gt_dir.glob("*.txt"))) if gt_dir.exists() else 0

    round0_model = PROJECT_ROOT / "models" / "round_0" / "best.pt"

    print(f"  Data Directory : {data_dir_path}")
    print(f"  Seed Images    : {seed_count}")
    print(f"  Pool Images    : {pool_count}")
    print(f"  Test Images    : {test_count}")
    print(f"  Ground Truths  : {gt_count}")
    print(f"  Base Model     : {round0_model} (exists: {round0_model.exists()})")
    print(f"  Budget         : {budget}")
    print(f"  Image Size     : {imgsz}")
    print(f"  Batch Size     : {batch}")
    print(f"  Epochs (round) : {epochs_round}")
    print(f"  Patience       : {patience}")
    print(f"  Device         : {device}")
    print("=" * 60)

    errors = []
    if seed_count == 0:
        errors.append("No seed images found.")
    if pool_count == 0:
        errors.append("No pool images found.")
    if test_count == 0:
        errors.append("No test images found.")
    if gt_count == 0:
        errors.append("No hidden ground truth labels found.")

    if errors:
        for err in errors:
            print(f"  ❌ ERROR: {err}", file=sys.stderr)
        return False

    print("  ✅ All pre-flight checks passed!\n")
    return True


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args():
    p = argparse.ArgumentParser(description="Run all LabelLess AI experiments")
    p.add_argument("--budget", type=int, default=100,
                   help="# images to label per strategy run (default: 100)")
    p.add_argument("--epochs-seed", type=int, default=50,
                   help="Epochs for Round 0 seed training (default: 50)")
    p.add_argument("--epochs-round", type=int, default=15,
                   help="Epochs per strategy round on CPU (default: 15)")
    p.add_argument("--patience", type=int, default=5,
                   help="Early stopping patience (default: 5)")
    p.add_argument("--batch", type=int, default=8,
                   help="Batch size (default: 8 for CPU)")
    p.add_argument("--imgsz", type=int, default=416,
                   help="Image size (default: 416 for CPU speed)")
    p.add_argument("--device", default="cpu",
                   help="Device: cpu / 0 / auto (default: cpu)")
    p.add_argument("--skip-seed", action="store_true",
                   help="Skip Phase 1 seed training if round_0 model already exists")
    p.add_argument("--data-dir", default=str(DATA_DIR),
                   help=f"Dataset root (default: {DATA_DIR})")
    return p.parse_args()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    args = parse_args()
    budget = args.budget
    e_round = args.epochs_round
    patience = args.patience
    batch = args.batch
    imgsz = args.imgsz
    device = args.device
    data_dir = args.data_dir

    if not pre_flight_check(Path(data_dir), budget, imgsz, batch, e_round, patience, device):
        sys.exit(1)

    seed_model_path = PROJECT_ROOT / "models" / "round_0" / "best.pt"

    base_flags = [
        "--batch", str(batch),
        "--imgsz", str(imgsz),
        "--patience", str(patience),
        "--device", device,
        "--data-dir", data_dir,
        "--base-model", str(seed_model_path),
    ]

    results: dict[str, bool] = {}

    # -----------------------------------------------------------------------
    # PHASE 1 — Seed training (Round 0, shared baseline)
    # -----------------------------------------------------------------------
    if args.skip_seed and seed_model_exists():
        print("\n[PHASE 1] SKIPPED — round_0 model already exists.")
        results["seed_round0"] = True
    else:
        print("\n[PHASE 1] Training SEED model (Round 0 — shared cold-start baseline)")
        ok = run(
            [sys.executable, str(SCRIPT_DIR / "run_experiment.py"),
             "--method", "labelless",
             "--round", "0",
             "--budget", "0",   # Round 0 uses seed data only, no pool budget
             "--epochs", str(args.epochs_seed),
             "--batch", str(batch),
             "--imgsz", str(imgsz),
             "--patience", str(patience),
             "--device", device,
             "--data-dir", data_dir],
            "Seed Training — Round 0",
        )
        results["seed_round0"] = ok
        export_results()

        if not ok:
            print("\n[FATAL] Seed training failed. Cannot continue.", file=sys.stderr)
            sys.exit(1)

    if not seed_model_path.exists():
        print(f"\n[FATAL] Expected seed model at {seed_model_path} does not exist.", file=sys.stderr)
        sys.exit(1)

    # -----------------------------------------------------------------------
    # PHASE 1.5 — Generate fresh predictions & rank queue from Round 0 model
    # -----------------------------------------------------------------------
    print("\n[PHASE 1.5] Generating predictions on pool images using Round 0 seed model...")
    gen_ok = run(
        [sys.executable, str(SCRIPT_DIR / "generate_predictions.py"),
         "--input", str(Path(data_dir) / "pool" / "images"),
         "--model", str(seed_model_path),
         "--output", str(PROJECT_ROOT / "outputs" / "predictions.json"),
         "--conf", "0.25",
         "--device", device],
        "Generating Predictions from Round 0 Model",
    )
    if not gen_ok:
        print("\n[FATAL] Failed to generate pool predictions.", file=sys.stderr)
        sys.exit(1)

    print("\n[PHASE 1.6] Ranking pool images with default LabelLess weights...")
    rank_ok = run(
        [sys.executable, str(SCRIPT_DIR / "rank.py"),
         "--input", str(PROJECT_ROOT / "outputs" / "predictions.json"),
         "--output", str(PROJECT_ROOT / "inputs" / "ranked_queue.json")],
        "Ranking Pool Images",
    )
    if not rank_ok:
        print("\n[FATAL] Failed to rank pool images.", file=sys.stderr)
        sys.exit(1)

    # -----------------------------------------------------------------------
    # PHASE 2 — Strategy comparison (Random, Confidence, LabelLess)
    # -----------------------------------------------------------------------
    print(f"\n[PHASE 2] Running 3 strategy comparison experiments (budget={budget})")

    for method in ["random", "confidence", "labelless"]:
        label = f"Strategy: {method.upper()} — Round 1 — budget={budget}"
        ok = run(
            [sys.executable, str(SCRIPT_DIR / "run_experiment.py"),
             "--method", method,
             "--round", "1",
             "--budget", str(budget),
             "--epochs", str(e_round),
             ] + base_flags,
            label,
        )
        results[f"strategy_{method}"] = ok
        export_results()

        if not ok:
            print(f"\n[WARN] Experiment '{method}' failed — continuing with remaining.", file=sys.stderr)

    # -----------------------------------------------------------------------
    # PHASE 3 — Ablation study (all 3 starting from the SEED model)
    # -----------------------------------------------------------------------
    print(f"\n[PHASE 3] Running 3 ablation experiments (budget={budget})")

    import yaml

    config_path = PROJECT_ROOT / "config.yaml"
    with open(config_path, "r", encoding="utf-8") as f:
        original_config = f.read()

    ablations = [
        {
            "tag": "uncertainty_only",
            "label": "Ablation: Uncertainty Only",
            "weights": {"w_uncertainty": 1.0, "w_rare_class": 0.0, "w_diversity": 0.0},
            "method": "confidence",
        },
        {
            "tag": "uncertainty_rarity",
            "label": "Ablation: Uncertainty + Rarity",
            "weights": {"w_uncertainty": 0.7, "w_rare_class": 0.3, "w_diversity": 0.0},
            "method": "labelless",
        },
        {
            "tag": "uncertainty_rarity_diversity",
            "label": "Ablation: Uncertainty + Rarity + Diversity (Full LabelLess)",
            "weights": {"w_uncertainty": 0.7, "w_rare_class": 0.2, "w_diversity": 0.1},
            "method": "labelless",
        },
    ]

    for abl in ablations:
        tag = abl["tag"]
        label = abl["label"]
        weights = abl["weights"]
        method = abl["method"]

        print(f"\n  Patching config.yaml for ablation: {tag}")
        cfg = yaml.safe_load(original_config)
        cfg["ranking"]["w_uncertainty"] = weights["w_uncertainty"]
        cfg["ranking"]["w_rare_class"] = weights["w_rare_class"]
        cfg["ranking"]["w_diversity"] = weights["w_diversity"]

        with open(config_path, "w", encoding="utf-8") as f:
            yaml.dump(cfg, f, default_flow_style=False, allow_unicode=True)

        if method == "labelless":
            print(f"  Re-ranking with weights {weights} ...")
            rank_ok = subprocess.run(
                [sys.executable, str(SCRIPT_DIR / "rank.py"),
                 "--input", str(PROJECT_ROOT / "outputs" / "predictions.json"),
                 "--output", str(PROJECT_ROOT / "inputs" / "ranked_queue.json")],
                cwd=str(PROJECT_ROOT),
            ).returncode == 0
            if not rank_ok:
                print(f"  [WARN] Re-ranking failed for {tag}", file=sys.stderr)

        abl_round_map = {
            "uncertainty_only": 10,
            "uncertainty_rarity": 11,
            "uncertainty_rarity_diversity": 12,
        }
        abl_round = abl_round_map[tag]

        ok = run(
            [sys.executable, str(SCRIPT_DIR / "run_experiment.py"),
             "--method", method,
             "--round", str(abl_round),
             "--budget", str(budget),
             "--epochs", str(e_round),
             ] + base_flags,
            label,
        )
        results[f"ablation_{tag}"] = ok

        # Restore config.yaml
        with open(config_path, "w", encoding="utf-8") as f:
            f.write(original_config)
        print(f"  Restored config.yaml")

        # Patch the saved metrics file to carry the correct method tag for export
        metrics_dir = PROJECT_ROOT / "results" / "metrics"
        # Find the metric file just written for this ablation round
        ablation_metric_files = sorted(metrics_dir.glob(f"round_{abl_round}_*.json"))
        if ablation_metric_files:
            metric_path = ablation_metric_files[-1]
            with open(metric_path, "r", encoding="utf-8") as f:
                metric_data = json.load(f)
            metric_data["method"] = tag
            with open(metric_path, "w", encoding="utf-8") as f:
                json.dump(metric_data, f, indent=2)
            print(f"  Tagged metrics method='{tag}' in {metric_path.name}")

        export_results()

        if not ok:
            print(f"\n[WARN] Ablation '{tag}' failed — continuing.", file=sys.stderr)

    # -----------------------------------------------------------------------
    # Final restore and summary
    # -----------------------------------------------------------------------
    with open(config_path, "w", encoding="utf-8") as f:
        f.write(original_config)

    # Also restore correct rank order
    subprocess.run(
        [sys.executable, str(SCRIPT_DIR / "rank.py")],
        cwd=str(PROJECT_ROOT),
    )

    export_results()

    print("\n" + "=" * 60)
    print("  EXPERIMENT SUITE COMPLETE")
    print("=" * 60)
    for name, ok in results.items():
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] {name}")
    print()

    failed = sum(1 for ok in results.values() if not ok)
    if failed:
        print(f"  {failed} experiment(s) failed. Check logs above.", file=sys.stderr)
        sys.exit(1)
    else:
        print("  All experiments completed successfully!")
        print("  -> public/experiment_results.json updated.")
        print("  -> Evidence page now shows verified results.")
    print()


if __name__ == "__main__":
    main()
