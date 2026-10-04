"""
aggregate_metrics.py

Reads all metric JSON files from results/metrics/ and produces:
  1. results/summary.json  — combined comparison table
  2. Printed comparison table to stdout (for D2 to consume)

Usage:
    python scripts/aggregate_metrics.py
    python scripts/aggregate_metrics.py --metrics-dir results/metrics
"""

import argparse
import json
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def load_all_metrics(metrics_dir: Path) -> list[dict]:
    """Load all JSON metric files from the given directory."""
    if not metrics_dir.exists():
        print(f"Metrics directory not found: {metrics_dir}")
        return []

    results = []
    for json_file in sorted(metrics_dir.glob("*.json")):
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            data["_source_file"] = json_file.name
            results.append(data)
        except (json.JSONDecodeError, IOError) as exc:
            print(f"  [WARN] Skipping {json_file.name}: {exc}")

    return results


def print_comparison_table(results: list[dict]) -> None:
    """Print a formatted comparison table."""
    if not results:
        print("No metrics found.")
        return

    # Sort by round, then method
    results.sort(key=lambda r: (r.get("round", 0), r.get("method", "")))

    sep = "=" * 90
    print(f"\n{sep}")
    print("  LabelLess AI - Experiment Comparison")
    print(sep)

    # Header
    header = f"  {'Method':<15} {'Round':>5} {'Budget':>7} {'mAP50':>8} {'mAP50-95':>9} {'Precision':>10} {'Recall':>8} {'F1':>8}"
    print(header)
    print("  " + "-" * 86)

    for r in results:
        method = r.get("method", "?")
        round_num = r.get("round", "?")
        budget = r.get("budget", "?")
        map50 = r.get("mAP50", 0)
        map50_95 = r.get("mAP50_95", 0)
        precision = r.get("precision", 0)
        recall = r.get("recall", 0)
        f1 = r.get("f1", 0)

        print(f"  {method:<15} {round_num:>5} {budget:>7} {map50:>8.4f} {map50_95:>9.4f} {precision:>10.4f} {recall:>8.4f} {f1:>8.4f}")

    print(sep)

    # Effort reduction summary
    print("\n  Annotation Effort Summary:")
    print("  " + "-" * 50)
    for r in results:
        total = r.get("total_pool_images", 0)
        reviewed = r.get("images_reviewed", 0)
        if total > 0:
            effort_saved = (1 - reviewed / total) * 100
            print(f"  {r.get('method', '?'):<15} Round {r.get('round', '?')}: "
                  f"{reviewed}/{total} reviewed ({effort_saved:.1f}% no human review)")

    print()


def save_summary(results: list[dict], output_path: Path) -> None:
    """Save aggregated summary to JSON."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Strip internal metadata
    clean = []
    for r in results:
        clean_r = {k: v for k, v in r.items() if not k.startswith("_")}
        clean.append(clean_r)

    summary = {
        "experiments": clean,
        "num_experiments": len(clean),
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"  Saved summary -> {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Aggregate all experiment metrics into a comparison table."
    )
    parser.add_argument(
        "--metrics-dir", type=Path, default=None,
        help="Directory containing metric JSON files (default: results/metrics/).",
    )

    args = parser.parse_args()

    project_root = Path(__file__).resolve().parent.parent
    metrics_dir = args.metrics_dir or (project_root / "results" / "metrics")
    summary_path = project_root / "results" / "summary.json"

    results = load_all_metrics(metrics_dir)

    if not results:
        print(f"No metric files found in {metrics_dir}")
        print("Run experiments first with: python scripts/run_experiment.py")
        sys.exit(0)

    print_comparison_table(results)
    save_summary(results, summary_path)

    # Automatically sync to public/experiment_results.json for UI consumption
    try:
        from export_experiment_results import main as export_main
        export_main()
    except Exception as exc:
        print(f"  [WARN] Could not sync experiment_results.json: {exc}")


if __name__ == "__main__":
    main()

