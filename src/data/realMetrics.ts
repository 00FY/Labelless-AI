/**
 * Verified ML Experiment Data from results/metrics/round_0_seed.json
 *
 * Dataset: Multi-disaster satellite & wildfire aerial imagery (971 pool images)
 * Model: YOLOv8 fine-tuned on seed data
 * Classes: undamagedbuilding, damagedbuilding, fire, smoke
 */

import { ComparisonMetric, EffortSummary } from '../types';

// ─── Verified Measured Metrics (Round 0 Seed Baseline) ──────────────────────
// Grounded strictly in results/metrics/round_0_seed.json (60.89% mAP50)
export const COMPARISON_METRICS: ComparisonMetric[] = [
  {
    method: 'random',
    round: 0,
    budget: 0,
    total_images: 971,
    images_reviewed: 0,
    mAP50: 0.6089,
    mAP50_95: 0.3588,
    precision: 0.6138,
    recall: 0.6190,
  },
  {
    method: 'confidence',
    round: 0,
    budget: 0,
    total_images: 971,
    images_reviewed: 0,
    mAP50: 0.6089,
    mAP50_95: 0.3588,
    precision: 0.6138,
    recall: 0.6190,
  },
  {
    method: 'labelless',
    round: 0,
    budget: 0,
    total_images: 971,
    images_reviewed: 0,
    mAP50: 0.6089,
    mAP50_95: 0.3588,
    precision: 0.6138,
    recall: 0.6190,
  },
];

// ─── Measured Baseline Summary ──────────────────────────────────────────────
export const EFFORT_SUMMARY: EffortSummary[] = [
  {
    method: 'labelless',
    final_round: 0,
    total_images: 971,
    images_reviewed: 0,
    human_review_rate: 0.0,
    human_review_pct: 0.0,
    images_automatically_handled: 0,
    automation_pct: 0.0,
    effort_reduction_vs_baseline_pct: 0.0,
    images_saved_vs_baseline: 0,
    final_mAP50: 0.6089,
    mAP50_gain: 0.0,
    mAP_gain_per_100_images: 0.0,
    human_hours_spent: 0.0,
    human_hours_saved_vs_baseline: 0.0,
  },
];

export const getMethodMetrics = (method: 'random' | 'confidence' | 'labelless') =>
  COMPARISON_METRICS.filter((m) => m.method === method);

export const getMethodEffort = (method: string) =>
  EFFORT_SUMMARY.find((e) => e.method === method) || EFFORT_SUMMARY[0];

export const getLabellessMetrics = () => getMethodMetrics('labelless');
export const getLabellessEffort = () => getMethodEffort('labelless');
