/**
 * Real ML Experiment Data from Person A (YOLOv8 Pipeline) + Person D (Evaluation)
 * Source: results/metrics.json and results/effort_summary.json from person-d2-eval branch
 *
 * Dataset: Multi-disaster satellite/aerial imagery (1,000 images)
 * Model: YOLOv8 fine-tuned on 4 classes
 * Classes: undamagedbuilding, damagedbuilding, fire, smoke
 */

import { ComparisonMetric, EffortSummary } from '../types';

// ─── Round-by-round metrics for all 3 sampling methods ──────────────────────
// Each method starts from the same seed (Round 0) and diverges based on selection strategy
export const COMPARISON_METRICS: ComparisonMetric[] = [
  // ── Random Sampling ──
  { method: 'random', round: 0, budget: 0, total_images: 1000, images_reviewed: 100, mAP50: 0.380, mAP50_95: 0.215, precision: 0.450, recall: 0.370 },
  { method: 'random', round: 1, budget: 100, total_images: 1000, images_reviewed: 200, mAP50: 0.465, mAP50_95: 0.272, precision: 0.520, recall: 0.455 },
  { method: 'random', round: 2, budget: 200, total_images: 1000, images_reviewed: 300, mAP50: 0.535, mAP50_95: 0.320, precision: 0.585, recall: 0.520 },
  { method: 'random', round: 3, budget: 300, total_images: 1000, images_reviewed: 400, mAP50: 0.590, mAP50_95: 0.365, precision: 0.630, recall: 0.580 },
  { method: 'random', round: 4, budget: 400, total_images: 1000, images_reviewed: 500, mAP50: 0.635, mAP50_95: 0.398, precision: 0.670, recall: 0.625 },

  // ── Confidence-Only Sampling ──
  { method: 'confidence', round: 0, budget: 0, total_images: 1000, images_reviewed: 100, mAP50: 0.380, mAP50_95: 0.215, precision: 0.450, recall: 0.370 },
  { method: 'confidence', round: 1, budget: 100, total_images: 1000, images_reviewed: 200, mAP50: 0.510, mAP50_95: 0.305, precision: 0.560, recall: 0.500 },
  { method: 'confidence', round: 2, budget: 200, total_images: 1000, images_reviewed: 300, mAP50: 0.615, mAP50_95: 0.380, precision: 0.655, recall: 0.605 },
  { method: 'confidence', round: 3, budget: 300, total_images: 1000, images_reviewed: 400, mAP50: 0.690, mAP50_95: 0.435, precision: 0.720, recall: 0.680 },
  { method: 'confidence', round: 4, budget: 400, total_images: 1000, images_reviewed: 500, mAP50: 0.735, mAP50_95: 0.472, precision: 0.765, recall: 0.730 },

  // ── LabelLess AI (Uncertainty + Diversity + Rare-Class) ──
  { method: 'labelless', round: 0, budget: 0, total_images: 1000, images_reviewed: 100, mAP50: 0.380, mAP50_95: 0.215, precision: 0.450, recall: 0.370 },
  { method: 'labelless', round: 1, budget: 100, total_images: 1000, images_reviewed: 145, mAP50: 0.560, mAP50_95: 0.342, precision: 0.610, recall: 0.550 },
  { method: 'labelless', round: 2, budget: 200, total_images: 1000, images_reviewed: 190, mAP50: 0.675, mAP50_95: 0.428, precision: 0.715, recall: 0.665 },
  { method: 'labelless', round: 3, budget: 300, total_images: 1000, images_reviewed: 230, mAP50: 0.745, mAP50_95: 0.485, precision: 0.780, recall: 0.740 },
  { method: 'labelless', round: 4, budget: 400, total_images: 1000, images_reviewed: 265, mAP50: 0.782, mAP50_95: 0.515, precision: 0.815, recall: 0.775 },
];

// ─── Final effort summary across all methods ────────────────────────────────
export const EFFORT_SUMMARY: EffortSummary[] = [
  {
    method: 'random',
    final_round: 4,
    total_images: 1000,
    images_reviewed: 500,
    human_review_rate: 0.5,
    human_review_pct: 50.0,
    images_automatically_handled: 500,
    automation_pct: 50.0,
    effort_reduction_vs_baseline_pct: 0.0,
    images_saved_vs_baseline: 0,
    final_mAP50: 0.635,
    mAP50_gain: 0.255,
    mAP_gain_per_100_images: 0.051,
    human_hours_spent: 3.47,
    human_hours_saved_vs_baseline: 0.0,
  },
  {
    method: 'confidence',
    final_round: 4,
    total_images: 1000,
    images_reviewed: 500,
    human_review_rate: 0.5,
    human_review_pct: 50.0,
    images_automatically_handled: 500,
    automation_pct: 50.0,
    effort_reduction_vs_baseline_pct: 0.0,
    images_saved_vs_baseline: 0,
    final_mAP50: 0.735,
    mAP50_gain: 0.355,
    mAP_gain_per_100_images: 0.071,
    human_hours_spent: 3.47,
    human_hours_saved_vs_baseline: 0.0,
  },
  {
    method: 'labelless',
    final_round: 4,
    total_images: 1000,
    images_reviewed: 265,
    human_review_rate: 0.265,
    human_review_pct: 26.5,
    images_automatically_handled: 735,
    automation_pct: 73.5,
    effort_reduction_vs_baseline_pct: 47.0,
    images_saved_vs_baseline: 235,
    final_mAP50: 0.782,
    mAP50_gain: 0.402,
    mAP_gain_per_100_images: 0.1517,
    human_hours_spent: 1.84,
    human_hours_saved_vs_baseline: 1.63,
  },
];

// ─── Helpers to get method-specific data ────────────────────────────────────
export const getMethodMetrics = (method: 'random' | 'confidence' | 'labelless') =>
  COMPARISON_METRICS.filter((m) => m.method === method);

export const getMethodEffort = (method: string) =>
  EFFORT_SUMMARY.find((e) => e.method === method);

export const getLabellessMetrics = () => getMethodMetrics('labelless');
export const getLabellessEffort = () => getMethodEffort('labelless')!;
