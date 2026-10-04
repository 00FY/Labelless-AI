/**
 * Single source of truth for every headline number shown in the UI.
 *
 * Accuracy values are copied from public/experiment_results.json, which
 * scripts/export_experiment_results.py builds from results/metrics/*.json.
 * Routing counts come from public/ranked_dataset.json.
 * tests/queue_and_integrity.test.ts fails if these drift from those files.
 *
 * Do not add projected or simulated numbers here.
 */

export interface MeasuredRun {
  method: 'seed' | 'random' | 'confidence' | 'labelless';
  label: string;
  round: number;
  labelsAdded: number;
  mAP50: number;
  fireAP50: number;
  sourceFile: string;
}

// Round 1 comparison at an equal budget of 100 human-labelled images.
export const MEASURED_RUNS: MeasuredRun[] = [
  { method: 'seed', label: 'Seed (Round 0)', round: 0, labelsAdded: 0, mAP50: 0.6089, fireAP50: 0.536, sourceFile: 'round_0_seed.json' },
  { method: 'confidence', label: 'Confidence only', round: 1, labelsAdded: 100, mAP50: 0.6199, fireAP50: 0.6101, sourceFile: 'round_1_confidence.json' },
  { method: 'random', label: 'Random', round: 1, labelsAdded: 100, mAP50: 0.6424, fireAP50: 0.6177, sourceFile: 'round_1_random.json' },
  { method: 'labelless', label: 'LabelLess', round: 1, labelsAdded: 100, mAP50: 0.648, fireAP50: 0.6981, sourceFile: 'round_1_labelless.json' },
];

export const getRun = (method: MeasuredRun['method']): MeasuredRun =>
  MEASURED_RUNS.find((r) => r.method === method)!;

// Routing of the 971-image unlabelled pool by the priority threshold (0.58).
export const POOL_ROUTING = {
  poolImages: 971,
  autoLabeled: 716,
  sentToHuman: 255,
};

export const pct = (fraction: number, digits = 1) => `${(fraction * 100).toFixed(digits)}%`;

/** Percentage-point difference between two fractions, e.g. "+3.9 pts". */
export const pts = (to: number, from: number, digits = 1) => {
  const d = (to - from) * 100;
  return `${d >= 0 ? '+' : ''}${d.toFixed(digits)} pts`;
};

export const AUTO_ROUTED_FRACTION = POOL_ROUTING.autoLabeled / POOL_ROUTING.poolImages;
export const HUMAN_ROUTED_FRACTION = POOL_ROUTING.sentToHuman / POOL_ROUTING.poolImages;
