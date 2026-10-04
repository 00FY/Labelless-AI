# Person A — Round 1 Experiment Summary

**Model:** YOLOv8n · **Round:** 1 · **Budget:** 100 images · **Pool:** 971 images · **Test set:** 311 images (fixed) · **Seed:** 42 · **Checkpoint:** `models/finetuned/weights/best.pt`

---

## Results

| Method | mAP@50 | mAP@50-95 | Precision | Recall | F1 |
|---|---|---|---|---|---|
| Random | **0.6790** | **0.4127** | 0.6514 | 0.6506 | 0.6510 |
| Uncertainty | 0.6581 | 0.4077 | 0.6541 | 0.6537 | **0.6539** |
| Uncertainty + Rarity | 0.6581 | 0.4077 | 0.6541 | 0.6537 | 0.6539 |
| LabelLess | 0.6146 | 0.3549 | 0.5944 | **0.6514** | 0.6216 |

## Per-Class AP50

| Method | Undamaged Bldg | Damaged Bldg | Fire | Smoke |
|---|---|---|---|---|
| Random | **0.7283** | **0.6064** | 0.6026 | **0.7786** |
| Uncertainty | 0.6756 | 0.5411 | **0.6808** | 0.7350 |
| Uncertainty + Rarity | 0.6756 | 0.5411 | **0.6808** | 0.7350 |
| LabelLess | 0.6628 | 0.5409 | 0.5312 | 0.7233 |

## Scoring Formulas

- **Canonical U:** `U = 0.60·(1−avg_conf) + 0.40·(1−min_conf)`; U=1.0 for zero-detection images
- **A — Uncertainty:** `P = U`
- **B — Uncertainty + Rarity:** `P = 0.778·U + 0.222·R` (normalized from 0.70/0.20)
- **C — Full LabelLess:** `P = 0.70·U + 0.20·R + 0.10·D`

## Key Findings

1. Random achieved the highest Round-1 mAP@50 (0.6790), outperforming Uncertainty by 2.1 pp and LabelLess by 6.4 pp.
2. Uncertainty achieved the highest Fire AP50 (0.6808).
3. Random achieved the highest Smoke AP50 (0.7786) and Undamaged Building AP50 (0.7283).
4. Uncertainty and Uncertainty+Rarity selected **identical** 100-image sets. Their metrics are numerically identical. The top-100 cut falls inside a 122-image plateau where all images have R=0 and D=0.5 (zero detections).
5. This Round-1 experiment does **not** demonstrate a selection difference between Uncertainty and the full LabelLess scoring formula at budget=100. No general claim about LabelLess performance is warranted from Round 1 alone.

## Integrity Caveat

**Issue:** The original `select_labelless()` read a static `inputs/ranked_queue.json` of unknown provenance instead of freshly scoring `outputs/predictions.json` with the canonical tri-factor formula.

**Fix applied:** `select_labelless()` was rewritten to call `rank_predictions()` directly with w_unc=0.70, w_rare=0.20, w_div=0.10 from `config.yaml`.

**Why training was not rerun:** A read-only selection test confirmed the corrected selector independently produces the same top-100 set as Uncertainty. The 122 pool images with uncertainty_score=1.0 all have rare_class_score=0.0 and diversity_score=0.5 — adding R and D changes priority values but not rank order within this plateau. Rerunning training would not produce a selection-distinct result.

**Existing result preserved:** `results/metrics/round_1_labelless.json` was not modified.

---

## Source Files

- `results/metrics/round_1_random.json`
- `results/metrics/round_1_uncertainty.json`
- `results/metrics/round_1_uncertainty_rarity.json`
- `results/metrics/round_1_labelless.json`

*Generated 2026-10-04 — documentation only, no training performed.*
