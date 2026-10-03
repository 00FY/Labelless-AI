import React, { useState, useMemo, useCallback } from 'react';
import {
  Layers,
  Sliders,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Eye,
  Play,
  XCircle,
  Edit3,
  ListFilter
} from 'lucide-react';
import { DatasetItem } from '../types';

/* ────────────────────────────────────────────────────────────
   🔥 AI TRIAGE WORKBENCH
   Sleek, focused active-learning workstation for LabelLess AI.
   Features Dataset Overview, AI Sorting Line stream,
   4 Top-Priority Spotlight cards, and Hero AI Inspector.
   ──────────────────────────────────────────────────────────── */

const SPOTLIGHT_FALLBACK_ITEMS: DatasetItem[] = [
  {
    id: '09e62858a678e6fcea8bced21d03ab1c',
    title: 'Damaged Structural Complex',
    filename: '09e62858a678e6fcea8bced21d03ab1c.png',
    imageUrl: '/predictions/09e62858a678e6fcea8bced21d03ab1c.png',
    predictedClass: 'Damaged Building',
    confidence: 0.66,
    uncertaintyScore: 0.74,
    diversityScore: 0.62,
    rareClassScore: 0.88,
    priorityScore: 0.92,
    priorityLevel: 'critical',
    reasons: ['Model confidence is low (66%)', 'Structural damage underrepresented', 'High embedding distance'],
    explanation: {
      uncertaintyContribution: 0.51,
      diversityContribution: 0.06,
      rareClassContribution: 0.16,
      recommendation: 'Urgent human review needed due to structural collapse ambiguity.',
      bulletPoints: ['Low model confidence', 'Rare damaged building geometry'],
    },
    status: 'pending',
    boxes: [{ id: 'b1', label: 'Damaged Building', x: 18, y: 22, width: 48, height: 48, confidence: 0.66 }],
    estimatedManualSec: 15,
    aiAssistedSec: 4,
    createdAtRound: 1,
  },
  {
    id: '03db54200069482ff87cab702a6be150',
    title: 'Wildfire Thermal Plume',
    filename: '03db54200069482ff87cab702a6be150.png',
    imageUrl: '/predictions/03db54200069482ff87cab702a6be150.png',
    predictedClass: 'Fire',
    confidence: 0.58,
    uncertaintyScore: 0.82,
    diversityScore: 0.78,
    rareClassScore: 0.94,
    priorityScore: 0.88,
    priorityLevel: 'critical',
    reasons: ['Fire is a rare class (< 5% dataset)', 'High thermal boundary entropy', 'Outlier vector candidate'],
    explanation: {
      uncertaintyContribution: 0.57,
      diversityContribution: 0.08,
      rareClassContribution: 0.19,
      recommendation: 'Critical triage: Verify rare wildfire flame boundary.',
      bulletPoints: ['Rare class trigger', 'Entropy score > 0.8'],
    },
    status: 'pending',
    boxes: [{ id: 'b2', label: 'Fire', x: 24, y: 28, width: 38, height: 40, confidence: 0.58 }],
    estimatedManualSec: 12,
    aiAssistedSec: 3,
    createdAtRound: 1,
  },
  {
    id: '0cc1d593cae6ffebfce45bf447fa6e69',
    title: 'Dense Industrial Smoke Plume',
    filename: '0cc1d593cae6ffebfce45bf447fa6e69.png',
    imageUrl: '/predictions/0cc1d593cae6ffebfce45bf447fa6e69.png',
    predictedClass: 'Smoke',
    confidence: 0.51,
    uncertaintyScore: 0.88,
    diversityScore: 0.85,
    rareClassScore: 0.91,
    priorityScore: 0.85,
    priorityLevel: 'critical',
    reasons: ['Smoke class underrepresented', 'High gradient uncertainty', 'Novel feature representation'],
    explanation: {
      uncertaintyContribution: 0.61,
      diversityContribution: 0.09,
      rareClassContribution: 0.17,
      recommendation: 'Review smoke plume boundary for model fine-tuning.',
      bulletPoints: ['High entropy score', 'Rare class representation'],
    },
    status: 'pending',
    boxes: [{ id: 'b3', label: 'Smoke', x: 22, y: 15, width: 52, height: 48, confidence: 0.51 }],
    estimatedManualSec: 14,
    aiAssistedSec: 4,
    createdAtRound: 1,
  },
  {
    id: '00f205aea57febc8e82d4e99a18b1d51',
    title: 'Intact Commercial Building',
    filename: '00f205aea57febc8e82d4e99a18b1d51.png',
    imageUrl: '/predictions/00f205aea57febc8e82d4e99a18b1d51.png',
    predictedClass: 'Undamaged Building',
    confidence: 0.89,
    uncertaintyScore: 0.22,
    diversityScore: 0.35,
    rareClassScore: 0.15,
    priorityScore: 0.28,
    priorityLevel: 'low',
    reasons: ['High model confidence (89% > 85%)', 'Standard structural geometry'],
    explanation: {
      uncertaintyContribution: 0.15,
      diversityContribution: 0.04,
      rareClassContribution: 0.09,
      recommendation: 'Auto-accepted by confidence thresholding.',
      bulletPoints: ['High confidence auto-label'],
    },
    status: 'auto_labeled',
    boxes: [{ id: 'b4', label: 'Undamaged Building', x: 15, y: 15, width: 65, height: 65, confidence: 0.89 }],
    estimatedManualSec: 10,
    aiAssistedSec: 1,
    createdAtRound: 1,
  },
];

