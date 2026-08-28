import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DatasetItem } from '../types';
import { X, Sparkles, AlertTriangle, Layers, Flame, CheckCircle, Info } from 'lucide-react';

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
  if (!item) return null;

  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'critical':
        return { text: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/40', badge: 'bg-rose-950/80 text-rose-300 border-rose-600/50' };
      case 'high':
        return { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40', badge: 'bg-amber-950/80 text-amber-300 border-amber-600/50' };
      case 'medium':
        return { text: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/40', badge: 'bg-blue-950/80 text-blue-300 border-blue-600/50' };
      default:
        return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50' };
    }
  };

  const colors = getPriorityColor(item.priorityLevel);

  return (
    <AnimatePresence>
      <div
        id="explain-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          id="explain-modal-container"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  Explain Decision: <span className="text-blue-400">{item.id}</span>
                </h3>
                <p className="text-xs text-zinc-400">Active Learning Routing Diagnostic & Priority Score Calculation</p>
              </div>
            </div>
            <button
              id="close-explain-modal-btn"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Image Preview & Priority Summary */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5 relative rounded-xl overflow-hidden border border-zinc-700 bg-black aspect-video md:aspect-auto">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[11px] font-mono text-zinc-300 border border-zinc-700">
                  {item.predictedClass} ({(item.confidence * 100).toFixed(0)}%)
                </div>
              </div>

              <div className="md:col-span-7 flex flex-col justify-between bg-zinc-950/70 p-4 rounded-xl border border-zinc-800">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Calculated Review Priority
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded border ${colors.badge}`}>
                      {item.priorityLevel.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-4xl font-extrabold font-mono text-zinc-100">
                      {item.priorityScore.toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-400">/ 1.00 Active Learning Score</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-300 mb-1">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <span>Active Learning Routing Verdict:</span>
                  </div>
                  <p className="text-xs text-blue-300 font-medium">
                    {item.explanation.recommendation}
                  </p>
                </div>
              </div>
            </div>

            {/* Score Breakdown Bars */}
            <div className="space-y-3 p-4 rounded-xl bg-zinc-950/50 border border-zinc-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Score Decomposition Formula
                </h4>
                <span className="text-[11px] font-mono text-zinc-400">
                  Priority = (0.4 × Unc) + (0.3 × Div) + (0.3 × Rarity)
                </span>
              </div>

              {/* 1. Uncertainty */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-amber-300 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Model Uncertainty (Entropy)
                  </span>
                  <span className="font-mono text-zinc-300">
                    +{(item.explanation.uncertaintyContribution).toFixed(2)} (Score: {(item.uncertaintyScore * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${item.uncertaintyScore * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Prediction confidence is {(item.confidence * 100).toFixed(0)}% (threshold: 85%). Low certainty indicates potential label confusion.
                </p>
              </div>

              {/* 2. Diversity */}
              <div className="space-y-1 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-blue-300 font-medium">
                    <Layers className="w-3.5 h-3.5" />
                    Visual / Embedding Diversity
                  </span>
                  <span className="font-mono text-zinc-300">
                    +{(item.explanation.diversityContribution).toFixed(2)} (Score: {(item.diversityScore * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${item.diversityScore * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Latent embedding distance from previously verified images is {(item.diversityScore * 100).toFixed(0)}%. High novelty expands feature boundaries.
                </p>
              </div>

              {/* 3. Rare Class */}
              <div className="space-y-1 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-rose-300 font-medium">
                    <Flame className="w-3.5 h-3.5" />
                    Class Rarity & Imbalance Weight
                  </span>
                  <span className="font-mono text-zinc-300">
                    +{(item.explanation.rareClassContribution).toFixed(2)} (Score: {(item.rareClassScore * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all"
                    style={{ width: `${item.rareClassScore * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Target class &ldquo;{item.predictedClass}&rdquo; is currently underrepresented in the validated ground-truth pool.
                </p>
              </div>
            </div>

            {/* Why Human Review Matters */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Why Human Review Has High Gradient Value:
              </h4>
              <ul className="space-y-1.5">
                {item.explanation.bulletPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/90">
            <button
              id="explain-dismiss-btn"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
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
                className="px-4 py-2 text-xs font-bold text-zinc-950 bg-blue-500 hover:bg-blue-400 rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
              >
                Open in Annotation Workspace →
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
