import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { DatasetItem, BoundingBox, FeedbackCategory, NavigationTab } from '../types';
import { CLASS_COLORS } from '../data/mockDataset';
import {
  Check,
  Edit2,
  X,
  Plus,
  Trash2,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Clock,
  Zap,
  Tag,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AnnotationWorkspaceProps {
  item: DatasetItem;
  datasetItems: DatasetItem[];
  onUpdateItem: (updated: DatasetItem) => void;
  onNavigateItem: (nextItem: DatasetItem) => void;
  onExplainItem: (item: DatasetItem) => void;
  setActiveTab: (tab: NavigationTab) => void;
}

export const AnnotationWorkspacePage: React.FC<AnnotationWorkspaceProps> = ({
  item,
  datasetItems,
  onUpdateItem,
  onNavigateItem,
  onExplainItem,
  setActiveTab,
}) => {
  const [boxes, setBoxes] = useState<BoundingBox[]>(item.boxes);
  const [selectedBoxId, setSelectedBoxId] = useState<string>(item.boxes[0]?.id || '');
  const [activeClass, setActiveClass] = useState<string>(item.predictedClass || 'Building');
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory | undefined>(
    item.feedbackCategory
  );
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Sync when item changes
  useEffect(() => {
    setBoxes(item.boxes);
    setSelectedBoxId(item.boxes[0]?.id || '');
    setActiveClass(item.predictedClass || 'Building');
    setFeedbackCategory(item.feedbackCategory);
    setElapsedSec(0);
  }, [item.id]);

  // Stopwatch
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [item.id]);

  const selectedBox = boxes.find((b) => b.id === selectedBoxId) || boxes[0];

  // Image Navigation: Find index in list
  const currentIndex = datasetItems.findIndex((i) => i.id === item.id);
  const prevItem = currentIndex > 0 ? datasetItems[currentIndex - 1] : null;
  const nextItem = currentIndex < datasetItems.length - 1 ? datasetItems[currentIndex + 1] : null;

  // Actions
  const handleAcceptAI = () => {
    const updated: DatasetItem = {
      ...item,
      status: 'auto_labeled',
      aiAssistedSec: elapsedSec || item.aiAssistedSec,
    };
    onUpdateItem(updated);
    setSaveToast('✓ Accepted AI annotations to training set!');
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    setTimeout(() => {
      setSaveToast(null);
      if (nextItem) onNavigateItem(nextItem);
    }, 900);
  };

  const handleSaveCorrection = () => {
    const updatedBoxes = boxes.map((b) => ({ ...b, isHumanCorrected: true }));
    const updated: DatasetItem = {
      ...item,
      boxes: updatedBoxes,
      status: 'human_reviewed',
      feedbackCategory,
      aiAssistedSec: elapsedSec || item.aiAssistedSec,
    };
    onUpdateItem(updated);
    setSaveToast('✎ Saved human correction for retraining pool!');
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.8 } });
    setTimeout(() => {
      setSaveToast(null);
      if (nextItem) onNavigateItem(nextItem);
    }, 900);
  };

  const handleReject = () => {
    const updated: DatasetItem = {
      ...item,
      status: 'rejected',
      feedbackCategory: feedbackCategory || 'false_detection',
      aiAssistedSec: elapsedSec || item.aiAssistedSec,
    };
    onUpdateItem(updated);
    setSaveToast('✕ Marked sample as rejected / false detection');
    setTimeout(() => {
      setSaveToast(null);
      if (nextItem) onNavigateItem(nextItem);
    }, 900);
  };

  const handleAddBox = () => {
    const newId = `b-custom-${Date.now()}`;
    const newBox: BoundingBox = {
      id: newId,
      label: activeClass,
      x: 30 + Math.random() * 20,
      y: 30 + Math.random() * 20,
      width: 35,
      height: 35,
      confidence: 1.0,
      isHumanCorrected: true,
      isNew: true,
    };
    setBoxes((prev) => [...prev, newBox]);
    setSelectedBoxId(newId);
  };

  const handleDeleteBox = (boxId: string) => {
    setBoxes((prev) => prev.filter((b) => b.id !== boxId));
    if (selectedBoxId === boxId) {
      const remaining = boxes.filter((b) => b.id !== boxId);
      setSelectedBoxId(remaining[0]?.id || '');
    }
  };

  const handleUpdateBoxLabel = (newLabel: string) => {
    setActiveClass(newLabel);
    if (!selectedBoxId) return;
    setBoxes((prev) =>
      prev.map((b) => (b.id === selectedBoxId ? { ...b, label: newLabel, isHumanCorrected: true } : b))
    );
  };

  const timeSavedSeconds = Math.max(0, item.estimatedManualSec - (elapsedSec || item.aiAssistedSec));

  return (
    <div id="annotation-workspace-root" className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('queue')}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Back to Review Queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {item.title}
              </h1>
              <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                {item.id}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                  item.priorityLevel === 'critical'
                    ? 'bg-rose-950 text-rose-300 border-rose-700'
                    : 'bg-amber-950 text-amber-300 border-amber-700'
                }`}
              >
                Priority: {item.priorityScore.toFixed(2)} 🔴
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              File: {item.filename} &bull; Image {currentIndex + 1} of {datasetItems.length}
            </p>
          </div>
        </div>

        {/* Human Effort Tracker for this image */}
        <div className="flex items-center gap-4 bg-zinc-900/90 px-4 py-2 rounded-2xl border border-zinc-800 text-xs">
          <div className="text-right">
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">Effort Meter</div>
            <div className="font-mono font-bold text-emerald-400">
              +{timeSavedSeconds}s Saved ({item.estimatedManualSec}s manual vs {elapsedSec}s AI review)
            </div>
          </div>
          <button
            onClick={() => onExplainItem(item)}
            className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-300 text-xs font-bold transition-all flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why Selected?</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Canvas + Right Diagnostics & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / CENTER: Interactive Bounding Box Canvas */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black aspect-video shadow-2xl flex items-center justify-center select-none group">
            {/* Base Image */}
            <img
              src={item.imageUrl}
              alt={item.title}
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = '/predictions/00f205aea57febc8e82d4e99a18b1d51.png';
              }}
              className="w-full h-full object-cover"
            />

            {/* Interactive Bounding Boxes Overlay */}
            {boxes.map((box) => {
              const isSelected = box.id === selectedBoxId;
              const classColor = CLASS_COLORS[box.label] || CLASS_COLORS.Building;

              return (
                <div
                  key={box.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBoxId(box.id);
                    setActiveClass(box.label);
                  }}
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`,
                  }}
                  className={`absolute cursor-pointer transition-all border-2 rounded-md ${
                    box.isHumanCorrected
                      ? 'border-emerald-400 bg-emerald-500/25 shadow-lg shadow-emerald-500/20'
                      : box.confidence >= 0.80
                      ? 'border-blue-400 bg-blue-500/20 shadow-md shadow-blue-500/10'
                      : 'border-dashed border-rose-400 bg-rose-500/20 shadow-lg shadow-rose-500/20'
                  } ${isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-black scale-[1.01]' : ''}`}
                >
                  {/* Bounding Label Chip */}
                  <div
                    className={`absolute -top-7 left-0 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-white shadow flex items-center gap-1.5 whitespace-nowrap ${
                      box.isHumanCorrected
                        ? 'bg-emerald-600'
                        : box.confidence >= 0.80
                        ? 'bg-blue-600'
                        : 'bg-rose-600'
                    }`}
                  >
                    <span>{box.label}</span>
                    <span className="opacity-80">
                      {box.isHumanCorrected ? '(Human Corrected)' : `${(box.confidence * 100).toFixed(0)}%`}
                    </span>
                  </div>

                  {/* Corner Resize Handles when Selected */}
                  {isSelected && (
                    <>
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-white border border-zinc-900 shadow"></div>
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-white border border-zinc-900 shadow"></div>
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-white border border-zinc-900 shadow"></div>
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-white border border-zinc-900 shadow"></div>
                    </>
                  )}
                </div>
              );
            })}

            {/* Quick Canvas Toolbar Overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md text-[11px] font-mono text-zinc-300 border border-zinc-800 pointer-events-auto flex items-center gap-2">
                <span>Box: {selectedBox ? `${selectedBox.label} (#${selectedBox.id})` : 'None'}</span>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-400">Drag or click handles to refine spatial coordinates</span>
              </div>

              <button
                onClick={handleAddBox}
                className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-zinc-950 font-bold text-xs shadow-lg shadow-blue-500/20 pointer-events-auto flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bounding Box</span>
              </button>
            </div>
          </div>

          {/* Quick Box List Below Canvas */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-zinc-400">Bounding Boxes ({boxes.length}):</span>
            {boxes.map((box, idx) => (
              <button
                key={box.id}
                onClick={() => {
                  setSelectedBoxId(box.id);
                  setActiveClass(box.label);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 border transition-all ${
                  box.id === selectedBoxId
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                <span>#{idx + 1} {box.label}</span>
                {box.isHumanCorrected ? (
                  <span className="text-emerald-400 text-[10px]">✓</span>
                ) : (
                  <span className="text-zinc-500 text-[10px]">{(box.confidence * 100).toFixed(0)}%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: AI Predictions vs Human Correction Controls */}
        <div className="lg:col-span-4 space-y-4">
          {/* AI Prediction Diagnostic Panel */}
          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                AI Prediction Diagnostic
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                Low Confidence
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-black text-white flex items-center gap-2">
                <span>{item.predictedClass}</span>
                <span className="text-sm font-mono text-rose-400">{(item.confidence * 100).toFixed(0)}%</span>
              </div>
              <p className="text-xs text-zinc-400">
                Model detected potential classification ambiguity in boundary geometry.
              </p>
            </div>

            {/* Why Selected Breakdown Tags */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Why was this frame routed to human queue?
              </span>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Low confidence ({(item.confidence * 100).toFixed(0)}% &lt; 85% threshold)</span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs text-rose-300">
                  <Tag className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Rare Class / Feature Imbalance Weight</span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs text-blue-300">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Novel embedding anomaly (+{item.explanation.diversityContribution.toFixed(2)})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Human Annotation & Correction Controls */}
          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Human Ground-Truth Override
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Box #{selectedBox?.id || 'none'}</span>
            </div>

            {/* Class Selector Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Selected Box Class Label</label>
              <select
                value={activeClass}
                onChange={(e) => handleUpdateBoxLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="Building">Building</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Person">Person</option>
                <option value="Fire">Fire</option>
                <option value="Debris">Debris</option>
              </select>
            </div>

            {/* Box Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddBox}
                className="flex-1 py-2 text-xs font-bold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>Add Box</span>
              </button>

              {selectedBox && (
                <button
                  onClick={() => handleDeleteBox(selectedBox.id)}
                  className="py-2 px-3 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            {/* Human Feedback Tagging (What was wrong?) */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Optional: What was wrong with AI prediction?
              </label>

              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { id: 'wrong_class', label: 'Wrong class' },
                  { id: 'wrong_box', label: 'Wrong box geometry' },
                  { id: 'missing_object', label: 'Missing object' },
                  { id: 'false_detection', label: 'False detection' },
                  { id: 'other', label: 'Other' },
                ].map((fb) => (
                  <button
                    key={fb.id}
                    type="button"
                    onClick={() => setFeedbackCategory(fb.id as FeedbackCategory)}
                    className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-medium transition-all ${
                      feedbackCategory === fb.id
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-semibold'
                        : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {feedbackCategory === fb.id ? '● ' : '○ '}
                    {fb.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR (Exactly 3 Primary Actions + Steppers) */}
      <div className="sticky bottom-4 z-30 p-4 rounded-2xl bg-zinc-950/95 border border-zinc-800 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Prev / Next Steppers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => prevItem && onNavigateItem(prevItem)}
            disabled={!prevItem}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-xs font-semibold text-zinc-300 border border-zinc-800 flex items-center gap-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Image</span>
          </button>

          <button
            onClick={() => nextItem && onNavigateItem(nextItem)}
            disabled={!nextItem}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-xs font-semibold text-zinc-300 border border-zinc-800 flex items-center gap-1.5 transition-colors"
          >
            <span>Next Image</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Primary Decision Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Action 1: Reject */}
          <button
            id="workspace-reject-btn"
            onClick={handleReject}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>✕ REJECT</span>
          </button>

          {/* Action 2: Correct */}
          <button
            id="workspace-correct-btn"
            onClick={handleSaveCorrection}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-blue-400 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 transition-all flex items-center gap-1.5"
          >
            <Edit2 className="w-4 h-4" />
            <span>✎ SAVE CORRECTION</span>
          </button>

          {/* Action 3: Accept */}
          <button
            id="workspace-accept-btn"
            onClick={handleAcceptAI}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-zinc-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-400/20 transition-all flex items-center gap-1.5 hover:scale-105"
          >
            <Check className="w-4 h-4" />
            <span>✓ ACCEPT AI LABELS</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {saveToast && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-24 right-6 z-50 px-4 py-2.5 rounded-xl bg-zinc-900 border border-blue-500/40 text-blue-300 text-xs font-bold shadow-2xl flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{saveToast}</span>
        </motion.div>
      )}
    </div>
  );
};
