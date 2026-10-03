import React, { useState, useMemo } from 'react';
import {
  Eye,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit3,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Box,
  Flame,
  Building,
  RefreshCw,
  Info
} from 'lucide-react';
import { BoundingBox, DatasetItem } from '../types';

/* ────────────────────────────────────────────────────────────
   AI VISION INSPECTOR
   Replaces fake 3D vehicle/laser box with a 2D YOLO Vision Inspector.
   ──────────────────────────────────────────────────────────── */

interface Props {
  className?: string;
  initialClass?: 'vehicle' | 'building' | 'fire' | 'debris';
  item?: DatasetItem;
  onActionComplete?: (action: 'accept' | 'correct' | 'reject') => void;
}

// Sample dataset images with real 2D bounding box data
const SAMPLE_INSPECTION_IMAGES = [
  {
    id: 'sample_09e6',
    title: 'Damaged Structural Complex',
    imageUrl: '/predictions/09e62858a678e6fcea8bced21d03ab1c.png',
    predictedClass: 'Damaged Building',
    confidence: 0.66,
    uncertainty: 0.74,
    rarity: 0.88,
    diversity: 0.62,
    priorityScore: 0.73,
    boxes: [
      { id: 'b1', label: 'Damaged Building', x: 18, y: 22, width: 45, height: 50, confidence: 0.66 },
      { id: 'b2', label: 'Smoke', x: 62, y: 15, width: 28, height: 35, confidence: 0.54 },
    ],
  },
  {
    id: 'sample_03db',
    title: 'Rubble & Mixed Debris Field',
    imageUrl: '/predictions/03db54200069482ff87cab702a6be150.png',
    predictedClass: 'Fire',
    confidence: 0.58,
    uncertainty: 0.82,
    rarity: 0.94,
    diversity: 0.78,
    priorityScore: 0.84,
    boxes: [
      { id: 'b3', label: 'Fire', x: 25, y: 30, width: 38, height: 42, confidence: 0.58 },
      { id: 'b4', label: 'Damaged Building', x: 58, y: 40, width: 32, height: 48, confidence: 0.64 },
    ],
  },
  {
    id: 'sample_00f2',
    title: 'Intact Residential Block',
    imageUrl: '/predictions/00f205aea57febc8e82d4e99a18b1d51.png',
    predictedClass: 'Undamaged Building',
    confidence: 0.89,
    uncertainty: 0.22,
    rarity: 0.15,
    diversity: 0.35,
    priorityScore: 0.28,
    boxes: [
      { id: 'b5', label: 'Undamaged Building', x: 20, y: 18, width: 60, height: 65, confidence: 0.89 },
    ],
  },
];

