#!/usr/bin/env python3
"""
plot_results.py - Generate high-quality publication-ready graphs for active learning evaluation.

Generates:
1. plots/map_vs_annotation_effort.png  (Key graph: mAP vs % human annotation effort)
2. plots/map_by_round.png              (mAP progression by active learning round)
3. plots/precision_recall.png          (Precision vs Recall trade-off trajectory)
4. plots/method_comparison.png         (Multi-panel summary benchmark)
"""

import argparse
import json
import os
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np


# Method visual styles
METHOD_STYLES = {
    "labelless": {
        "label": "Labelless AI (Ours)",
        "color": "#4F46E5",      # Indigo
        "marker": "o",
        "linestyle": "-",
        "linewidth": 2.5,
        "markersize": 8,
    },
    "confidence": {
        "label": "Least Confidence",
        "color": "#059669",      # Emerald
        "marker": "s",
        "linestyle": "--",
        "linewidth": 2.0,
        "markersize": 7,
    },
    "random": {
        "label": "Random Sampling (Baseline)",
        "color": "#DC2626",      # Red / Crimson
        "marker": "^",
        "linestyle": ":",
        "linewidth": 2.0,
        "markersize": 7,
    },
}


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


def load_and_group_metrics(metrics_path: Path):
    with open(metrics_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    by_method = {}
    for entry in data:
        m = entry["method"]
        if m not in by_method:
            by_method[m] = []
        by_method[m].append(entry)

    # Sort each method's records by round
    for m in by_method:
        by_method[m].sort(key=lambda x: x["round"])

    return by_method


def setup_matplotlib_theme():
    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
    plt.rcParams.update({
        "font.size": 11,
        "axes.labelsize": 12,
        "axes.titlesize": 14,
        "xtick.labelsize": 10,
        "ytick.labelsize": 10,
        "legend.fontsize": 11,
        "figure.titlesize": 16,
        "grid.alpha": 0.35,
        "grid.linestyle": "--",
    })


def plot_map_vs_annotation_effort(by_method, output_file: Path):
    """
    KEY GRAPH: mAP50 on y-axis, % human annotation effort on x-axis.
    One curve per method.
    """
    fig, ax = plt.subplots(figsize=(9, 6), dpi=300)

    for method, entries in by_method.items():
        style = METHOD_STYLES.get(method, {
            "label": method.capitalize(),
            "color": "#333333",
            "marker": "o",
            "linestyle": "-",
            "linewidth": 2.0,
            "markersize": 6,
        })

        effort_pcts = [
            (e["images_reviewed"] / e.get("total_images", 1000)) * 100.0 for e in entries
        ]
        maps = [e["mAP50"] for e in entries]

        ax.plot(
            effort_pcts,
            maps,
            label=style["label"],
            color=style["color"],
            marker=style["marker"],
            linestyle=style["linestyle"],
            linewidth=style["linewidth"],
            markersize=style["markersize"],
            clip_on=False,
        )

        # Highlight final point
        ax.scatter(
            [effort_pcts[-1]],
            [maps[-1]],
            color=style["color"],
            s=120,
            zorder=5,
            edgecolors="black",
            linewidth=1.2,
        )

    # Key callout on Labelless efficiency
    if "labelless" in by_method:
        ll_final = by_method["labelless"][-1]
        ll_effort = (ll_final["images_reviewed"] / ll_final.get("total_images", 1000)) * 100
        ll_map = ll_final["mAP50"]

        ax.annotate(
            f"Labelless: {ll_map:.1%} mAP50\nat only {ll_effort:.1f}% human effort",
            xy=(ll_effort, ll_map),
            xytext=(ll_effort - 10, ll_map + 0.05),
            arrowprops=dict(facecolor="#4F46E5", edgecolor="#4F46E5", arrowstyle="->", lw=1.8),
            bbox=dict(boxstyle="round,pad=0.5", fc="#EEF2FF", ec="#818CF8", lw=1.2),
            fontweight="bold",
            color="#312E81",
            fontsize=10,
        )

    # Callout for Random baseline at end
    if "random" in by_method:
        rand_final = by_method["random"][-1]
        rand_effort = (rand_final["images_reviewed"] / rand_final.get("total_images", 1000)) * 100
        rand_map = rand_final["mAP50"]

        ax.annotate(
            f"Random: {rand_map:.1%} mAP50\n(requires {rand_effort:.1f}% effort)",
            xy=(rand_effort, rand_map),
            xytext=(rand_effort - 15, rand_map - 0.08),
            arrowprops=dict(facecolor="#DC2626", edgecolor="#DC2626", arrowstyle="->", lw=1.5),
            bbox=dict(boxstyle="round,pad=0.5", fc="#FEF2F2", ec="#F87171", lw=1.2),
            color="#7F1D1D",
            fontsize=9.5,
        )

    ax.set_title("mAP@0.50 vs. Human Annotation Effort", fontweight="bold", pad=15)
    ax.set_xlabel("Human Annotation Effort (% of Total Pool Reviewed)", fontweight="bold", labelpad=8)
    ax.set_ylabel("Detection Performance (mAP@0.50)", fontweight="bold", labelpad=8)
    ax.set_ylim(0.30, 0.85)
    ax.set_xlim(5, 55)
    ax.yaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(xmax=1.0, decimals=0))
    ax.xaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(xmax=100, decimals=0))

    ax.legend(frameon=True, facecolor="white", edgecolor="#E5E7EB", loc="lower right")
    fig.tight_layout()

    output_file.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_file, dpi=300)
    plt.close(fig)
    print(f"  [SAVED] {output_file}")


