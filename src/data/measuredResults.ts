/**
 * Single source of truth for every headline number shown in the UI.
 *
 * Accuracy values are copied from public/experiment_results.json, which
 * scripts/export_experiment_results.py builds from results/metrics/*.json.
 * Routing counts are computed from the loaded queue (getPoolRouting).
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

export interface PoolRouting {
  poolImages: number;
  autoLabeled: number;
  sentToHuman: number;
  autoFraction: number;
  humanFraction: number;
}

/**
 * How the loaded pool was routed by the priority threshold (0.58). Counted from the
 * queue actually loaded, because run_pipeline.py regenerates it on every start_dev launch.
 * Anything not auto-labelled went (or is going) to a human.
 */
export function getPoolRouting(items: { status: string }[]): PoolRouting {
  const poolImages = items.length;
  const autoLabeled = items.filter((i) => i.status === 'auto_labeled').length;
  const sentToHuman = poolImages - autoLabeled;
  return {
    poolImages,
    autoLabeled,
    sentToHuman,
    autoFraction: poolImages ? autoLabeled / poolImages : 0,
    humanFraction: poolImages ? sentToHuman / poolImages : 0,
  };
}

export const pct = (fraction: number, digits = 1) => `${(fraction * 100).toFixed(digits)}%`;

/** Percentage-point difference between two fractions, e.g. "+3.9 pts". */
export const pts = (to: number, from: number, digits = 1) => {
  const d = (to - from) * 100;
  return `${d >= 0 ? '+' : ''}${d.toFixed(digits)} pts`;
};
