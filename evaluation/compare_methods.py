#!/usr/bin/env python3
"""
compare_methods.py - Compare active-learning methods on performance and annotation effort.

Reads metrics.json and produces:
1. Formatted terminal comparison tables (round-by-round and final round summary).
2. A CSV export file (default: results/comparison_table.csv).
"""

import argparse
import csv
import json
import os
import sys
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


def load_metrics(metrics_path: Path):
    with open(metrics_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data


def format_table(headers, rows):
    """Format an ASCII table with dynamic column widths."""
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


def generate_comparison_table(metrics_data):
    """
    Computes comparative statistics per method and per round.
    """
    enriched_records = []

    # Map baseline random images_reviewed by round
    random_reviewed_by_round = {}
    for r in metrics_data:
        if r.get("method") == "random":
            random_reviewed_by_round[r.get("round")] = r.get("images_reviewed", 0)

    for r in metrics_data:
        method = r["method"]
        rnd = r["round"]
        budget = r.get("budget", 0)
        total_images = r.get("total_images", 1000)
        reviewed = r.get("images_reviewed", 0)
        map50 = r.get("mAP50", 0.0)
        map50_95 = r.get("mAP50_95", 0.0)
        precision = r.get("precision", 0.0)
        recall = r.get("recall", 0.0)

        effort_pct = (reviewed / total_images) * 100 if total_images > 0 else 0.0
        
        # Effort reduction vs random baseline at same round
        baseline_reviewed = random_reviewed_by_round.get(rnd, reviewed)
        effort_reduction_pct = 0.0
        if baseline_reviewed > 0:
            effort_reduction_pct = ((baseline_reviewed - reviewed) / baseline_reviewed) * 100

        enriched_records.append({
            "method": method,
            "round": rnd,
            "budget": budget,
            "total_images": total_images,
            "images_reviewed": reviewed,
            "effort_pct": round(effort_pct, 2),
            "mAP50": round(map50, 4),
            "mAP50_95": round(map50_95, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "effort_reduction_vs_random_pct": round(effort_reduction_pct, 2),
        })

    return enriched_records


def save_csv(records, output_path: Path):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "method",
        "round",
        "budget",
        "total_images",
        "images_reviewed",
        "effort_pct",
        "mAP50",
        "mAP50_95",
        "precision",
        "recall",
        "effort_reduction_vs_random_pct",
    ]
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)


def main():
    parser = argparse.ArgumentParser(description="Compare active learning methods across rounds and budgets.")
    parser.add_argument("--metrics", type=str, default=None, help="Path to metrics.json file")
    parser.add_argument("--output", type=str, default="results/comparison_table.csv", help="Path for CSV output")
    args = parser.parse_args()

    metrics_path = find_metrics_file(args.metrics)
    print(f"\n[INFO] Loading metrics from: {metrics_path}")
    metrics_data = load_metrics(metrics_path)

    records = generate_comparison_table(metrics_data)

    # Detailed round-by-round table
    headers_all = ["Method", "Round", "Budget", "Reviewed", "Total", "Effort %", "mAP50", "mAP50-95", "Prec.", "Recall"]
    rows_all = [
        [
            r["method"],
            r["round"],
            r["budget"],
            r["images_reviewed"],
            r["total_images"],
            f"{r['effort_pct']:.1f}%",
            f"{r['mAP50']:.3f}",
            f"{r['mAP50_95']:.3f}",
            f"{r['precision']:.3f}",
            f"{r['recall']:.3f}",
        ]
        for r in records
    ]

    print("\n================================ ACTIVE LEARNING ROUND-BY-ROUND BREAKDOWN ================================")
    print(format_table(headers_all, rows_all))

    # Final round summary
    max_round = max(r["round"] for r in records)
    final_records = [r for r in records if r["round"] == max_round]
    
    headers_summary = ["Method", "Final Round", "Reviewed", "Effort %", "mAP50", "mAP50-95", "Effort Saved vs Random"]
    rows_summary = [
        [
            r["method"],
            r["round"],
            r["images_reviewed"],
            f"{r['effort_pct']:.1f}%",
            f"{r['mAP50']:.3f}",
            f"{r['mAP50_95']:.3f}",
            f"{r['effort_reduction_vs_random_pct']:+.1f}%" if r["method"] != "random" else "Baseline (0%)",
        ]
        for r in final_records
    ]

    print("\n================================ FINAL ROUND SUMMARY (Round {}) ================================".format(max_round))
    print(format_table(headers_summary, rows_summary))

    output_path = Path(args.output)
    save_csv(records, output_path)
    print(f"\n[SUCCESS] Comparison table exported to: {output_path.resolve()}\n")


if __name__ == "__main__":
    main()
