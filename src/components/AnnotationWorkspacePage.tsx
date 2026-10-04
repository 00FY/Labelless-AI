import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { DatasetItem, BoundingBox, FeedbackCategory, NavigationTab } from '../types';
import { getPipelineConfig } from '../data/pipelineConfig';
import { CLASS_COLORS } from '../data/fallbackPresets';
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
  const [activeClass, setActiveClass] = useState<string>(item.predictedClass || getPipelineConfig().classes[0].display_name);
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

  // Drag-to-move state
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    boxId: string;
    startMouseX: number;
    startMouseY: number;
    startBoxX: number;
    startBoxY: number;
  } | null>(null);

  const handleBoxMouseDown = (e: React.MouseEvent, box: BoundingBox) => {
    e.preventDefault();
    e.stopPropagation();
    // Select the box on mousedown so it's immediately active
    setSelectedBoxId(box.id);
    setActiveClass(box.label);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    dragState.current = {
      boxId: box.id,
      startMouseX: ((e.clientX - rect.left) / rect.width) * 100,
      startMouseY: ((e.clientY - rect.top) / rect.height) * 100,
      startBoxX: box.x,
      startBoxY: box.y,
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!dragState.current || !canvas) return;
      const r = canvas.getBoundingClientRect();
      const currentX = ((moveEvent.clientX - r.left) / r.width) * 100;
      const currentY = ((moveEvent.clientY - r.top) / r.height) * 100;
      const dx = currentX - dragState.current.startMouseX;
      const dy = currentY - dragState.current.startMouseY;

      setBoxes((prev) =>
        prev.map((b) => {
          if (b.id !== dragState.current!.boxId) return b;
          return {
            ...b,
            x: Math.min(Math.max(dragState.current!.startBoxX + dx, 0), 100 - b.width),
            y: Math.min(Math.max(dragState.current!.startBoxY + dy, 0), 100 - b.height),
            isHumanCorrected: true,
          };
        })
      );
    };

    const onMouseUp = () => {
      dragState.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div id="annotation-workspace-root" className="space-y-8 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('queue')}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm"
            title="Back to Review Queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                {item.title}
              </h1>
              <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-md border border-gray-200">
                {item.id}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border ${
                  item.priorityLevel === 'critical'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                Priority: {item.priorityScore.toFixed(2)} 🔴
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono">
              File: {item.filename} &bull; Image {currentIndex + 1} of {datasetItems.length}
            </p>
          </div>
        </div>

        {/* Human Effort Tracker & Coming Soon Timer */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>00:00</span>
            <span className="ml-1 text-[10px] uppercase font-semibold">Annotator Timer — Coming Soon</span>
          </div>

          <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm text-xs">
            <div className="text-right">
              <div className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Effort Meter</div>
              <div className="font-mono font-bold text-emerald-600">
                +{timeSavedSeconds}s Saved ({item.estimatedManualSec}s manual vs {elapsedSec}s AI review)
              </div>
            </div>
            <button
              onClick={() => onExplainItem(item)}
              className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-gray-400" />
              <span>Why Selected?</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace: Left Canvas + Right Diagnostics & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT / CENTER: Interactive Bounding Box Canvas */}
        <div className="lg:col-span-8 space-y-4">
          <div ref={canvasRef} className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video shadow-sm flex items-center justify-center select-none group">
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
                  onMouseDown={(e) => handleBoxMouseDown(e, box)}
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`,
                  }}
                  className={`absolute cursor-move transition-[border,box-shadow,opacity] border-2 rounded-md ${
                    box.isHumanCorrected
                      ? 'border-emerald-500 bg-emerald-500/20'
                      : box.confidence >= 0.80
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-dashed border-red-500 bg-red-500/10'
                  } ${isSelected ? 'ring-2 ring-gray-900 ring-offset-2 scale-[1.01]' : ''}`}
                >
                  {/* Bounding Label Chip */}
                  <div
                    className={`absolute -top-7 left-0 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-white shadow-sm flex items-center gap-1.5 whitespace-nowrap ${
                      box.isHumanCorrected
                        ? 'bg-emerald-600'
                        : box.confidence >= 0.80
                        ? 'bg-blue-600'
                        : 'bg-red-600'
                    }`}
                  >
                    <span>{box.label}</span>
                    <span className="opacity-90 font-normal">
                      {box.isHumanCorrected ? '(Human Corrected)' : `${(box.confidence * 100).toFixed(0)}%`}
                    </span>
                  </div>

                  {/* Corner Resize Handles when Selected */}
                  {isSelected && (
                    <>
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-white border border-gray-900 shadow-sm"></div>
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-white border border-gray-900 shadow-sm"></div>
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-white border border-gray-900 shadow-sm"></div>
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-white border border-gray-900 shadow-sm"></div>
                    </>
                  )}
                </div>
              );
            })}

            {/* Quick Canvas Toolbar Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <div className="px-3 py-2 rounded-xl bg-white/95 text-[11px] font-mono text-gray-700 border border-gray-200 shadow-sm pointer-events-auto flex items-center gap-2 font-medium">
                <span>Box: {selectedBox ? `${selectedBox.label} (#${selectedBox.id})` : 'None'}</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">Drag or click handles to refine spatial coordinates</span>
              </div>

              <button
                onClick={handleAddBox}
                className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-700 text-white font-bold text-xs shadow-sm pointer-events-auto flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bounding Box</span>
              </button>
            </div>
          </div>

          {/* Quick Box List Below Canvas */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Bounding Boxes ({boxes.length}):</span>
            {boxes.map((box, idx) => (
              <button
                key={box.id}
                onClick={() => {
                  setSelectedBoxId(box.id);
                  setActiveClass(box.label);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 border transition-colors ${
                  box.id === selectedBoxId
                    ? 'bg-gray-100 text-gray-900 border-gray-300 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>#{idx + 1} {box.label}</span>
                {box.isHumanCorrected ? (
                  <span className="text-emerald-600 text-[10px] font-bold">✓</span>
                ) : (
                  <span className="text-gray-400 text-[10px]">{(box.confidence * 100).toFixed(0)}%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: AI Predictions vs Human Correction Controls */}
        <div className="lg:col-span-4 space-y-5">
          {/* AI Prediction Diagnostic Panel */}
          <div className="p-6 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="section-label">
                AI Prediction Diagnostic
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gray-100 text-gray-600 border border-gray-200">
                Low Confidence
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <span>{item.predictedClass}</span>
                <span className="text-sm font-mono text-gray-500 font-semibold">{(item.confidence * 100).toFixed(0)}%</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Model detected potential classification ambiguity in boundary geometry.
              </p>
            </div>

            {/* Why Selected Breakdown Tags */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Why was this frame routed to human queue?
              </span>

              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Low confidence ({(item.confidence * 100).toFixed(0)}% &lt; 85% threshold)</span>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 font-medium">
                  <Tag className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>Rare Class / Feature Imbalance Weight</span>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Novel embedding anomaly (+{item.explanation.diversityContribution.toFixed(2)})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Human Annotation & Correction Controls */}
          <div className="p-6 rounded-2xl bg-white border border-gray-200 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="section-label">
                Human Ground-Truth Override
              </span>
              <span className="text-[10px] text-gray-500 font-mono font-medium">Box #{selectedBox?.id || 'none'}</span>
            </div>

            {/* Class Selector Dropdown */}
            <div className="space-y-2">
              <label className="text-xs text-gray-700 font-bold">Selected Box Class Label</label>
              <select
                value={activeClass}
                onChange={(e) => handleUpdateBoxLabel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 font-semibold focus:outline-none focus:border-gray-300 transition-colors shadow-sm"
              >
                {getPipelineConfig().classes.map((c) => (
                  <option key={c.id} value={c.display_name}>
                    {c.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Box Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddBox}
                className="flex-1 py-2.5 text-xs font-bold text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-gray-500" />
                <span>Add Box</span>
              </button>

              {selectedBox && (
                <button
                  onClick={() => handleDeleteBox(selectedBox.id)}
                  className="py-2.5 px-4 text-xs font-bold text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            {/* Human Feedback Tagging (What was wrong?) */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Optional: What was wrong with AI prediction?
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs">
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
                    className={`px-3 py-2 rounded-lg border text-left text-[11px] font-medium transition-colors ${
                      feedbackCategory === fb.id
                        ? 'bg-gray-100 text-gray-900 border-gray-300 font-bold'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
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

      {/* BOTTOM ACTION BAR */}
      <div className="sticky bottom-4 z-30 p-4 rounded-2xl bg-white/95 border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Prev / Next Steppers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => prevItem && onNavigateItem(prevItem)}
            disabled={!prevItem}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-40 text-xs font-semibold text-gray-700 border border-gray-200 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Image</span>
          </button>

          <button
            onClick={() => nextItem && onNavigateItem(nextItem)}
            disabled={!nextItem}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-40 text-xs font-semibold text-gray-700 border border-gray-200 flex items-center gap-1.5 transition-colors shadow-sm"
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
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <X className="w-4 h-4 text-gray-400" />
            <span>✕ REJECT</span>
          </button>

          {/* Action 2: Correct */}
          <button
            id="workspace-correct-btn"
            onClick={handleSaveCorrection}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Edit2 className="w-4 h-4 text-gray-500" />
            <span>✎ SAVE CORRECTION</span>
          </button>

          {/* Action 3: Accept */}
          <button
            id="workspace-accept-btn"
            onClick={handleAcceptAI}
            className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gray-900 hover:bg-gray-700 shadow-sm transition-all flex items-center gap-1.5"
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
          className="fixed bottom-24 right-6 z-50 px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs font-bold shadow-lg flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-gray-400" />
          <span>{saveToast}</span>
        </motion.div>
      )}
    </div>
  );
};
