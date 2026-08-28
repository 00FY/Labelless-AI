#!/usr/bin/env python3
"""
calculate_effort.py - Compute annotation effort metrics for active learning methods.

Calculates:
- Human review rate (images reviewed / total pool images)
- Images automatically handled (total pool images - images reviewed)
- Effort reduction percentage compared to baseline (random)
- Annotation efficiency (mAP gain per reviewed sample)
- Human labeling hours saved (based on estimated seconds per image)

Outputs:
- CLI terminal report
- results/effort_summary.json
- results/effort_summary.csv
"""

import argparse
import csv
import json
import os
from pathlib import Path


def find_metrics_file(specified_path=None):
    if specified_path and os.path.exists(specified_path):
        return Path(specified_path)
    candidates = [
        Path("results/metrics.json"),
        Path("metrics.json"),
        Path("outputs/metrics.json"),
    ]
    for c in candidates:
        if c.exists():
            return c
    raise FileNotFoundError(
        f"Could not find metrics.json in candidates: {[str(c) for c in candidates]}"
    )


def compute_effort_metrics(metrics_data, baseline_method="random", time_per_image_sec=25.0):
    """
    Computes effort metrics per method for the final round and across all rounds.
    """
    # Group by method
    by_method = {}
    for r in metrics_data:
        m = r["method"]
        if m not in by_method:
            by_method[m] = []
        by_method[m].append(r)

    # Sort rounds within each method
    for m in by_method:
        by_method[m].sort(key=lambda x: x["round"])

    # Baseline final stats
    if baseline_method not in by_method:
        raise ValueError(f"Baseline method '{baseline_method}' not found in metrics data: {list(by_method.keys())}")

    baseline_final = by_method[baseline_method][-1]
    baseline_reviewed = baseline_final.get("images_reviewed", 0)

    summary_list = []

    for method, rounds in by_method.items():
        initial_round = rounds[0]
        final_round = rounds[-1]

        total_images = final_round.get("total_images", 1000)
        images_reviewed = final_round.get("images_reviewed", 0)
        images_automatically_handled = max(0, total_images - images_reviewed)
        human_review_rate = (images_reviewed / total_images) if total_images > 0 else 0.0
        human_review_pct = human_review_rate * 100.0

        # Effort reduction vs baseline
        effort_reduction_pct = 0.0
        images_saved_vs_baseline = baseline_reviewed - images_reviewed
        if baseline_reviewed > 0:
            effort_reduction_pct = (images_saved_vs_baseline / baseline_reviewed) * 100.0

        # Time saved
        hours_spent = (images_reviewed * time_per_image_sec) / 3600.0
        hours_saved_vs_baseline = (images_saved_vs_baseline * time_per_image_sec) / 3600.0

        # Performance delta
        map50_start = initial_round.get("mAP50", 0.0)
        map50_final = final_round.get("mAP50", 0.0)
        map50_gain = map50_final - map50_start
        map_efficiency = (map50_gain / images_reviewed * 100.0) if images_reviewed > 0 else 0.0

        summary_list.append({
            "method": method,
            "final_round": final_round["round"],
            "total_images": total_images,
            "images_reviewed": images_reviewed,
            "human_review_rate": round(human_review_rate, 4),
            "human_review_pct": round(human_review_pct, 2),
            "images_automatically_handled": images_automatically_handled,
            "automation_pct": round((images_automatically_handled / total_images) * 100.0, 2),
            "effort_reduction_vs_baseline_pct": round(effort_reduction_pct, 2),
            "images_saved_vs_baseline": images_saved_vs_baseline,
            "final_mAP50": round(map50_final, 4),
            "mAP50_gain": round(map50_gain, 4),
            "mAP_gain_per_100_images": round(map_efficiency, 4),
            "human_hours_spent": round(hours_spent, 2),
            "human_hours_saved_vs_baseline": round(hours_saved_vs_baseline, 2),
        })

    return summary_list