def plot_map_by_round(by_method, output_file: Path):
    """
    mAP progression across rounds (mAP50 and mAP50-95).
    """
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.5), dpi=300)

    for method, entries in by_method.items():
        style = METHOD_STYLES.get(method, {"label": method, "color": "#333", "marker": "o"})
        rounds = [e["round"] for e in entries]
        maps50 = [e["mAP50"] for e in entries]
        maps50_95 = [e.get("mAP50_95", 0.0) for e in entries]

        # Left panel: mAP50
        ax1.plot(
            rounds,
            maps50,
            label=style["label"],
            color=style["color"],
            marker=style["marker"],
            linewidth=2.2,
            markersize=7,
        )

        # Right panel: mAP50-95
        ax2.plot(
            rounds,
            maps50_95,
            label=style["label"],
            color=style["color"],
            marker=style["marker"],
            linewidth=2.2,
            markersize=7,
        )

    # Panel 1 config
    ax1.set_title("mAP@0.50 Progression Across Rounds", fontweight="bold", pad=12)
    ax1.set_xlabel("Active Learning Round", fontweight="bold")
    ax1.set_ylabel("mAP@0.50", fontweight="bold")
    ax1.set_xticks(sorted(list({e['round'] for entries in by_method.values() for e in entries})))
    ax1.yaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(xmax=1.0, decimals=0))
    ax1.legend(frameon=True, facecolor="white", edgecolor="#E5E7EB", loc="lower right")

    # Panel 2 config
    ax2.set_title("Strict mAP@[0.50:0.95] Progression Across Rounds", fontweight="bold", pad=12)
    ax2.set_xlabel("Active Learning Round", fontweight="bold")
    ax2.set_ylabel("mAP@[0.50:0.95]", fontweight="bold")
    ax2.set_xticks(sorted(list({e['round'] for entries in by_method.values() for e in entries})))
    ax2.yaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(xmax=1.0, decimals=0))
    ax2.legend(frameon=True, facecolor="white", edgecolor="#E5E7EB", loc="lower right")

    fig.tight_layout()
    output_file.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_file, dpi=300)
    plt.close(fig)
    print(f"  [SAVED] {output_file}")


