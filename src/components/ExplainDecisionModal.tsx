import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DatasetItem } from '../types';
import { X, Sparkles, AlertTriangle, Layers, Flame, CheckCircle, Info } from 'lucide-react';
import { getPipelineConfig, getFormulaString } from '../data/pipelineConfig';

interface ExplainDecisionModalProps {
  item: DatasetItem | null;
  onClose: () => void;
  onOpenWorkspace?: (item: DatasetItem) => void;
}

export const ExplainDecisionModal: React.FC<ExplainDecisionModalProps> = ({
  item,
  onClose,
  onOpenWorkspace,
}) => {
  // Close on Escape while open
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  const pipeCfg = getPipelineConfig();
  const formulaStr = getFormulaString(pipeCfg);
  const { w_uncertainty, w_rare_class, w_diversity } = pipeCfg.ranking;
  const confThreshold = pipeCfg.routing.confidence_threshold;

  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'critical':
        return { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'high':
        return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'medium':
        return { text: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', badge: 'bg-sky-50 text-sky-700 border-sky-200' };
      default:
        return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  const colors = getPriorityColor(item?.priorityLevel ?? 'low');

  // Render inside AnimatePresence so the exit animation runs when item becomes null
  return (
    <AnimatePresence>
      {item && (
      <motion.div
        key="explain-modal"
        id="explain-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="explain-modal-title"
      >
        <motion.div
          id="explain-modal-container"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 id="explain-modal-title" className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
                  Explain Decision: <span className="text-emerald-600 font-mono-code text-sm">{item.id}</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono-code mt-0.5">Active Learning Routing Diagnostic & Priority Score Calculation</p>
              </div>
            </div>
            <button
              id="close-explain-modal-btn"
              onClick={onClose}
              aria-label="Close"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Image Preview & Priority Summary */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-5 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video md:aspect-auto">
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
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-slate-900/90 text-[10px] font-mono-code text-emerald-400 border border-slate-800 font-semibold shadow-md">
                  {item.predictedClass} ({(item.confidence * 100).toFixed(0)}%)
                </div>
              </div>

              <div className="md:col-span-7 flex flex-col justify-between bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold font-mono-code uppercase tracking-wider text-slate-500">
                      Calculated Review Priority
                    </span>
                    <span className={`px-2.5 py-1 text-xs font-mono-code font-bold rounded-md border ${colors.badge}`}>
                      {item.priorityLevel.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-4xl font-black font-mono-code text-slate-900">
                      {item.priorityScore.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-500 font-mono-code">/ 1.00 Active Learning Score</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold font-mono-code text-emerald-700 mb-1.5">
                    <Info className="w-4 h-4 text-emerald-600" />
                    <span>Active Learning Routing Verdict:</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {item.explanation.recommendation}
                  </p>
                </div>
              </div>
            </div>

            {/* Score Breakdown Bars */}
            <div className="space-y-4 p-5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="text-xs font-bold font-mono-code uppercase tracking-wider text-slate-500">
                  Score Decomposition Formula
                </h4>
                <span className="text-[11px] font-mono-code text-emerald-700 font-bold">
                  {formulaStr}
                </span>
              </div>

              {/* 1. Uncertainty */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono-code">
                  <span className="flex items-center gap-2 text-slate-800 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Model Uncertainty (weight: {w_uncertainty})
                  </span>
                  <span className="text-amber-700 font-bold">
                    +{(item.explanation.uncertaintyContribution).toFixed(2)} (Score: {(item.uncertaintyScore * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${item.uncertaintyScore * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Prediction confidence is {(item.confidence * 100).toFixed(0)}% (threshold: {(confThreshold * 100).toFixed(0)}%). Low certainty indicates potential label confusion.
                </p>
              </div>

              {/* 2. Diversity */}
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs font-mono-code">
                  <span className="flex items-center gap-2 text-slate-800 font-bold">
                    <Layers className="w-4 h-4 text-sky-600" />
                    Scene Diversity (weight: {w_diversity})
                  </span>
                  <span className="text-sky-700 font-bold">
                    +{(item.explanation.diversityContribution).toFixed(2)} (Score: {(item.diversityScore * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all"
                    style={{ width: `${item.diversityScore * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Based on how many objects were detected ({item.boxes.length} here): busier, multi-object scenes score higher than single-object ones.
                </p>
              </div>

              {/* 3. Rare Class */}
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs font-mono-code">
                  <span className="flex items-center gap-2 text-slate-800 font-bold">
                    <Flame className="w-4 h-4 text-rose-600" />
                    Class Rarity & Imbalance (weight: {w_rare_class})
                  </span>
                  <span className="text-rose-700 font-bold">
                    +{(item.explanation.rareClassContribution).toFixed(2)} (Score: {(item.rareClassScore * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all"
                    style={{ width: `${item.rareClassScore * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {item.rareClassScore > 0
                    ? 'Rarest class detected here, scored by how much less often the model predicts it than the most common class.'
                    : 'Only the most frequently predicted class was detected, so there is no rarity boost.'}
                </p>
              </div>
            </div>

            {/* Why Human Review Matters */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold font-mono-code uppercase tracking-wider text-slate-500">
                Why Human Review Has High Gradient Value:
              </h4>
              <ul className="space-y-2">
                {item.explanation.bulletPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <button
              id="explain-dismiss-btn"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono-code font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
            >
              Close Diagnostic
            </button>
            {onOpenWorkspace && (
              <button
                id="explain-open-workspace-btn"
                onClick={() => {
                  onClose();
                  onOpenWorkspace(item);
                }}
                className="px-5 py-2.5 text-xs font-bold font-mono-code uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                Open in Annotation Workspace &rarr;
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
