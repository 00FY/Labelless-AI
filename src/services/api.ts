import { DatasetItem, ProjectConfig } from '../types';

const API_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  'http://localhost:8000';

export interface QueueResponse {
  total: number;
  reviewed_count: number;
  pending_count: number;
  auto_labeled_count: number;
  items: DatasetItem[];
}

export interface LabelSaveResponse {
  success: boolean;
  message: string;
  total_reviewed: number;
}

export interface RoundAdvanceResponse {
  success: boolean;
  round_summary: {
    round: number;
    timestamp: string;
    human_labels_count: number;
    pseudo_labels_count: number;
    total_training_samples: number;
    metrics: {
      mAP50: number;
      mAP50_95: number;
      precision: number;
      recall: number;
      f1: number;
    };
    time_saved_hours: number;
    annotation_effort_saved_percent: number;
  };
  message: string;
}

/**
 * Check if the FastAPI backend is live and healthy.
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch the current ranked active learning queue from FastAPI, with fallback to local JSON.
 */
export async function fetchQueue(): Promise<{ items: DatasetItem[]; isLiveBackend: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/api/queue`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data: QueueResponse = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        return { items: data.items, isLiveBackend: true };
      }
    }
  } catch (err) {
    // API not running, fall back to local public JSON
  }

  // Fallback to static precomputed replay
  const staticRes = await fetch('/ranked_dataset.json');
  if (!staticRes.ok) {
    throw new Error('Failed to load dataset queue from API or static file');
  }
  const items = await staticRes.json();
  return { items, isLiveBackend: false };
}

/**
 * Persist human review / label decision to disk via FastAPI.
 */
export async function submitHumanLabel(
  item: DatasetItem,
  status: 'human_reviewed' | 'pending' | 'auto_labeled' | 'rejected'
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/label`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_id: item.id,
        status,
        boxes: item.boxes || [],
        user: 'expert_reviewer',
        dominant_class: item.predictedClass,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('API unavailable for label persistence, changes kept in memory:', err);
    return false;
  }
}

/**
 * Advance active learning round and trigger pseudo-label consolidation.
 */
export async function advanceRound(roundNumber: number): Promise<RoundAdvanceResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/round/next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ round_number: roundNumber }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API unavailable for round progression:', err);
  }
  return null;
}