def plot_precision_recall(by_method, output_file: Path):
    """
    Precision vs Recall trajectory for each method across rounds.
    """
    fig, ax = plt.subplots(figsize=(8, 6), dpi=300)

    for method, entries in by_method.items():
        style = METHOD_STYLES.get(method, {"label": method, "color": "#333", "marker": "o"})
        precisions = [e["precision"] for e in entries]
        recalls = [e["recall"] for e in entries]

        ax.plot(
            recalls,
            precisions,
            label=style["label"],
            color=style["color"],
            marker=style["marker"],
            linewidth=2.2,
            markersize=7,
        )

        # Annotate Round 0 and Final Round
        ax.text(
            recalls[0] - 0.015,
            precisions[0] - 0.02,
            "R0",
            fontsize=8.5,
            color=style["color"],
            fontweight="bold",
        )
        ax.text(
            recalls[-1] + 0.008,
            precisions[-1] + 0.005,
            f"R{entries[-1]['round']}",
            fontsize=9,
            color=style["color"],
            fontweight="bold",
        )

    # Iso-F1 contour curves for reference
    f_scores = np.linspace(0.4, 0.8, 5)
    for f in f_scores:
        x = np.linspace(0.30, 0.85, 100)
        denom = 2 * x - f
        mask = denom > 1e-5
        x_sub = x[mask]
        y_sub = (f * x_sub) / denom[mask]
        valid = (y_sub >= 0.35) & (y_sub <= 0.85)
        x_val = x_sub[valid]
        y_val = y_sub[valid]
        ax.plot(x_val, y_val, color="#CBD5E1", linestyle=":", linewidth=1.0)
        if len(x_val) > 0:
            idx = len(x_val) // 2
            ax.text(x_val[idx], y_val[idx], f" F1={f:.1f}", color="#94A3B8", fontsize=7.5)

    ax.set_title("Precision vs. Recall Trajectory", fontweight="bold", pad=15)
    ax.set_xlabel("Recall", fontweight="bold", labelpad=8)
    ax.set_ylabel("Precision", fontweight="bold", labelpad=8)
    ax.set_xlim(0.32, 0.82)
    ax.set_ylim(0.40, 0.85)
    ax.xaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(xmax=1.0, decimals=0))
    ax.yaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(xmax=1.0, decimals=0))

    ax.legend(frameon=True, facecolor="white", edgecolor="#E5E7EB", loc="lower right")
    fig.tight_layout()
    output_file.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_file, dpi=300)
    plt.close(fig)
    print(f"  [SAVED] {output_file}")


