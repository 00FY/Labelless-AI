import React, { useState } from 'react';
import { motion } from 'motion/react';
import { NavigationTab } from '../types';
import {
  Sparkles,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface LandingPageProps {
  onStartAnnotation: () => void;
  onViewDemoDataset: () => void;
  setActiveTab: (tab: NavigationTab) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAnnotation,
  onViewDemoDataset,
  setActiveTab,
}) => {
  const [activePreviewMode, setActivePreviewMode] = useState<'both' | 'auto' | 'review'>('both');

  return (
    <div id="landing-page-root" className="space-y-10 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 via-zinc-950/90 to-zinc-950 p-6 md:p-10 lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.08),transparent_50%)]"></div>

        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          {/* Main Headline & Value Proposition */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Active-Learning Computer Vision Pipeline
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              LabelLess AI
            </h1>

            <p className="text-xl sm:text-2xl font-bold text-zinc-200">
              Let AI label the obvious.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-300 to-indigo-400">
                Let humans focus on what matters.
              </span>
            </p>

            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              An active-learning computer vision pipeline that reduces manual annotation by automatically
              labeling confident predictions and prioritizing the images where human feedback has the
              highest value.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                id="hero-start-annotation-btn"
                onClick={onStartAnnotation}
                className="px-6 py-3 rounded-xl font-bold text-sm text-zinc-950 bg-blue-500 hover:bg-blue-400 shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                <span>Start Annotation Pipeline</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-view-demo-dataset-btn"
                onClick={onViewDemoDataset}
                className="px-6 py-3 rounded-xl font-bold text-sm text-zinc-200 bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700 shadow-md transition-all flex items-center gap-2 hover:text-white hover:border-zinc-600"
              >
                <Database className="w-4 h-4 text-blue-400" />
                <span>View Disaster Demo Dataset</span>
              </button>
            </div>
          </div>

          {/* Interactive Core Hero Visual: AI Does Easy Work vs Humans Handle Hard Cases */}
          <div className="pt-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 md:p-6 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    How LabelLess AI Routes Computer Vision Inference
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Confidence thresholding & uncertainty routing in real-time
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
                  <button
                    onClick={() => setActivePreviewMode('both')}
                    className={`px-2.5 py-1 rounded font-medium transition-all ${
                      activePreviewMode === 'both' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    All Streams
                  </button>
                  <button
                    onClick={() => setActivePreviewMode('auto')}
                    className={`px-2.5 py-1 rounded font-medium transition-all ${
                      activePreviewMode === 'auto' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    🟢 Auto-Label
                  </button>
                  <button
                    onClick={() => setActivePreviewMode('review')}
                    className={`px-2.5 py-1 rounded font-medium transition-all ${
                      activePreviewMode === 'review' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    🔴 Human Review
                  </button>
                </div>
              </div>

              {/* Side by side comparison cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. EASY CASE -> 98% AUTO-LABEL */}
                {(activePreviewMode === 'both' || activePreviewMode === 'auto') && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          AI Does The Easy Work
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        98% Confident → AUTO-LABEL
                      </span>
                    </div>

                    <div className="relative rounded-lg overflow-hidden border border-emerald-500/40 bg-black aspect-video">
                      <img
                        src="/predictions/00f205aea57febc8e82d4e99a18b1d51.png"
                        alt="Clear rescue car"
                        className="w-full h-full object-cover opacity-90"
                      />
                      {/* Bounding box overlay */}
                      <div className="absolute inset-0 p-4 flex items-center justify-center">
                        <div className="w-3/4 h-3/4 border-2 border-emerald-400 bg-emerald-500/20 rounded-md relative shadow-lg shadow-emerald-500/20">
                          <div className="absolute -top-7 left-0 px-2 py-0.5 rounded bg-emerald-600 text-white text-xs font-mono font-bold flex items-center gap-1 shadow">
                            <span>🚗 VEHICLE</span>
                            <span className="text-emerald-200">98%</span>
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/80 backdrop-blur-md text-[11px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Pseudo-label accepted without manual review</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. HARD CASE -> 43% HUMAN REVIEW */}
                {(activePreviewMode === 'both' || activePreviewMode === 'review') && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-4 space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping"></span>
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                          Humans Handle The Hard Cases
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        43% Confident → HUMAN REVIEW
                      </span>
                    </div>

                    <div className="relative rounded-lg overflow-hidden border border-rose-500/40 bg-black aspect-video">
                      <img
                        src="/predictions/09e62858a678e6fcea8bced21d03ab1c.png"
                        alt="Collapsed structure"
                        className="w-full h-full object-cover opacity-90"
                      />
                      {/* Bounding box overlay with uncertainty highlight */}
                      <div className="absolute inset-0 p-4 flex items-center justify-center">
                        <div className="w-4/5 h-4/5 border-2 border-dashed border-rose-400 bg-rose-500/20 rounded-md relative shadow-lg shadow-rose-500/20">
                          <div className="absolute -top-7 left-0 px-2 py-0.5 rounded bg-rose-600 text-white text-xs font-mono font-bold flex items-center gap-1 shadow">
                            <span>🏢 BUILDING?</span>
                            <span className="text-rose-200">43%</span>
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/80 backdrop-blur-md text-[11px] font-mono text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>High Uncertainty + Rare Collapsed Geometry</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Impact Cards */}
      <section className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">
            Validated Active Learning Impact Metrics
          </h2>
          <p className="text-xs text-zinc-500">
            Measured across 10,000 real-world computer vision disaster response imagery
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 — Human Effort */}
          <div
            id="impact-card-effort"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-3 relative overflow-hidden group hover:border-blue-500/40 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Human Effort Saved
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-4xl font-extrabold font-mono text-emerald-400">
                64%
              </div>
              <p className="text-xs text-zinc-400">
                vs. traditional 100% full manual annotation
              </p>
            </div>

            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full w-[64%]"></div>
            </div>
          </div>

          {/* Card 2 — Auto-label Rate */}
          <div
            id="impact-card-autolabel"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-3 relative overflow-hidden group hover:border-blue-500/40 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Auto-Labeled High-Conf
              </span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Cpu className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-4xl font-extrabold font-mono text-blue-400">
                7,420 <span className="text-lg text-zinc-500">/ 10k</span>
              </div>
              <p className="text-xs text-zinc-400">
                74.2% automatically tagged & verified
              </p>
            </div>

            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full w-[74.2%]"></div>
            </div>
          </div>

          {/* Card 3 — Model Quality */}
          <div
            id="impact-card-modelquality"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-3 relative overflow-hidden group hover:border-blue-500/40 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Model mAP@50 Quality
              </span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-4xl font-extrabold font-mono text-indigo-300 flex items-baseline gap-2">
                86.4%
                <span className="text-xs font-bold font-sans text-emerald-400">
                  ↑ +8.7% this round
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Retains 98% of full manual model benchmark
              </p>
            </div>

            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-400 rounded-full w-[86.4%]"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Chain / Differentiation Box */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
              The LabelLess AI Closed Loop Architecture
            </h3>
            <p className="text-xs text-zinc-400">
              Why active learning outperforms naive auto-labeling and manual annotation
            </p>
          </div>
          <button
            onClick={() => setActiveTab('evolution')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            View Experiments & Proof →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-blue-400">01. INFERENCE</span>
            <h4 className="text-xs font-bold text-zinc-200">YOLOv8 Detection</h4>
            <p className="text-xs text-zinc-400">
              Fast bounding box extraction with raw class probabilities and spatial coordinate tensors.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-emerald-400">02. ROUTING</span>
            <h4 className="text-xs font-bold text-zinc-200">Confidence Separation</h4>
            <p className="text-xs text-zinc-400">
              &gt;85% auto-accepted to dataset; &lt;85% scored for active review priority.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-amber-400">03. SMART QUEUE</span>
            <h4 className="text-xs font-bold text-zinc-200">Value Ranking</h4>
            <p className="text-xs text-zinc-400">
              Combines uncertainty, embedding diversity, and rare class imbalance to pick top gradient samples.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-indigo-400">04. EVOLUTION</span>
            <h4 className="text-xs font-bold text-zinc-200">Retrain & Improve</h4>
            <p className="text-xs text-zinc-400">
              Human corrections feed back into next active round, improving future auto-label rates.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