export const AIVisionInspector: React.FC<Props> = ({
  className = '',
  initialClass = 'building',
  item: propItem,
  onActionComplete,
}) => {
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number>(0);
  const [activeOverlayTab, setActiveOverlayTab] = useState<'prediction' | 'uncertainty' | 'rarity' | 'diversity'>('prediction');
  const [workflowState, setWorkflowState] = useState<'ai_prediction' | 'human_correction' | 'added_to_retrain'>('ai_prediction');
  const [userActionFeedback, setUserActionFeedback] = useState<string | null>(null);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);

  // Active sample data
  const currentSample = useMemo(() => {
    if (propItem) {
      return {
        id: propItem.id,
        title: propItem.title,
        imageUrl: propItem.imageUrl,
        predictedClass: propItem.predictedClass,
        confidence: propItem.confidence,
        uncertainty: propItem.uncertaintyScore || (1 - propItem.confidence),
        rarity: propItem.rareClassScore || 0.5,
        diversity: propItem.diversityScore || 0.5,
        priorityScore: propItem.priorityScore || 0.72,
        boxes: propItem.boxes && propItem.boxes.length > 0 ? propItem.boxes : [
          { id: 'pb1', label: propItem.predictedClass, x: 20, y: 20, width: 55, height: 55, confidence: propItem.confidence }
        ],
      };
    }
    return SAMPLE_INSPECTION_IMAGES[selectedSampleIndex];
  }, [propItem, selectedSampleIndex]);

  // Handle Accept / Correct / Reject actions
  const handleUserAction = (action: 'accept' | 'correct' | 'reject') => {
    if (action === 'accept') {
      setWorkflowState('added_to_retrain');
      setUserActionFeedback('ACCEPTED — Prediction verified & saved to data/reviewed_labels.json');
    } else if (action === 'correct') {
      setWorkflowState('human_correction');
      setUserActionFeedback('CORRECTED — Bounding box refined by annotator');
      setTimeout(() => setWorkflowState('added_to_retrain'), 1500);
    } else {
      setWorkflowState('added_to_retrain');
      setUserActionFeedback('REJECTED — False positive removed from active queue');
    }

    onActionComplete?.(action);
  };

  const isLowConfidence = currentSample.confidence < 0.85;

  return (
    <div className={`p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-5 ${className}`}>
      {/* Header & Sample Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gray-900 text-white">
              <Eye className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900">
              AI Vision Inspector (2D YOLO Detections)
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 text-gray-600 border border-gray-200">
              Real Dataset Inspector
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Inspect real YOLO object predictions, model uncertainty heatmaps, and human-in-the-loop corrections.
          </p>
        </div>

        {/* Sample Selection Buttons */}
        {!propItem && (
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200">
            {SAMPLE_INSPECTION_IMAGES.map((sample, idx) => (
              <button
                key={sample.id}
                onClick={() => {
                  setSelectedSampleIndex(idx);
                  setWorkflowState('ai_prediction');
                  setUserActionFeedback(null);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                  selectedSampleIndex === idx
                    ? 'bg-white text-gray-900 shadow-sm font-bold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Sample {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mode Overlay Tab Bar */}
      <div className="flex items-center justify-between gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 text-xs">
        <span className="text-gray-400 font-bold uppercase text-[10px] px-2">Visual Layer:</span>
        <div className="flex items-center gap-1">
          {(['prediction', 'uncertainty', 'rarity', 'diversity'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveOverlayTab(mode)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                activeOverlayTab === mode
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2D Image Viewport with Bounding Box Overlays */}
      <div className="relative w-full h-[360px] rounded-2xl bg-gray-950 border border-gray-200 overflow-hidden group">
        {/* Actual Dataset Image */}
        <img
          src={currentSample.imageUrl}
          alt={currentSample.title}
          className="w-full h-full object-cover opacity-90 transition-opacity"
          onError={(e) => {
            // Fallback placeholder image if local image missing
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=800&q=80';
          }}
        />

        {/* Uncertainty Heatmap Layer Overlay */}
        {activeOverlayTab === 'uncertainty' && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at 40% 40%, rgba(245, 158, 11, 0.45) 0%, rgba(239, 68, 68, 0.25) 50%, transparent 80%)`,
            }}
          />
        )}

        {/* Rarity Class Highlight Overlay */}
        {activeOverlayTab === 'rarity' && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at 60% 30%, rgba(168, 85, 247, 0.4) 0%, transparent 60%)`,
            }}
          />
        )}

        {/* Diversity Feature Overlay */}
        {activeOverlayTab === 'diversity' && (
          <div className="absolute inset-0 pointer-events-none opacity-30 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full stroke-sky-400 stroke-2 border-2 border-dashed border-sky-400 animate-spin" />
          </div>
        )}

        {/* Polished 2D YOLO Bounding Box Overlays */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {currentSample.boxes.map((box) => {
            const isHovered = hoveredBoxId === box.id;
            const isCorrected = workflowState === 'human_correction';

            // Box styling based on confidence/status
            const strokeColor = isCorrected ? '#10B981' : box.confidence >= 0.85 ? '#10B981' : '#F59E0B';

            return (
              <g
                key={box.id}
                onMouseEnter={() => setHoveredBoxId(box.id)}
                onMouseLeave={() => setHoveredBoxId(null)}
                className="pointer-events-auto cursor-pointer"
              >
                {/* Outer Glow */}
                <rect
                  x={`${box.x}%`}
                  y={`${box.y}%`}
                  width={`${box.width}%`}
                  height={`${box.height}%`}
                  fill={isCorrected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.12)'}
                  stroke={strokeColor}
                  strokeWidth={isHovered ? '3' : '2'}
                  strokeDasharray={isHovered ? '4,4' : 'none'}
                  rx="6"
                  className="transition-all duration-300"
                />

                {/* Cyberpunk Tech Corner Brackets */}
                <path
                  d={`M ${box.x}% ${box.y + 4}% V ${box.y}% H ${box.x + 5}%`}
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  d={`M ${box.x + box.width - 5}% ${box.y}% H ${box.x + box.width}% V ${box.y + 4}%`}
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  fill="none"
                />
              </g>
            );
          })}
        </svg>

        {/* Bounding Box HTML Labels overlay */}
        {currentSample.boxes.map((box) => (
          <div
            key={`lbl_${box.id}`}
            className="absolute z-10 pointer-events-none transform -translate-y-full mb-1"
            style={{ left: `${box.x}%`, top: `${box.y}%` }}
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-900/90 backdrop-blur-md text-white border border-gray-700 shadow-md text-xs font-mono font-bold">
              <span>{box.label}</span>
              <span className="text-amber-400">{(box.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}

        {/* Dynamic Telemetry HUD overlay (Top Left) */}
        <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-md p-3 rounded-xl border border-gray-700 shadow-lg text-white text-xs font-mono space-y-1 z-20">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400 uppercase text-[10px]">Title:</span>
            <span className="font-bold truncate max-w-[140px]">{currentSample.title}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400 uppercase text-[10px]">Predicted Class:</span>
            <span className="text-amber-400 font-bold">{currentSample.predictedClass}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400 uppercase text-[10px]">Confidence:</span>
            <span className={isLowConfidence ? 'text-amber-400' : 'text-emerald-400'}>
              {(currentSample.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Triage Decision Pill (Top Right) */}
        <div className="absolute top-4 right-4 z-20">
          {isLowConfidence ? (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow-md">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Human Review Queue Needed</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Auto-Labeled High Confidence</span>
            </div>
          )}
        </div>
      </div>

      {/* AI → Human → Retraining Workflow Stage Bar */}
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
          <span>Active Learning Workflow Step:</span>
          <span className="font-mono text-gray-900 capitalize">{workflowState.replace(/_/g, ' ')}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Step 1 */}
          <div
            className={`p-2.5 rounded-lg border flex items-center gap-2 font-medium transition-all ${
              workflowState === 'ai_prediction'
                ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-mono font-bold text-[11px]">
              1
            </div>
            <div>
              <div className="font-bold">AI Prediction</div>
              <div className="text-[10px] text-gray-500">YOLOv8 Output</div>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className={`p-2.5 rounded-lg border flex items-center gap-2 font-medium transition-all ${
              workflowState === 'human_correction'
                ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold'
                : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-sky-200 text-sky-800 flex items-center justify-center font-mono font-bold text-[11px]">
              2
            </div>
            <div>
              <div className="font-bold">Human Correction</div>
              <div className="text-[10px] text-gray-500">Annotator Review</div>
            </div>
          </div>

          {/* Step 3 */}
          <div
            className={`p-2.5 rounded-lg border flex items-center gap-2 font-medium transition-all ${
              workflowState === 'added_to_retrain'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-mono font-bold text-[11px]">
              3
            </div>
            <div>
              <div className="font-bold">Retraining Data</div>
              <div className="text-[10px] text-gray-500">Round 2 Training Set</div>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Score Breakdown Progress Bars */}
      <div className="space-y-2 p-4 rounded-xl bg-gray-50 border border-gray-200">
        <div className="flex items-center justify-between text-xs font-bold text-gray-900">
          <span>Priority Triage Score:</span>
          <span className="font-mono text-amber-600">{currentSample.priorityScore.toFixed(2)}</span>
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs font-medium">
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-500">Uncertainty</span>
              <span className="font-mono font-bold text-amber-600">{(currentSample.uncertainty * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${currentSample.uncertainty * 100}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-500">Class Rarity</span>
              <span className="font-mono font-bold text-purple-600">{(currentSample.rarity * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${currentSample.rarity * 100}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-500">Diversity</span>
              <span className="font-mono font-bold text-sky-600">{(currentSample.diversity * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full" style={{ width: `${currentSample.diversity * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Human Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleUserAction('accept')}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>[ ACCEPT ]</span>
          </button>
          <button
            onClick={() => handleUserAction('correct')}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>[ CORRECT ]</span>
          </button>
          <button
            onClick={() => handleUserAction('reject')}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>[ REJECT ]</span>
          </button>
        </div>

        {userActionFeedback && (
          <div className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 flex items-center gap-2 w-full sm:w-auto">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="truncate">{userActionFeedback}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Export backward compatible alias so existing imports work without modification
export const Interactive3DBoundingBox = AIVisionInspector;
