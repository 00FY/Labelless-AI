import { DatasetItem, AnnotationStatus, BoundingBox } from '../types';

export interface RankingWeights {
  w_uncertainty: number;
  w_rare_class: number;
  w_diversity: number;
}

export const DEFAULT_WEIGHTS: RankingWeights = {
  w_uncertainty: 0.7,
  w_rare_class: 0.2,
  w_diversity: 0.1,
};

/**
 * Calculates priority score from uncertainty, rarity, and diversity scores.
 * Priority = 0.7 * Uncertainty + 0.2 * Rarity + 0.1 * Diversity
 */
export function calculatePriorityScore(
  uncertainty: number,
  rarity: number,
  diversity: number,
  weights: RankingWeights = DEFAULT_WEIGHTS
): number {
  const raw = weights.w_uncertainty * uncertainty + weights.w_rare_class * rarity + weights.w_diversity * diversity;
  return Math.round(raw * 10000) / 10000;
}

/**
 * Verifies if an item's priority score matches the expected formula score within tolerance.
 */
export function verifyPriorityIntegrity(
  item: { uncertaintyScore: number; rareClassScore: number; diversityScore: number; priorityScore: number },
  tolerance = 0.001,
  weights = DEFAULT_WEIGHTS
): boolean {
  const expected = calculatePriorityScore(item.uncertaintyScore, item.rareClassScore, item.diversityScore, weights);
  return Math.abs(expected - item.priorityScore) <= tolerance;
}

/**
 * Pure queue update function (handles Accept, Correct, Reject actions).
 * Updates item status and boxes, removing or re-flagging item in the active review queue.
 */
export function applyQueueUpdate(
  items: DatasetItem[],
  targetId: string,
  action: 'accept' | 'correct' | 'reject',
  updatedBoxes?: BoundingBox[]
): DatasetItem[] {
  return items.map((item) => {
    if (item.id !== targetId) return item;

    let newStatus: AnnotationStatus = 'human_reviewed';
    if (action === 'reject') {
      newStatus = 'rejected';
    }

    const boxes = updatedBoxes || item.boxes;

    return {
      ...item,
      status: newStatus,
      boxes,
    };
  });
}

/**
 * Filters dataset items by status, priority level, and search term.
 */
export function filterQueue(
  items: DatasetItem[],
  statusFilter: 'all' | AnnotationStatus = 'all',
  priorityFilter: 'all' | 'critical' | 'high' | 'medium' | 'low' = 'all',
  searchQuery = ''
): DatasetItem[] {
  return items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && item.priorityLevel !== priorityFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchClass = item.predictedClass.toLowerCase().includes(q);
      const matchId = item.id.toLowerCase().includes(q);
      if (!matchTitle && !matchClass && !matchId) return false;
    }
    return true;
  });
}

/**
 * Sorts dataset items by priority, confidence, or uncertainty.
 */
export function sortQueue(
  items: DatasetItem[],
  sortBy: 'priority' | 'confidence' | 'uncertainty' = 'priority'
): DatasetItem[] {
  return [...items].sort((a, b) => {
    if (sortBy === 'priority') {
      return b.priorityScore - a.priorityScore;
    } else if (sortBy === 'confidence') {
      return a.confidence - b.confidence; // ascending confidence (lowest confidence first)
    } else {
      return b.uncertaintyScore - a.uncertaintyScore;
    }
  });
}
