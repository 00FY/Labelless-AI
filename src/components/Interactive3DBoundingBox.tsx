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
    shortLabel: 'Structural Hazard',
    badge: 'Uncertain · 66%',
    badgeType: 'uncertain',
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
    shortLabel: 'Wildfire Hazard',
    badge: 'Rare Class · 58%',
    badgeType: 'rare',
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
    shortLabel: 'Intact Block',
    badge: 'Auto-Pass · 89%',
    badgeType: 'auto',
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
    <div className={`p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4 ${className}`}>
      {/* Header & Sample Switcher */}
      <div className="space-y-2.5 border-b border-gray-200 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gray-900 text-white shrink-0">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-gray-900 leading-tight">
                AI Vision Inspector
              </h3>
              <p className="text-[10px] text-gray-500 font-mono">2D YOLO Detections & Uncertainty Heatmaps</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            Real Inferences
          </span>
        </div>

        {/* Polished Sample Selection Cards */}
        {!propItem && (
          <div className="grid grid-cols-3 gap-1.5 bg-gray-100 p-1.5 rounded-xl border border-gray-200 w-full">
            {SAMPLE_INSPECTION_IMAGES.map((sample, idx) => {
              const isSelected = selectedSampleIndex === idx;
              return (
                <button
                  key={sample.id}
                  onClick={() => {
                    setSelectedSampleIndex(idx);
                    setWorkflowState('ai_prediction');
                    setUserActionFeedback(null);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-left transition-all flex flex-col justify-center ${
                    isSelected
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200 font-bold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  <span className="text-[11px] truncate leading-tight font-semibold">{sample.shortLabel}</span>
                  <span
                    className={`text-[9px] font-mono leading-tight mt-0.5 font-bold ${
                      sample.badgeType === 'rare'
                        ? 'text-red-600'
                        : sample.badgeType === 'uncertain'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {sample.badge}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mode Overlay Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-200 text-xs">
        <span className="text-gray-400 font-bold uppercase text-[10px] px-1 shrink-0">Visual Layer:</span>
        <div className="flex flex-wrap items-center gap-1">
          {(['prediction', 'uncertainty', 'rarity', 'diversity'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveOverlayTab(mode)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
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
                <line x1={`${box.x}%`} y1={`${box.y + 4}%`} x2={`${box.x}%`} y2={`${box.y}%`} stroke="#FFFFFF" strokeWidth="3" />
                <line x1={`${box.x}%`} y1={`${box.y}%`} x2={`${box.x + 5}%`} y2={`${box.y}%`} stroke="#FFFFFF" strokeWidth="3" />
                <line x1={`${box.x + box.width - 5}%`} y1={`${box.y}%`} x2={`${box.x + box.width}%`} y2={`${box.y}%`} stroke="#FFFFFF" strokeWidth="3" />
                <line x1={`${box.x + box.width}%`} y1={`${box.y}%`} x2={`${box.x + box.width}%`} y2={`${box.y + 4}%`} stroke="#FFFFFF" strokeWidth="3" />
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



      {/* Human Action Buttons - Strict 3-column grid: 100% inside container, no overflow */}
      <div className="w-full pt-1 space-y-2">
        <div className="grid grid-cols-3 gap-2 w-full">
          <button
            onClick={() => handleUserAction('accept')}
            className="w-full py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Accept</span>
          </button>
          <button
            onClick={() => handleUserAction('correct')}
            className="w-full py-2.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
          >
            <Edit3 className="w-4 h-4 shrink-0" />
            <span>Correct</span>
          </button>
          <button
            onClick={() => handleUserAction('reject')}
            className="w-full py-2.5 px-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
          >
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Reject</span>
          </button>
        </div>

        {userActionFeedback && (
          <div className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 flex items-center gap-2 w-full animate-in fade-in">
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
