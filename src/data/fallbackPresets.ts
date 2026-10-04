import { DatasetItem, ActiveLearningRound, ProjectConfig } from '../types';
import { DEFAULT_PIPELINE_CONFIG } from './pipelineConfig';

export const CLASS_COLORS: Record<string, { border: string; bg: string; text: string; hex: string }> = {
  'Damaged Building': {
    border: 'border-rose-500',
    bg: 'bg-rose-500/20',
    text: 'text-rose-400',
    hex: '#F43F5E',
  },
  'Undamaged Building': {
    border: 'border-emerald-500',
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    hex: '#10B981',
  },
  Fire: {
    border: 'border-amber-500',
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    hex: '#F59E0B',
  },
  Smoke: {
    border: 'border-purple-500',
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    hex: '#A855F7',
  },
};

export const PIPELINE_STREAM_SAMPLES = [
  {
    id: '#5789',
    name: 'Wildfire Plume',
    class: 'Fire',
    conf: 0.99,
    status: 'auto_labeled',
    statusText: 'AUTO-LABELLED',
    reason: 'High confidence (99% > 85%) + Distinct fire signature',
    color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10',
    icon: '✓',
  },
  {
    id: '#09E6',
    name: 'Damaged Structural Complex',
    class: 'Damaged Building',
    conf: 0.73,
    status: 'review_needed',
    statusText: 'SENT TO HUMAN REVIEW',
    reason: 'Low confidence (73%) + Structural entropy',
    color: 'border-rose-500 text-rose-400 bg-rose-500/10',
    icon: '⚠',
  },
  {
    id: '#00F2',
    name: 'Intact Residential Block',
    class: 'Undamaged Building',
    conf: 0.88,
    status: 'auto_labeled',
    statusText: 'AUTO-LABELLED',
    reason: 'High confidence (88%) + Standard geometry',
    color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10',
    icon: '✓',
  },
  {
    id: '#2A78',
    name: 'Dense Chemical Smoke',
    class: 'Smoke',
    conf: 0.51,
    status: 'review_needed',
    statusText: 'SENT TO HUMAN REVIEW',
    reason: 'Rare class (Smoke < 5%) + High entropy boundary',
    color: 'border-rose-500 text-rose-400 bg-rose-500/10',
    icon: '⚠',
  },
  {
    id: '#03DB',
    name: 'Mixed Rubble Field',
    class: 'Damaged Building',
    conf: 0.50,
    status: 'review_needed',
    statusText: 'SENT TO HUMAN REVIEW',
    reason: 'Overlapping bounding box candidates',
    color: 'border-amber-500 text-amber-400 bg-amber-500/10',
    icon: '⚠',
  },
];

export const INITIAL_PROJECT_CONFIG: ProjectConfig = {
  projectName: DEFAULT_PIPELINE_CONFIG.project.name,
  datasetName: DEFAULT_PIPELINE_CONFIG.project.dataset_name,
  modelType: DEFAULT_PIPELINE_CONFIG.project.model_type,
  modelVersion: DEFAULT_PIPELINE_CONFIG.project.model_version,
  strategy: 'balanced',
  confidenceThreshold: DEFAULT_PIPELINE_CONFIG.routing.confidence_threshold,
  uncertaintyWeight: DEFAULT_PIPELINE_CONFIG.ranking.w_uncertainty,
  diversityWeight: DEFAULT_PIPELINE_CONFIG.ranking.w_diversity,
  rareClassWeight: DEFAULT_PIPELINE_CONFIG.ranking.w_rare_class,
  classes: DEFAULT_PIPELINE_CONFIG.classes.map((c) => c.display_name),
  pipelineStatus: 'round_complete',
  currentRound: 1,
};

// Measured rounds, in percent. Round 0 = results/metrics/round_0_seed.json,
// Round 1 = results/metrics/round_1_labelless.json (+100 human labels).
// trainingImages: ~139 seed images (estimated from split ratios), plus 100 labelled in Round 1.
export const ACTIVE_LEARNING_ROUNDS: ActiveLearningRound[] = [
  {
    round: 0,
    name: 'Seed Model (Cold Start)',
    mAP50: 60.9,
    precision: 61.4,
    recall: 61.9,
    f1Score: 61.6,
    autoLabeledCount: 0,
    humanReviewedCount: 0,
    pendingCount: 971,
    humanEffortSavedPct: 0,
    trainingImages: 139,
    status: 'completed',
    classMetrics: [
      { className: 'Undamaged Building', precision: 67.3, recall: 58.3, ap50: 67.2, color: '#10B981' },
      { className: 'Damaged Building', precision: 45.5, recall: 62.1, ap50: 50.6, color: '#F43F5E' },
      { className: 'Fire', precision: 60.3, recall: 55.4, ap50: 53.6, color: '#F59E0B' },
      { className: 'Smoke', precision: 72.4, recall: 71.8, ap50: 72.2, color: '#A855F7' },
    ],
  },
  {
    round: 1,
    name: 'Round 1 (LabelLess, +100 labels)',
    mAP50: 64.8,
    precision: 59.9,
    recall: 68.0,
    f1Score: 63.7,
    autoLabeledCount: 0,
    humanReviewedCount: 100,
    pendingCount: 871,
    humanEffortSavedPct: 0,
    trainingImages: 239,
    status: 'completed',
    classMetrics: [
      { className: 'Undamaged Building', precision: 58.2, recall: 62.6, ap50: 62.4, color: '#10B981' },
      { className: 'Damaged Building', precision: 45.7, recall: 63.1, ap50: 49.1, color: '#F43F5E' },
      { className: 'Fire', precision: 71.9, recall: 69.5, ap50: 69.8, color: '#F59E0B' },
      { className: 'Smoke', precision: 63.8, recall: 76.9, ap50: 77.9, color: '#A855F7' },
    ],
  },
];