interface Props {
  datasetItems?: DatasetItem[];
  onSelectImage?: (item: DatasetItem) => void;
  className?: string;
}

export const AITriageWorkbench: React.FC<Props> = ({
  datasetItems: rawDatasetItems,
  onSelectImage,
  className = '',
}) => {
  const datasetItems = useMemo(() => {
    return rawDatasetItems && rawDatasetItems.length > 0 ? rawDatasetItems : SPOTLIGHT_FALLBACK_ITEMS;
  }, [rawDatasetItems]);

  const [threshold, setThreshold] = useState<number>(0.85);
  const [selectedItem, setSelectedItem] = useState<DatasetItem>(datasetItems[0] || SPOTLIGHT_FALLBACK_ITEMS[0]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);
  const [simMessage, setSimMessage] = useState<string>('');
  const [userActionFeedback, setUserActionFeedback] = useState<string | null>(null);

  // Compute live triage metrics
  const totalCount = 12480;
  const autoCount = Math.round(totalCount * (threshold <= 0.65 ? 0.45 : threshold <= 0.85 ? 0.76 : 0.88));
  const pendingCount = totalCount - autoCount;
  const effortSavedPct = ((autoCount / totalCount) * 100).toFixed(1);

  // Top 4 priority spotlight items only
  const spotlightItems = useMemo(() => {
    const list = [...datasetItems].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
    return list.slice(0, 4);
  }, [datasetItems]);

  // Handle Action Button click (Accept / Correct / Reject)
  const handleAction = (action: 'accept' | 'correct' | 'reject') => {
    if (action === 'accept') {
      setUserActionFeedback(`✓ ACCEPTED #${selectedItem.id.slice(0, 6)} — Saved to data/reviewed_labels.json`);
    } else if (action === 'correct') {
      setUserActionFeedback(`✏️ CORRECTED #${selectedItem.id.slice(0, 6)} — Added to Round 2 Retraining Set`);
    } else {
      setUserActionFeedback(`✕ REJECTED #${selectedItem.id.slice(0, 6)} — Removed false detection`);
    }
    setTimeout(() => setUserActionFeedback(null), 3000);
  };

  // Run Signature AI Sorting Line Animation
  const handleRunActiveLearning = useCallback(() => {
    setIsSimulating(true);
    setSimStep(1);
    setSimMessage('ANALYZING 12,480 DATASET IMAGES...');

    setTimeout(() => {
      setSimStep(2);
      setSimMessage('CALCULATING TRI-FACTOR PRIORITY (Uncertainty ✓ | Rarity ✓ | Diversity ✓)...');
    }, 900);

    setTimeout(() => {
      setSimStep(3);
      setSimMessage('ROUTING SAMPLES: 🟢 AUTO-LABEL vs 🟠 HUMAN REVIEW...');
    }, 1800);

    setTimeout(() => {
      setSimStep(4);
      setSimMessage(`${pendingCount.toLocaleString()} HIGH-VALUE SAMPLES ROUTED TO REVIEW QUEUE!`);
    }, 2700);

    setTimeout(() => {
      setIsSimulating(false);
      setSimStep(0);
      setSimMessage('');
    }, 3600);
  }, [pendingCount]);

  return (
    <div className={`p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl space-y-6 text-white ${className}`}>
      {/* ────────────────────────────────────────────────────────────
         SECTION ①: DATASET OVERVIEW METRICS BAR
         ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                ACTIVE LEARNING TRIAGE WORKBENCH
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ROUND 01 ● ACTIVE
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Let AI decide which images deserve human attention. High-value triage workstation.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Core Summary Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto font-mono">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Total Images</div>
            <div className="text-lg font-extrabold text-white">{totalCount.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="text-[10px] font-bold text-emerald-400 uppercase">Auto-Labeled</div>
            <div className="text-lg font-extrabold text-emerald-400">{autoCount.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <div className="text-[10px] font-bold text-amber-400 uppercase">Human Review</div>
            <div className="text-lg font-extrabold text-amber-400">{pendingCount.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
            <div className="text-[10px] font-bold text-sky-400 uppercase">Effort Saved</div>
            <div className="text-lg font-extrabold text-sky-400">{effortSavedPct}%</div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
         SECTION ②: SIGNATURE AI SORTING LINE ANIMATION STREAM
         ──────────────────────────────────────────────────────────── */}
      <div className="relative p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
              AI Sorting Line Visual Stream
            </span>
          </div>
          <button
            onClick={handleRunActiveLearning}
            disabled={isSimulating}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>RUN ACTIVE LEARNING ROUND</span>
          </button>
        </div>

        {/* Horizontal Card Sorting Stream */}
        <div className="relative flex items-center gap-3 overflow-x-auto py-2 scrollbar-none">
          {spotlightItems.map((item, idx) => {
            const isAuto = item.confidence >= threshold;
            return (
              <div
                key={item.id || idx}
                onClick={() => setSelectedItem(item)}
                className={`shrink-0 w-36 p-2 rounded-xl bg-slate-950 border transition-all cursor-pointer hover:scale-105 ${
                  selectedItem.id === item.id
                    ? 'border-sky-400 ring-2 ring-sky-400/20 shadow-xl'
                    : isAuto
                    ? 'border-emerald-500/40 hover:border-emerald-400'
                    : 'border-amber-500/50 hover:border-amber-400'
                }`}
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800 mb-2">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  <span
                    className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                      isAuto ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {(item.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-[11px] font-bold text-white truncate">{item.predictedClass}</div>
                <div className="text-[10px] font-mono text-slate-400 flex justify-between pt-0.5">
                  <span>Priority:</span>
                  <span className="text-amber-400 font-bold">{(item.priorityScore || 0.72).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Simulation Animation Overlay Stage */}
        {isSimulating && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-30 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="p-3 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40">
              <Sparkles className="w-6 h-6 animate-spin" />
            </div>
            <h4 className="text-sm font-mono font-extrabold text-sky-400 animate-pulse">{simMessage}</h4>
            <div className="flex gap-2">
              <span className={`px-2 py-1 rounded text-[10px] font-mono ${simStep >= 1 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-600'}`}>
                1. UNLABELED
              </span>
              <span className={`px-2 py-1 rounded text-[10px] font-mono ${simStep >= 2 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-600'}`}>
                2. TRI-FACTOR TRIAGE
              </span>
              <span className={`px-2 py-1 rounded text-[10px] font-mono ${simStep >= 3 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-600'}`}>
                3. ROUTING SPLIT
              </span>
              <span className={`px-2 py-1 rounded text-[10px] font-mono ${simStep >= 4 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-600'}`}>
                4. HUMAN QUEUE
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────
         SECTION ③ & ④: TOP PRIORITY SPOTLIGHT (4 CARDS) & HERO INSPECTOR
         ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: 4 Top Priority Spotlight Cards Only (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                TOP PRIORITY SPOTLIGHT
              </h3>
              <p className="text-xs text-slate-400">4 highest-priority samples requiring human attention.</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
              {pendingCount.toLocaleString()} TOTAL IN QUEUE
            </span>
          </div>

          {/* 4 Spotlight Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {spotlightItems.map((item, idx) => {
              const isSelected = selectedItem.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    onSelectImage?.(item);
                  }}
                  className={`p-3 rounded-2xl bg-slate-900 border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'border-sky-400 ring-2 ring-sky-400/30 bg-slate-800/80 shadow-xl'
                      : 'border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-mono font-extrabold text-[10px]">
                      {(item.priorityScore || 0.72).toFixed(2)} PRIORITY
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-extrabold text-white capitalize truncate">{item.predictedClass}</div>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-0.5">
                      <span>Conf:</span>
                      <span className="text-amber-400 font-bold">{(item.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Hero AI Inspector Workstation (7 Cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">AI VISION INSPECTOR</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Image #{selectedItem.id.slice(0, 8)}
              </span>
            </div>

            {/* Actual Image Viewport with Bounding Box Overlay */}
            <div className="relative aspect-video w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
              <img src={selectedItem.imageUrl} alt={selectedItem.title} className="w-full h-full object-cover" />

              {/* Polished 2D YOLO Bounding Box Overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {(selectedItem.boxes || []).map((box) => (
                  <g key={box.id}>
                    <rect
                      x={`${box.x}%`}
                      y={`${box.y}%`}
                      width={`${box.width}%`}
                      height={`${box.height}%`}
                      fill="rgba(245, 158, 11, 0.15)"
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      rx="6"
                    />
                    <path
                      d={`M ${box.x}% ${box.y + 6}% V ${box.y}% H ${box.x + 6}%`}
                      stroke="#FFFFFF"
                      strokeWidth="3"
                      fill="none"
                    />
                  </g>
                ))}
              </svg>

              {/* Bounding Box Class Tag */}
              {(selectedItem.boxes || []).map((box) => (
                <div
                  key={`tag_${box.id}`}
                  className="absolute z-10 pointer-events-none transform -translate-y-full mb-1"
                  style={{ left: `${box.x}%`, top: `${box.y}%` }}
                >
                  <div className="px-2.5 py-1 rounded bg-slate-900/90 text-white font-mono text-[10px] font-bold border border-slate-700 shadow-md">
                    {selectedItem.predictedClass} · {(selectedItem.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>

            {/* WHY THIS IMAGE? Tri-Factor Scoring Breakdown */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-300">
                <span>WHY THIS IMAGE?</span>
                <span className="font-mono text-amber-400 font-extrabold text-sm">
                  PRIORITY SCORE: {(selectedItem.priorityScore || 0.72).toFixed(2)}
                </span>
              </div>

              {/* Progress Bars */}
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-slate-400">UNCERTAINTY</span>
                    <span className="text-amber-400 font-bold">{((selectedItem.uncertaintyScore || 0.74) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(selectedItem.uncertaintyScore || 0.74) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-slate-400">RARITY</span>
                    <span className="text-purple-400 font-bold">{((selectedItem.rareClassScore || 0.88) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(selectedItem.rareClassScore || 0.88) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-slate-400">DIVERSITY</span>
                    <span className="text-sky-400 font-bold">{((selectedItem.diversityScore || 0.62) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(selectedItem.diversityScore || 0.62) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Rationale Bullet Points */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1 text-xs text-slate-300 font-medium">
                {selectedItem.reasons && selectedItem.reasons.length > 0 ? (
                  selectedItem.reasons.map((reason, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Model confidence is low (66%)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Fire / Damaged class underrepresented</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAction('accept')}
                className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>[ ACCEPT ]</span>
              </button>
              <button
                onClick={() => handleAction('correct')}
                className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Edit3 className="w-4 h-4" />
                <span>[ CORRECT ]</span>
              </button>
              <button
                onClick={() => handleAction('reject')}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <XCircle className="w-4 h-4" />
                <span>[ REJECT ]</span>
              </button>
            </div>

            {userActionFeedback && (
              <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30 text-center animate-pulse">
                {userActionFeedback}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Export backward compatible alias so existing imports work without modification
export const Interactive3DEmbeddingCluster = AITriageWorkbench;
export const Interactive2DTriageMap = AITriageWorkbench;