def format_table(headers, rows):
    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, val in enumerate(row):
            col_widths[i] = max(col_widths[i], len(str(val)))

    sep_line = "+" + "+".join("-" * (w + 2) for w in col_widths) + "+"
    header_line = "| " + " | ".join(f"{headers[i]:<{col_widths[i]}}" for i in range(len(headers))) + " |"

    data_lines = []
    for row in rows:
        line = "| " + " | ".join(f"{str(row[i]):<{col_widths[i]}}" for i in range(len(row))) + " |"
        data_lines.append(line)

    return "\n".join([sep_line, header_line, sep_line] + data_lines + [sep_line])


def main():
    parser = argparse.ArgumentParser(description="Calculate human effort reduction and automation rate.")
    parser.add_argument("--metrics", type=str, default=None, help="Path to metrics.json")
    parser.add_argument("--baseline", type=str, default="random", help="Baseline method name (default: random)")
    parser.add_argument("--time-per-image", type=float, default=25.0, help="Estimated human review seconds per image (default: 25)")
    parser.add_argument("--output-json", type=str, default="results/effort_summary.json", help="Path to save effort JSON summary")
    parser.add_argument("--output-csv", type=str, default="results/effort_summary.csv", help="Path to save effort CSV summary")
    args = parser.parse_args()

    metrics_path = find_metrics_file(args.metrics)
    print(f"\n[INFO] Reading metrics from: {metrics_path}")

    with open(metrics_path, "r", encoding="utf-8") as f:
        metrics_data = json.load(f)

    summaries = compute_effort_metrics(
        metrics_data,
        baseline_method=args.baseline,
        time_per_image_sec=args.time_per_image
    )

    headers = [
        "Method",
        "Total Imgs",
        "Reviewed",
        "Auto Handled",
        "Review Rate",
        "Effort Saved %",
        "Final mAP50",
        "Time Saved (hrs)",
    ]
    rows = [
        [
            s["method"],
            s["total_images"],
            s["images_reviewed"],
            s["images_automatically_handled"],
            f"{s['human_review_pct']:.1f}%",
            f"{s['effort_reduction_vs_baseline_pct']:+.1f}%" if s["method"] != args.baseline else "Baseline (0%)",
            f"{s['final_mAP50']:.3f}",
            f"{s['human_hours_saved_vs_baseline']:+.1f}h" if s["method"] != args.baseline else "0.0h",
        ]
        for s in summaries
    ]

    print("\n================================ HUMAN EFFORT & AUTOMATION ANALYSIS ================================")
    print(format_table(headers, rows))

    # Highlighted key findings
    print("\n-------------------------------- KEY FINDINGS --------------------------------")
    for s in summaries:
        if s["method"] != args.baseline:
            print(f"• Method '{s['method']}':")
            print(f"    - Automatically handled: {s['images_automatically_handled']} / {s['total_images']} images ({s['automation_pct']}%)")
            print(f"    - Human review rate: {s['human_review_pct']}% ({s['images_reviewed']} images)")
            print(f"    - Human effort reduction: {s['effort_reduction_vs_baseline_pct']}% compared to {args.baseline}")
            print(f"    - Human time saved: ~{s['human_hours_saved_vs_baseline']} hours (at {args.time_per_image}s/image)")
            print(f"    - Achieved mAP50: {s['final_mAP50']} vs {args.baseline}'s {next(b['final_mAP50'] for b in summaries if b['method']==args.baseline)}")

    # Save outputs
    out_json = Path(args.output_json)
    out_json.parent.mkdir(parents=True, exist_ok=True)
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(summaries, f, indent=2)

    out_csv = Path(args.output_csv)
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(summaries[0].keys()))
        writer.writeheader()
        writer.writerows(summaries)

    print(f"\n[SUCCESS] Effort analysis saved to:")
    print(f"  - {out_json.resolve()}")
    print(f"  - {out_csv.resolve()}\n")


if __name__ == "__main__":
    main()
