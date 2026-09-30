/**
 * src/data/pipelineConfig.ts
 *
 * Loads pipeline_config.json (exported from config.yaml by export_config_for_ui.py).
 * This is the SINGLE SOURCE OF TRUTH for weights, thresholds, and class info
 * in the frontend.  No component should hardcode these values.
 *
 * The config is loaded synchronously from the static JSON at build time
 * via a fetch-once pattern.  Components that need it should import
 * `usePipelineConfig()` or read the synchronous `PIPELINE_CONFIG` default.
 */

// ── Types matching the exported JSON shape ─────────────────────────────────

export interface PipelineClassInfo {
  id: number;
  yolo_name: string;
  display_name: string;
  color_hex: string;
  tailwind_key: string;
}

export interface PipelineRanking {
  w_uncertainty: number;
  w_rare_class: number;
  w_diversity: number;
  uncertainty_blend_avg: number;
  diversity_scores: Record<string, number>;
  diversity_box_thresholds: Record<string, number>;
}

export interface PipelineRouting {
  confidence_threshold: number;
  auto_label_priority_max: number;
  priority_levels: {
    critical: number;
    high: number;
    medium: number;
  };
}

export interface PipelineConfig {
  project: {
    name: string;
    dataset_name: string;
    model_type: string;
    model_version: string;
  };
  classes: PipelineClassInfo[];
  ranking: PipelineRanking;
  routing: PipelineRouting;
  training: {
    base_model: string;
    image_size: number;
  };
  dataset: {
    total_pool_fallback: number;
  };
}

// ── Compile-time default (embedded from the JSON) ──────────────────────────
// This is the fallback used before the fetch resolves.
// It MUST match public/pipeline_config.json — run export_config_for_ui.py
// to regenerate it.

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  project: {
    name: 'DisasterVision YOLOv8',
    dataset_name: 'Multi-Disaster Active Learning Dataset',
    model_type: 'YOLOv8',
    model_version: 'v2.3 Fine-Tuned',
  },
  classes: [
    { id: 0, yolo_name: 'undamagedbuilding', display_name: 'Undamaged Building', color_hex: '#10B981', tailwind_key: 'emerald' },
    { id: 1, yolo_name: 'damagedbuilding', display_name: 'Damaged Building', color_hex: '#F43F5E', tailwind_key: 'rose' },
    { id: 2, yolo_name: 'fire', display_name: 'Fire', color_hex: '#F59E0B', tailwind_key: 'amber' },
    { id: 3, yolo_name: 'smoke', display_name: 'Smoke', color_hex: '#A855F7', tailwind_key: 'purple' },
  ],
  ranking: {
    w_uncertainty: 0.7,
    w_rare_class: 0.2,
    w_diversity: 0.1,
    uncertainty_blend_avg: 0.6,
    diversity_scores: { many: 0.85, moderate: 0.65, none: 0.5, few: 0.35 },
    diversity_box_thresholds: { many: 4, moderate: 2 },
  },
  routing: {
    confidence_threshold: 0.85,
    auto_label_priority_max: 0.58,
    priority_levels: { critical: 0.7, high: 0.58, medium: 0.4 },
  },
  training: {
    base_model: 'yolov8n.pt',
    image_size: 640,
  },
  dataset: {
    total_pool_fallback: 971,
  },
};

// ── Runtime loader ─────────────────────────────────────────────────────────
// Fetches the live JSON so a re-export doesn't require a rebuild.

let _loadedConfig: PipelineConfig | null = null;

export async function loadPipelineConfig(): Promise<PipelineConfig> {
  if (_loadedConfig) return _loadedConfig;
  try {
    const res = await fetch('/pipeline_config.json');
    if (res.ok) {
      _loadedConfig = (await res.json()) as PipelineConfig;
      return _loadedConfig;
    }
  } catch {
    // fallback
  }
  _loadedConfig = DEFAULT_PIPELINE_CONFIG;
  return _loadedConfig;
}

export function getPipelineConfig(): PipelineConfig {
  return _loadedConfig ?? DEFAULT_PIPELINE_CONFIG;
}

/**
 * Helper: build the formula string from the current config weights.
 * e.g. "Priority = (0.7 × Unc) + (0.2 × Rarity) + (0.1 × Div)"
 */
export function getFormulaString(cfg?: PipelineConfig): string {
  const c = cfg ?? getPipelineConfig();
  const r = c.ranking;
  return `Priority = (${r.w_uncertainty} × Unc) + (${r.w_rare_class} × Rarity) + (${r.w_diversity} × Div)`;
}
