import React, { useState } from 'react';
import { motion } from 'motion/react';
import { DatasetItem, NavigationTab } from '../types';
import {
  MEASURED_RUNS,
  getRun,
  pct,
  pts,
  getPoolRouting,
} from '../data/measuredResults';
import {
  CheckCircle2,
  AlertTriangle,
  Layers,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Zap,
  ArrowRight,
  Clock,
  Sliders,
  Check,
  Flame,
  RefreshCw,
  Eye
} from 'lucide-react';

interface LandingPageProps {
  onStartAnnotation: () => void;
  onViewDemoDataset: () => void;
  setActiveTab: (tab: NavigationTab) => void;
  datasetItems: DatasetItem[];
}

// Measured runs shown in the hero comparison (see src/data/measuredResults.ts)
const SHOWCASE_RUNS = MEASURED_RUNS;

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAnnotation,
  onViewDemoDataset,
  setActiveTab,
  datasetItems,
}) => {
  const routing = getPoolRouting(datasetItems);
  const [selectedRun, setSelectedRun] = useState<number>(SHOWCASE_RUNS.length - 1);
  const currentRun = SHOWCASE_RUNS[selectedRun];
  const seedRun = getRun('seed');

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: "easeOut" }
  };

  return (
    <div id="landing-page-root" className="space-y-24 pb-20 bg-slate-50 text-slate-900 bg-grid-pattern relative min-h-screen">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-radial-glow pointer-events-none opacity-50" />

      {/* Section 1 - Hero */}
      <motion.section {...fadeInUp} className="pt-16 px-4 md:px-8 max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono-code tracking-wide shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold">ACTIVE LEARNING TRIAGE ENGINE FOR COMPUTER VISION</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold text-slate-900 tracking-tight leading-[1.08]">
            The intelligent way <br className="hidden sm:block" />
            to <span className="font-serif-editorial italic font-normal text-emerald-600 font-serif">label datasets</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
            Let AI handle the obvious predictions. Humans focus on what matters—reviewing only the images where model uncertainty is highest.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              id="hero-start-annotation-btn"
              onClick={onStartAnnotation}
              className="px-7 py-4 rounded-xl font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all flex items-center gap-2.5 active:scale-95 cursor-pointer"
            >
              <span>Start Active Pipeline</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
            <button
              id="hero-view-demo-dataset-btn"
              onClick={onViewDemoDataset}
              className="px-7 py-4 rounded-xl font-semibold text-sm text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 hover:text-slate-900 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              View Demo Dataset
            </button>
          </div>
          
          <p className="text-xs font-mono-code text-slate-500 pt-2">
            ✦ YOLOv8n · {pct(routing.autoFraction)} of pool auto-routed · {pct(getRun('labelless').mAP50)} mAP@50 after Round 1 (measured)
          </p>
        </div>

        {/* Interactive Strategy Simulator */}
        <div className="max-w-4xl mx-auto p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono-code font-bold text-emerald-700 uppercase tracking-widest">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Measured Strategy Comparison</span>
              </div>
              <h3 className="text-lg font-display font-extrabold text-slate-900 mt-1">
                Same 100-label budget, different selection strategy
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono-code font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {currentRun.sourceFile}
            </span>
          </div>

          {/* Strategy selector */}
          <div className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-2 font-mono-code">
                <Sliders className="w-4 h-4 text-emerald-600" />
                Selection strategy:
              </span>
              <span className="font-mono-code font-extrabold text-emerald-700 text-sm">{currentRun.label}</span>
            </div>
            <input
              type="range"
              min="0"
              max={SHOWCASE_RUNS.length - 1}
              step="1"
              value={selectedRun}
              onChange={(e) => setSelectedRun(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="grid grid-cols-4 text-[11px] font-mono-code text-slate-500 text-center pt-1">
              {SHOWCASE_RUNS.map((run, idx) => (
                <span key={run.method} className={selectedRun === idx ? 'text-emerald-700 font-bold' : ''}>
                  {run.label}
                </span>
              ))}
            </div>
          </div>

          {/* Measured metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono-code">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Model Accuracy (mAP@50)</div>
              <div className="text-3xl font-extrabold text-emerald-600">{pct(currentRun.mAP50)}</div>
              <div className="text-[11px] text-slate-500">
                {currentRun.round === 0 ? 'Seed model, no extra labels' : `${pts(currentRun.mAP50, seedRun.mAP50)} vs seed`}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Fire AP@50</div>
              <div className="text-3xl font-extrabold text-sky-600">{pct(currentRun.fireAP50)}</div>
              <div className="text-[11px] text-slate-500">
                {currentRun.round === 0 ? 'Seed model' : `${pts(currentRun.fireAP50, seedRun.fireAP50)} vs seed`}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Human Labels Added</div>
              <div className="text-3xl font-extrabold text-amber-600">{currentRun.labelsAdded}</div>
              <div className="text-[11px] text-slate-500">Equal budget for every strategy</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs font-mono-code text-slate-500 border-t border-slate-200">
            <span>Measured on held-out test split · single run, single seed</span>
            <button
              onClick={onStartAnnotation}
              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Launch Interactive Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Time Savings Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Traditional Manual Annotation */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-code font-bold uppercase text-slate-500">Traditional Manual Labeling</span>
              <span className="px-2.5 py-1 rounded text-[10px] font-mono-code font-bold bg-slate-100 text-slate-600">Every image</span>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-display font-extrabold text-slate-900">{routing.poolImages} images</div>
              <p className="text-xs text-slate-500">Every pool image goes to a human annotator.</p>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 font-medium pt-3 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <span className="text-rose-500 font-bold">✕</span> Every simple image labeled from scratch
              </li>
              <li className="flex items-center gap-2">
                <span className="text-rose-500 font-bold">✕</span> Annotator fatigue & high error rate
              </li>
            </ul>
          </div>

          {/* LabelLess Active Pipeline */}
          <div className="p-7 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-code font-bold uppercase text-emerald-800">LabelLess Active Pipeline</span>
              <span className="px-2.5 py-1 rounded text-[10px] font-mono-code font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">{pct(routing.humanFraction)} to humans</span>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-display font-extrabold text-emerald-700">{routing.sentToHuman} images</div>
              <p className="text-xs text-emerald-900/80">Only images above the priority threshold (0.58) reach a human.</p>
            </div>
            <ul className="space-y-2 text-xs text-emerald-900 font-medium pt-3 border-t border-emerald-200/80">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> {pct(routing.autoFraction)} routed to auto-labeling
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> Humans review only what matters
              </li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Section 2 - How It Works */}
      <motion.section {...fadeInUp} className="px-4 md:px-8 max-w-7xl mx-auto space-y-12">
        <div className="space-y-3 text-center max-w-3xl mx-auto">
          <h2 className="section-label text-[11px] font-mono-code uppercase tracking-widest text-emerald-700 font-bold">HOW IT WORKS</h2>
          <h3 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900">
            It doesn't just predict. <span className="font-serif-editorial italic font-normal text-slate-600">It learns from your corrections.</span>
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 hover:border-slate-300 shadow-xs transition-colors">
            <div className="text-[11px] font-mono-code font-bold text-slate-400">01 INFER</div>
            <h4 className="font-display font-bold text-slate-900 text-base">YOLOv8 Detection</h4>
            <p className="text-xs text-slate-600 leading-relaxed">Fast bounding box extraction with raw class probabilities and spatial coordinate tensors.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 hover:border-slate-300 shadow-xs transition-colors">
            <div className="text-[11px] font-mono-code font-bold text-slate-400">02 ROUTE</div>
            <h4 className="font-display font-bold text-slate-900 text-base">Confidence Separation</h4>
            <p className="text-xs text-slate-600 leading-relaxed">High confidence predictions are auto-accepted. Low confidence goes to human review.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 hover:border-slate-300 shadow-xs transition-colors">
            <div className="text-[11px] font-mono-code font-bold text-slate-400">03 REVIEW</div>
            <h4 className="font-display font-bold text-slate-900 text-base">Value Ranking</h4>
            <p className="text-xs text-slate-600 leading-relaxed">Combines model uncertainty, class rarity, and scene diversity into one priority score.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 hover:border-slate-300 shadow-xs transition-colors">
            <div className="text-[11px] font-mono-code font-bold text-slate-400">04 RETRAIN</div>
            <h4 className="font-display font-bold text-slate-900 text-base">Retrain & Improve</h4>
            <p className="text-xs text-slate-600 leading-relaxed">Human corrections feed back into next active round, improving future auto-label rates.</p>
          </div>
        </div>
      </motion.section>

      {/* Section 3 - Features */}
      <motion.section {...fadeInUp} className="px-4 md:px-8 max-w-7xl mx-auto space-y-20">
        <div className="space-y-3 text-center max-w-2xl mx-auto">
          <h2 className="section-label text-[11px] font-mono-code uppercase tracking-widest text-emerald-700 font-bold">CAPABILITIES</h2>
          <h3 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
            Intelligent Triage & Closed Feedback
          </h3>
        </div>

        <div className="space-y-24">
          {/* Feature 1: Smart Review Queue Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono-code uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Intelligent Prioritization
              </div>
              <h4 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Smart Review Queue</h4>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                Ranks imagery by uncertainty, diversity, and class rarity. Routes only the most informative samples to humans, automating the rest.
              </p>
            </div>

            {/* Rich Visual Component for Smart Review Queue */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl text-slate-900 space-y-4 overflow-hidden relative group">
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono-code">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-slate-500 font-semibold text-[11px] ml-1">triage_queue_live.stream</span>
                </div>
                <div className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Example #0128 · Priority 0.71 · Critical
                </div>
              </div>

              {/* Main Queue Sample Visual */}
              <div className="relative rounded-xl overflow-hidden h-52 bg-slate-100 border border-slate-200">
                <img
                  src="/predictions/03db54200069482ff87cab702a6be150.png"
                  alt="Triage Queue Visual"
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.visibility = 'hidden';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />

                {/* Bounding Box on Fire / Hazard */}
                <div
                  className="absolute border-2 border-amber-500 rounded-md bg-amber-500/20 backdrop-blur-xs flex items-start p-1"
                  style={{ top: '24%', left: '26%', width: '40%', height: '48%' }}
                >
                  <span className="text-[10px] font-mono-code font-bold bg-slate-900/90 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/40">
                    Smoke · 26% (Uncertain)
                  </span>
                </div>

                {/* Heatmap Indicator */}
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-md text-[10px] font-mono-code text-slate-800 border border-slate-200 shadow-xs">
                  <Flame className="w-3 h-3 text-rose-500" />
                  <span>Rare class in current predictions</span>
                </div>
              </div>

              {/* Multi-Factor Telemetry Bar */}
              <div className="grid grid-cols-3 gap-2.5 text-center pt-1 font-mono-code text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase">Uncertainty</div>
                  <div className="text-amber-600 font-bold text-sm">0.74</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase">Rarity</div>
                  <div className="text-rose-600 font-bold text-sm">0.80</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase">Diversity</div>
                  <div className="text-sky-600 font-bold text-sm">0.35</div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Active Learning Loop Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Rich Visual Component for Active Learning Loop */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl text-slate-900 space-y-4 order-2 md:order-1">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 font-mono-code">Closed Retraining Loop</div>
                    <div className="text-[10px] text-slate-500 font-mono-code">Human-in-the-Loop Flywheel</div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {pts(getRun('labelless').mAP50, seedRun.mAP50)} mAP in Round 1
                </span>
              </div>

              {/* 4 Cyclic Steps */}
              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono-code">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[10px] text-sky-700 font-bold uppercase">01. INFER & FILTER</div>
                  <div className="text-sm font-extrabold text-slate-900">{pct(routing.autoFraction)} Auto</div>
                  <div className="text-[10px] text-slate-500">Priority below 0.58</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[10px] text-amber-700 font-bold uppercase">02. VALUE TRIAGE</div>
                  <div className="text-sm font-extrabold text-slate-900">{pct(routing.humanFraction)} Hard</div>
                  <div className="text-[10px] text-slate-500">Uncertain samples to human</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[10px] text-emerald-700 font-bold uppercase">03. HUMAN REVIEW</div>
                  <div className="text-sm font-extrabold text-slate-900">Accept · Correct · Reject</div>
                  <div className="text-[10px] text-slate-500">Saved for retraining</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[10px] text-purple-700 font-bold uppercase">04. RETRAIN MODEL</div>
                  <div className="text-sm font-extrabold text-slate-900">{pct(getRun('labelless').mAP50)} mAP</div>
                  <div className="text-[10px] text-slate-500">After Round 1 (measured)</div>
                </div>
              </div>

              {/* Evolution Mini-Bar */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between text-[11px] font-mono-code">
                  <span className="text-slate-500">Measured mAP@50, seed → Round 1</span>
                  <span className="text-emerald-700 font-bold">{pct(seedRun.mAP50)} → {pct(getRun('labelless').mAP50)}</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-500 rounded-full" style={{ width: pct(getRun('labelless').mAP50) }} />
                </div>
              </div>
            </div>

            <div className="space-y-5 order-1 md:order-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono-code uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                Compounding Model Quality
              </div>
              <h4 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Active Learning Loop</h4>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                Every verified correction feeds back into retraining. In the first measured round, 100 LabelLess-selected labels took mAP@50 from {pct(seedRun.mAP50)} to {pct(getRun('labelless').mAP50)} and Fire AP from {pct(seedRun.fireAP50)} to {pct(getRun('labelless').fireAP50)}.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Section 4 - Results */}
      <motion.section {...fadeInUp} className="px-4 md:px-8 max-w-7xl mx-auto space-y-12">
        <div className="space-y-3 text-center max-w-2xl mx-auto">
          <h2 className="section-label text-[11px] font-mono-code uppercase tracking-widest text-emerald-700 font-bold">RESULTS</h2>
          <h3 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight">
            Measured Experiment Results
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div id="impact-card-effort" className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-slate-300 shadow-xs transition-all text-center space-y-3">
            <div className="text-5xl font-display font-extrabold text-emerald-600">{pts(getRun('labelless').fireAP50, getRun('random').fireAP50)}</div>
            <div className="font-medium text-xs font-mono-code text-slate-500 uppercase tracking-wide">Fire AP@50 vs Random (same budget)</div>
          </div>
          <div id="impact-card-modelquality" className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-slate-300 shadow-xs transition-all text-center space-y-3">
            <div className="text-5xl font-display font-extrabold text-sky-600">{pct(getRun('labelless').mAP50)}</div>
            <div className="font-medium text-xs font-mono-code text-slate-500 uppercase tracking-wide">mAP@50 after Round 1</div>
          </div>
          <div id="impact-card-autolabel" className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-slate-300 shadow-xs transition-all text-center space-y-3">
            <div className="text-5xl font-display font-extrabold text-amber-600">{pct(routing.humanFraction)}</div>
            <div className="font-medium text-xs font-mono-code text-slate-500 uppercase tracking-wide">Of pool routed to human review</div>
          </div>
        </div>
      </motion.section>

      {/* CTA Footer */}
      <motion.section {...fadeInUp} className="px-4 md:px-8 max-w-7xl mx-auto text-center space-y-6 pt-12 border-t border-slate-200">
        <h3 className="text-3xl font-display font-extrabold text-slate-900">Start annotating smarter today.</h3>
        <div className="flex justify-center gap-4">
          <button
            onClick={onStartAnnotation}
            className="px-8 py-4 rounded-xl font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Start Active Pipeline
          </button>
        </div>
      </motion.section>
    </div>
  );
};
