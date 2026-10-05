import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { DatasetItem, BoundingBox, FeedbackCategory, NavigationTab } from '../types';
import { getPipelineConfig } from '../data/pipelineConfig';
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
    setActiveClass(item.predictedClass || getPipelineConfig().classes[0].display_name);
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

  // After a decision, continue with the next image still waiting for review (in queue order),
  // wrapping around; auto-labelled and already-reviewed images are skipped.
  const nextPendingItem =
    [...datasetItems.slice(currentIndex + 1), ...datasetItems.slice(0, Math.max(currentIndex, 0))].find(
      (i) => i.status === 'pending' && i.id !== item.id
    ) || null;

  // Actions
  // Accept confirms the AI's boxes unchanged; edited boxes must go through Save Correction
  const hasEdits = JSON.stringify(boxes) !== JSON.stringify(item.boxes);

  const handleAcceptAI = () => {
    if (hasEdits) return;
    const updated: DatasetItem = {
      ...item,
      status: 'human_reviewed',
      aiAssistedSec: elapsedSec || item.aiAssistedSec,
    };
    onUpdateItem(updated);
    setSaveToast('✓ Accepted AI annotations to training set!');
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    setTimeout(() => {
      setSaveToast(null);
      if (nextPendingItem) onNavigateItem(nextPendingItem);
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
      if (nextPendingItem) onNavigateItem(nextPendingItem);
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
      if (nextPendingItem) onNavigateItem(nextPendingItem);
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

  // Drag state: move the whole box, or resize it from one corner
  type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se';
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    boxId: string;
    mode: DragMode;
    startMouseX: number;
    startMouseY: number;
    start: { x: number; y: number; width: number; height: number };
    moved: boolean;
  } | null>(null);
  const endDragRef = useRef<(() => void) | null>(null);

  // Drop window listeners if the workspace switches image or unmounts mid-drag
  useEffect(() => () => endDragRef.current?.(), [item.id]);

  // Ignore pointer jitter below this distance (in % of the image) so a click doesn't count as an edit
  const DRAG_THRESHOLD_PCT = 0.5;
  // Smallest box a resize can produce, in % of the image
  const MIN_BOX_PCT = 2;

  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

  // New geometry for a box given the pointer offset (dx, dy) since the drag started
  const applyDrag = (
    mode: DragMode,
    start: { x: number; y: number; width: number; height: number },
    dx: number,
    dy: number
  ) => {
    if (mode === 'move') {
      return {
        x: clamp(start.x + dx, 0, 100 - start.width),
        y: clamp(start.y + dy, 0, 100 - start.height),
        width: start.width,
        height: start.height,
      };
    }
    // Resize: the corner opposite the dragged handle stays fixed
    let left = start.x;
    let top = start.y;
    let right = start.x + start.width;
    let bottom = start.y + start.height;
    if (mode === 'nw' || mode === 'sw') left = clamp(left + dx, 0, right - MIN_BOX_PCT);
    if (mode === 'ne' || mode === 'se') right = clamp(right + dx, left + MIN_BOX_PCT, 100);
    if (mode === 'nw' || mode === 'ne') top = clamp(top + dy, 0, bottom - MIN_BOX_PCT);
    if (mode === 'sw' || mode === 'se') bottom = clamp(bottom + dy, top + MIN_BOX_PCT, 100);
    return { x: left, y: top, width: right - left, height: bottom - top };
  };

  const handleBoxPointerDown = (e: React.PointerEvent, box: BoundingBox, mode: DragMode = 'move') => {
    e.preventDefault();
    e.stopPropagation();
    // Select the box on pointerdown so it's immediately active
    setSelectedBoxId(box.id);
    setActiveClass(box.label);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    dragState.current = {
      boxId: box.id,
      mode,
      startMouseX: ((e.clientX - rect.left) / rect.width) * 100,
      startMouseY: ((e.clientY - rect.top) / rect.height) * 100,
      start: { x: box.x, y: box.y, width: box.width, height: box.height },
      moved: false,
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      const drag = dragState.current;
      if (!drag || !canvas) return;
      const r = canvas.getBoundingClientRect();
      const dx = ((moveEvent.clientX - r.left) / r.width) * 100 - drag.startMouseX;
      const dy = ((moveEvent.clientY - r.top) / r.height) * 100 - drag.startMouseY;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PCT) return;
      drag.moved = true;

      const geometry = applyDrag(drag.mode, drag.start, dx, dy);
      setBoxes((prev) =>
        prev.map((b) => (b.id === drag.boxId ? { ...b, ...geometry, isHumanCorrected: true } : b))
      );
    };

    const endDrag = () => {
      dragState.current = null;
      endDragRef.current = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };

    endDragRef.current = endDrag;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
  };

  return (
    <div id="annotation-workspace-root" className="space-y-10 pb-20 min-h-screen bg-slate-50 text-slate-900 max-w-7xl mx-auto px-4 lg:px-8 pt-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('queue')}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
            title="Back to Review Queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 tracking-tight">
                {item.title}
              </h1>
              <span className="font-mono-code text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                {item.id}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-mono-code font-bold border ${
                  item.priorityLevel === 'critical'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                Priority: {item.priorityScore.toFixed(2)} 🔴
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono-code">
              File: {item.filename} &bull; Image {currentIndex + 1} of {datasetItems.length}
            </p>
          </div>
        </div>

        {/* Human Effort Tracker & Coming Soon Timer */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-500 font-mono-code shadow-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>00:00</span>
            <span className="ml-1 text-[10px] uppercase font-semibold">Annotator Timer</span>
          </div>

          <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm text-xs font-mono-code">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Effort Meter</div>
              <div className="font-bold text-emerald-700">
                +{timeSavedSeconds}s Saved ({item.estimatedManualSec}s manual vs {elapsedSec}s AI review)
              </div>
            </div>
            <button
              onClick={() => onExplainItem(item)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              <span>Why Selected?</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace: Left Canvas + Right Diagnostics & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT / CENTER: Interactive Bounding Box Canvas */}
        <div className="lg:col-span-8 space-y-4">
          <div ref={canvasRef} className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video shadow-xl flex items-center justify-center select-none group">
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

              return (
                <div
                  key={box.id}
                  onPointerDown={(e) => handleBoxPointerDown(e, box)}
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`,
                    touchAction: 'none',
                  }}
                  className={`absolute cursor-move transition-[border,box-shadow,opacity] border-2 rounded-md ${
                    box.isHumanCorrected
                      ? 'border-emerald-400 bg-emerald-500/20'
                      : box.confidence >= 0.80
                      ? 'border-sky-400 bg-sky-500/15'
                      : 'border-dashed border-rose-500 bg-rose-500/15'
                  } ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 z-10' : ''}`}
                >
                  {/* Bounding Label Chip */}
                  <div
                    className={`absolute -top-7 left-0 px-2.5 py-0.5 rounded text-[11px] font-mono-code font-bold text-white shadow-xs flex items-center gap-1.5 whitespace-nowrap ${
                      box.isHumanCorrected
                        ? 'bg-emerald-600'
                        : box.confidence >= 0.80
                        ? 'bg-sky-600'
                        : 'bg-rose-600'
                    }`}
                  >
                    <span>{box.label}</span>
                    <span className="opacity-90 font-normal">
                      {box.isHumanCorrected ? '(Human Corrected)' : `${(box.confidence * 100).toFixed(0)}%`}
                    </span>
                  </div>

                  {/* Corner resize handles when selected */}
                  {isSelected &&
                    (
                      [
                        ['nw', '-top-2 -left-2 cursor-nwse-resize'],
                        ['ne', '-top-2 -right-2 cursor-nesw-resize'],
                        ['sw', '-bottom-2 -left-2 cursor-nesw-resize'],
                        ['se', '-bottom-2 -right-2 cursor-nwse-resize'],
                      ] as const
                    ).map(([corner, pos]) => (
                      <div
                        key={corner}
                        data-handle={corner}
                        onPointerDown={(e) => handleBoxPointerDown(e, box, corner)}
                        style={{ touchAction: 'none' }}
                        className={`absolute ${pos} w-4 h-4 rounded-full bg-white border-2 border-slate-900 shadow-xs z-10`}
                      ></div>
                    ))}
                </div>
              );
            })}

            {/* Quick Canvas Toolbar Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md text-[11px] font-mono-code text-slate-200 border border-slate-700 shadow-md pointer-events-none flex items-center gap-2 font-medium">
                <span>Box: {selectedBox ? `${selectedBox.label} (#${selectedBox.id})` : 'None'}</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-300">Drag a box to move · drag a corner to resize</span>
              </div>

              <button
                onClick={handleAddBox}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-mono-code font-bold text-xs shadow-md pointer-events-auto flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-slate-900" />
                <span>Add Bounding Box</span>
              </button>
            </div>
          </div>

          {/* Quick Box List Below Canvas */}
          <div className="flex flex-wrap items-center gap-2 pt-2 font-mono-code">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1">Bounding Boxes ({boxes.length}):</span>
            {boxes.map((box, idx) => (
              <button
                key={box.id}
                onClick={() => {
                  setSelectedBoxId(box.id);
                  setActiveClass(box.label);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
                  box.id === selectedBoxId
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>#{idx + 1} {box.label}</span>
                {box.isHumanCorrected ? (
                  <span className="text-emerald-600 text-[10px] font-bold">✓</span>
                ) : (
                  <span className="text-slate-400 text-[10px]">{(box.confidence * 100).toFixed(0)}%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: AI Predictions vs Human Correction Controls */}
        <div className="lg:col-span-4 space-y-5 font-mono-code">
          {/* AI Prediction Diagnostic Panel */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="section-label text-[10px] uppercase font-bold tracking-widest text-emerald-700">
                AI Prediction Diagnostic
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Low Confidence
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-display font-extrabold text-slate-900 flex items-center gap-2">
                <span>{item.predictedClass}</span>
                <span className="text-sm font-mono-code text-slate-500 font-semibold">{(item.confidence * 100).toFixed(0)}%</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Model detected potential classification ambiguity in boundary geometry.
              </p>
            </div>

            {/* Why Selected Breakdown Tags */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Why was this frame routed to human queue?
              </span>

              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Low confidence ({(item.confidence * 100).toFixed(0)}% &lt; 85% threshold)</span>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
                  <Tag className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Rare-class boost (+{item.explanation.rareClassContribution.toFixed(2)})</span>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>Scene diversity (+{item.explanation.diversityContribution.toFixed(2)})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Human Annotation & Correction Controls */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="section-label text-[10px] uppercase font-bold tracking-widest text-emerald-700">
                Human Ground-Truth Override
              </span>
              <span className="text-[10px] text-slate-500 font-mono-code font-medium">Box #{selectedBox?.id || 'none'}</span>
            </div>

            {/* Class Selector Dropdown */}
            <div className="space-y-2">
              <label className="text-xs text-slate-700 font-bold">Selected Box Class Label</label>
              <select
                value={activeClass}
                onChange={(e) => handleUpdateBoxLabel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono-code font-semibold focus:outline-none focus:border-slate-400 transition-colors shadow-xs"
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
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-slate-600" />
                <span>Add Box</span>
              </button>

              {selectedBox && (
                <button
                  onClick={() => handleDeleteBox(selectedBox.id)}
                  className="py-2.5 px-4 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            {/* Human Feedback Tagging (What was wrong?) */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
                    className={`px-3 py-2 rounded-xl border text-left text-[11px] font-mono-code font-medium transition-all cursor-pointer ${
                      feedbackCategory === fb.id
                        ? 'bg-slate-900 text-white border-slate-900 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
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
      <div className="sticky bottom-4 z-30 p-4 rounded-2xl bg-white/95 border border-slate-200/90 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono-code">
        {/* Prev / Next Steppers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => prevItem && onNavigateItem(prevItem)}
            disabled={!prevItem}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-semibold text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Image</span>
          </button>

          <button
            onClick={() => nextItem && onNavigateItem(nextItem)}
            disabled={!nextItem}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-semibold text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
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
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>✕ REJECT</span>
          </button>

          {/* Action 2: Correct */}
          <button
            id="workspace-correct-btn"
            onClick={handleSaveCorrection}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            <span>✎ SAVE CORRECTION</span>
          </button>

          {/* Action 3: Accept */}
          <button
            id="workspace-accept-btn"
            onClick={handleAcceptAI}
            disabled={hasEdits}
            title={hasEdits ? 'You edited the boxes. Use Save Correction to keep your changes.' : undefined}
            className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
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
          className="fixed bottom-24 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono-code font-bold shadow-2xl flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </motion.div>
      )}
    </div>
  );
};