def plot_method_comparison(by_method, output_file: Path):
    """
    Multi-metric comparison bar chart: mAP50, mAP50-95, Effort (Images Reviewed), and Effort Reduction.
    """
    fig, axes = plt.subplots(2, 2, figsize=(12, 10), dpi=300)
    (ax1, ax2), (ax3, ax4) = axes

    methods = list(by_method.keys())
    # Canonical order if present
    preferred_order = ["random", "confidence", "labelless"]
    methods = [m for m in preferred_order if m in by_method] + [m for m in methods if m not in preferred_order]

    labels = [METHOD_STYLES.get(m, {}).get("label", m.capitalize()) for m in methods]
    colors = [METHOD_STYLES.get(m, {}).get("color", "#4B5563") for m in methods]

    final_entries = [by_method[m][-1] for m in methods]

    # 1. Final mAP50
    map50_vals = [e["mAP50"] for e in final_entries]
    bars1 = ax1.bar(labels, map50_vals, color=colors, width=0.55, edgecolor="#111827", linewidth=0.8)
    ax1.set_title("Final Detection mAP@0.50 (Higher is Better)", fontweight="bold")
    ax1.set_ylabel("mAP@0.50")
    ax1.set_ylim(0, 0.90)
    ax1.yaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(xmax=1.0, decimals=0))
    for bar in bars1:
        yval = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width() / 2.0, yval + 0.02, f"{yval:.1%}", ha="center", va="bottom", fontweight="bold", fontsize=10)

    # 2. Final mAP50-95
    map50_95_vals = [e.get("mAP50_95", 0.0) for e in final_entries]
    bars2 = ax2.bar(labels, map50_95_vals, color=colors, width=0.55, edgecolor="#111827", linewidth=0.8)
    ax2.set_title("Final mAP@[0.50:0.95] (Strict Metric)", fontweight="bold")
    ax2.set_ylabel("mAP@[0.50:0.95]")
    ax2.set_ylim(0, 0.65)
    ax2.yaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(xmax=1.0, decimals=0))
    for bar in bars2:
        yval = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width() / 2.0, yval + 0.015, f"{yval:.1%}", ha="center", va="bottom", fontweight="bold", fontsize=10)

    # 3. Images Reviewed (Human Annotation Effort)
    reviewed_vals = [e["images_reviewed"] for e in final_entries]
    bars3 = ax3.bar(labels, reviewed_vals, color=colors, width=0.55, edgecolor="#111827", linewidth=0.8)
    ax3.set_title("Human Annotation Effort (Lower is Better)", fontweight="bold")
    ax3.set_ylabel("Images Reviewed by Human")
    ax3.set_ylim(0, max(reviewed_vals) * 1.25)
    for bar in bars3:
        yval = bar.get_height()
        pct = (yval / 1000.0) * 100
        ax3.text(bar.get_x() + bar.get_width() / 2.0, yval + 15, f"{int(yval)} imgs\n({pct:.1f}%)", ha="center", va="bottom", fontweight="bold", fontsize=9.5)

    # 4. Human Effort Reduction vs Random Baseline
    baseline_reviewed = next((e["images_reviewed"] for e in final_entries if e["method"] == "random"), reviewed_vals[0])
    reductions = [
        ((baseline_reviewed - e["images_reviewed"]) / baseline_reviewed) * 100.0 for e in final_entries
    ]
    bars4 = ax4.bar(labels, reductions, color=colors, width=0.55, edgecolor="#111827", linewidth=0.8)
    ax4.set_title("Effort Reduction vs. Random Baseline (%)", fontweight="bold")
    ax4.set_ylabel("Effort Reduction (%)")
    ax4.set_ylim(-5, max(reductions) * 1.35 if max(reductions) > 0 else 50)
    for bar, m in zip(bars4, methods):
        yval = bar.get_height()
        text = f"{yval:+.1f}%" if m != "random" else "Baseline (0%)"
        ax4.text(bar.get_x() + bar.get_width() / 2.0, max(yval, 0) + 2, text, ha="center", va="bottom", fontweight="bold", fontsize=10)

    for ax in [ax1, ax2, ax3, ax4]:
        ax.tick_params(axis="x", rotation=10)

    fig.suptitle("Benchmark Comparison Across Active Learning Strategies", fontsize=16, fontweight="bold", y=0.99)
    fig.tight_layout()
    output_file.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_file, dpi=300)
    plt.close(fig)
    print(f"  [SAVED] {output_file}")


def main():
    parser = argparse.ArgumentParser(description="Generate publication-ready evaluation plots.")
    parser.add_argument("--metrics", type=str, default=None, help="Path to metrics.json")
    parser.add_argument("--output-dir", type=str, default="plots", help="Directory to save plots")
    parser.add_argument("--mirror-to-results", action="store_true", default=True, help="Also save copies in results/plots/")
    args = parser.parse_args()

    metrics_path = find_metrics_file(args.metrics)
    print(f"\n[INFO] Loading metrics for plotting from: {metrics_path}")
    by_method = load_and_group_metrics(metrics_path)

    setup_matplotlib_theme()

    out_dir = Path(args.output_dir)
    print(f"\n[INFO] Generating plots in '{out_dir}':")

    plot1 = out_dir / "map_vs_annotation_effort.png"
    plot2 = out_dir / "map_by_round.png"
    plot3 = out_dir / "precision_recall.png"
    plot4 = out_dir / "method_comparison.png"

    plot_map_vs_annotation_effort(by_method, plot1)
    plot_map_by_round(by_method, plot2)
    plot_precision_recall(by_method, plot3)
    plot_method_comparison(by_method, plot4)

    if args.mirror_to_results:
        res_plot_dir = Path("results/plots")
        print(f"\n[INFO] Mirroring plots to '{res_plot_dir}':")
        plot_map_vs_annotation_effort(by_method, res_plot_dir / "map_vs_annotation_effort.png")
        plot_map_by_round(by_method, res_plot_dir / "map_by_round.png")
        plot_precision_recall(by_method, res_plot_dir / "precision_recall.png")
        plot_method_comparison(by_method, res_plot_dir / "method_comparison.png")

    print(f"\n[SUCCESS] All plots successfully generated!\n")


if __name__ == "__main__":
    main()
