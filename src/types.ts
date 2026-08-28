export type NavigationTab =
  | 'landing'
  | 'dashboard'
  | 'upload'
  | 'processing'
  | 'queue'
  | 'workspace'
  | 'evolution'
  | 'export'
  | 'settings';

export type AnnotationStatus = 'auto_labeled' | 'human_reviewed' | 'pending' | 'rejected';

export type FeedbackCategory =
  | 'wrong_class'
  | 'wrong_box'
  | 'missing_object'
  | 'false_detection'
  | 'other';

export interface BoundingBox {
  id: string;
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  confidence: number; // 0 - 1
  isHumanCorrected?: boolean;
  isNew?: boolean;
}

export interface DatasetItem {
  id: string;
  title: string;
  filename: string;
  imageUrl: string;
  predictedClass: string;
  confidence: number; // e.g. 0.43 = 43%
  uncertaintyScore: number; // 0 - 1
  diversityScore: number; // 0 - 1
  rareClassScore: number; // 0 - 1
  priorityScore: number; // 0 - 1
  priorityLevel: 'critical' | 'high' | 'medium' | 'low';
  reasons: string[];
  explanation: {
    uncertaintyContribution: number;
    diversityContribution: number;
    rareClassContribution: number;
    recommendation: string;
    bulletPoints: string[];
  };
  status: AnnotationStatus;
  boxes: BoundingBox[];
  feedbackCategory?: FeedbackCategory;
  estimatedManualSec: number;
  aiAssistedSec: number;
  createdAtRound: number;
}

export interface ClassMetric {
  className: string;
  precision: number;
  recall: number;
  ap50: number;
  samples: number;
  color: string;
}

export interface ActiveLearningRound {
  round: number;
  name: string;
  mAP50: number;
  precision: number;
  recall: number;
  f1Score: number;
  autoLabeledCount: number;
  humanReviewedCount: number;
  pendingCount: number;
  humanEffortSavedPct: number;
  classMetrics: ClassMetric[];
  trainingImages: number;
  status: 'completed' | 'current' | 'future';
}

export interface ProjectConfig {
  projectName: string;
  datasetName: string;
  modelType: string;
  modelVersion: string;
  strategy: 'conservative' | 'balanced' | 'aggressive';
  confidenceThreshold: number;
  uncertaintyWeight: number;
  diversityWeight: number;
  rareClassWeight: number;
  classes: string[];
  pipelineStatus: 'ready' | 'processing' | 'round_complete';
  currentRound: number;
}
