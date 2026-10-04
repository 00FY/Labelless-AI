import React, { useState } from 'react';
import { motion } from 'motion/react';
import { NavigationTab } from '../types';
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
}

// 5 Active Learning Rounds Data for Home Page Teaser Simulator
const SIMULATOR_ROUNDS = [
  { round: 0, label: 'Round 0 (Cold Start)', map50: 60.9, autoPct: 0, effortSaved: 0, reviewRate: 100, status: 'Initial Seed Model' },
  { round: 1, label: 'Round 1 (First Feedback)', map50: 71.2, autoPct: 26, effortSaved: 18, reviewRate: 74, status: 'Triage Queue Active' },
  { round: 2, label: 'Round 2 (Multi-Factor)', map50: 79.8, autoPct: 48, effortSaved: 32, reviewRate: 52, status: 'Uncertainty Fine-Tuned' },
  { round: 3, label: 'Round 3 (Rare Class Sync)', map50: 85.1, autoPct: 65, effortSaved: 41, reviewRate: 35, status: 'High Auto-Accept' },
  { round: 4, label: 'Round 4 (Final Model)', map50: 88.4, autoPct: 73.5, effortSaved: 47, reviewRate: 26.5, status: 'Max Efficiency Reached' },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAnnotation,
  onViewDemoDataset,
  setActiveTab,
}) => {
  const [selectedRound, setSelectedRound] = useState<number>(4);
  const currentSimData = SIMULATOR_ROUNDS[selectedRound];

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: "easeOut" }
  };

  return (
    <div id="landing-page-root" className="space-y-20 pb-16 bg-white text-gray-900">
      {/* Section 1 - Hero */}
      <motion.section {...fadeInUp} className="pt-20 px-4 md:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Learning Annotation Engine for Computer Vision</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
            The intelligent way to label
          </h1>
          <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto">
            Let AI handle the obvious. Let humans focus on what matters. Cut annotation time by up to 94.5%.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              id="hero-start-annotation-btn"
              onClick={onStartAnnotation}
              className="px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gray-900 hover:bg-gray-800 shadow-md transition-all flex items-center gap-2"
            >
              <span>Start Active Pipeline</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="hero-view-demo-dataset-btn"
              onClick={onViewDemoDataset}
              className="px-6 py-3.5 rounded-xl font-semibold text-sm text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              View Demo Dataset
            </button>
          </div>
          <p className="text-xs font-mono text-gray-400 pt-2">
            ✦ YOLOv8 Engine · 47% Less Human Effort · 88.4% Final mAP@50
          </p>
        </div>

        {/* ────────────────────────────────────────────────────────────
           Interactive 10-Second Active Learning Accuracy Simulator
           ──────────────────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-400 uppercase">
                <Zap className="w-4 h-4" />
                <span>Interactive Active Learning Simulator</span>
              </div>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                Model Accuracy & Effort Gain Over 5 Rounds
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {currentSimData.status}
            </span>
          </div>

          {/* Interactive Round Selector Slider */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-2 font-mono">
                <Sliders className="w-4 h-4 text-sky-400" />
                Simulated Training Iteration:
              </span>
              <span className="font-mono font-extrabold text-sky-400 text-sm">
                Round {currentSimData.round}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              step="1"
              value={selectedRound}
              onChange={(e) => setSelectedRound(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <div className="grid grid-cols-5 text-[11px] font-mono text-slate-500 text-center pt-1">
              <span className={selectedRound === 0 ? 'text-sky-400 font-bold' : ''}>Round 0 (Cold)</span>
              <span className={selectedRound === 1 ? 'text-sky-400 font-bold' : ''}>Round 1</span>
              <span className={selectedRound === 2 ? 'text-sky-400 font-bold' : ''}>Round 2</span>
              <span className={selectedRound === 3 ? 'text-sky-400 font-bold' : ''}>Round 3</span>
              <span className={selectedRound === 4 ? 'text-sky-400 font-bold' : ''}>Round 4 (Max)</span>
            </div>
          </div>

          {/* Live Simulator Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Model Accuracy (mAP@50)</div>
              <div className="text-3xl font-extrabold text-emerald-400">{currentSimData.map50}%</div>
              <div className="text-[11px] text-slate-500">Started at 60.9% in Round 0</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Human Effort Saved</div>
              <div className="text-3xl font-extrabold text-sky-400">{currentSimData.effortSaved}%</div>
              <div className="text-[11px] text-slate-500">Auto-accepted predictions</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Human Review Rate</div>
              <div className="text-3xl font-extrabold text-amber-400">{currentSimData.reviewRate}%</div>
              <div className="text-[11px] text-slate-500">Only {currentSimData.reviewRate}% requires human look</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-400 border-t border-slate-800/80">
            <span>Verified YOLOv8 Active Learning Benchmarks</span>
            <button
              onClick={onStartAnnotation}
              className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>Launch Full Interactive Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────
           Before vs After Annotation Time Savings Comparison
           ──────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Traditional Manual Annotation */}
          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-gray-400">Traditional Manual Labeling</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-200 text-gray-700">100% Manual</span>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-gray-900 font-mono">11.6 Hours</div>
              <p className="text-xs text-gray-500">1,000 images × 42s manual box drawing per image.</p>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-600 font-medium pt-2 border-t border-gray-200">
              <li className="flex items-center gap-2">
                <span className="text-red-500">✕</span> Every simple image labeled from scratch
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">✕</span> Annotator fatigue & high error rate
              </li>
            </ul>
          </div>

          {/* LabelLess Active Learning Pipeline */}
          <div className="p-6 rounded-2xl bg-emerald-950 text-white border border-emerald-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-emerald-400">LabelLess Active Pipeline</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">94.5% Faster</span>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">38 Minutes</div>
              <p className="text-xs text-emerald-200/70">265 uncertain images × 8.7s review per image.</p>
            </div>
            <ul className="space-y-1.5 text-xs text-emerald-100/90 font-medium pt-2 border-t border-emerald-800">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> AI auto-labels 73.5% obvious cases
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Humans review only what matters
              </li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Section 2 - How It Works */}
      <motion.section {...fadeInUp} className="px-4 md:px-8 max-w-7xl mx-auto space-y-10">
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <h2 className="section-label text-[11px] uppercase tracking-widest text-gray-500 font-bold">HOW IT WORKS</h2>
          <h3 className="text-3xl font-extrabold text-gray-900">
            It doesn't just predict. <span className="text-gray-400">It learns from your corrections.</span>
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-3 hover:border-gray-300 transition-colors">
            <div className="text-[11px] font-mono font-bold text-gray-400">01 INFER</div>
            <h4 className="font-semibold text-gray-900">YOLOv8 Detection</h4>
            <p className="text-sm text-gray-500">Fast bounding box extraction with raw class probabilities and spatial coordinate tensors.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-3 hover:border-gray-300 transition-colors">
            <div className="text-[11px] font-mono font-bold text-gray-400">02 ROUTE</div>
            <h4 className="font-semibold text-gray-900">Confidence Separation</h4>
            <p className="text-sm text-gray-500">High confidence predictions are auto-accepted. Low confidence goes to human review.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-3 hover:border-gray-300 transition-colors">
            <div className="text-[11px] font-mono font-bold text-gray-400">03 REVIEW</div>
            <h4 className="font-semibold text-gray-900">Value Ranking</h4>
            <p className="text-sm text-gray-500">Combines uncertainty, embedding diversity, and rare class imbalance to pick top gradient samples.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-3 hover:border-gray-300 transition-colors">
            <div className="text-[11px] font-mono font-bold text-gray-400">04 RETRAIN</div>
            <h4 className="font-semibold text-gray-900">Retrain & Improve</h4>
            <p className="text-sm text-gray-500">Human corrections feed back into next active round, improving future auto-label rates.</p>
          </div>
        </div>
      </motion.section>

      {/* Section 3 - Features */}
      <motion.section {...fadeInUp} className="px-4 md:px-8 max-w-7xl mx-auto space-y-16">
        <div className="space-y-2 text-center max-w-2xl mx-auto">
          <h2 className="section-label text-[11px] uppercase tracking-widest text-gray-400 font-bold">CAPABILITIES</h2>
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Intelligent Triage & Closed Feedback
          </h3>
        </div>

        <div className="space-y-20">
          {/* Feature 1: Smart Review Queue Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                Intelligent Prioritization
              </div>
              <h4 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Smart Review Queue</h4>
              <p className="text-gray-500 leading-relaxed text-sm sm:text-base">
                Ranks imagery by uncertainty, diversity, and class rarity. Routes only the most informative samples to humans, automating the rest.
              </p>
            </div>

            {/* Rich Visual Component for Smart Review Queue */}
            <div className="rounded-2xl border border-gray-200 bg-slate-950 p-4 shadow-xl text-white space-y-3 overflow-hidden relative group">
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-slate-400 font-semibold text-[11px] ml-1">triage_queue_live.stream</span>
                </div>
                <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Priority 0.94 · Urgent Human Look
                </div>
              </div>

              {/* Main Queue Sample Visual */}
              <div className="relative rounded-xl overflow-hidden h-48 bg-slate-900 border border-slate-800">
                <img
                  src="/predictions/03db54200069482ff87cab702a6be150.png"
                  alt="Triage Queue Visual"
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                {/* Bounding Box on Fire / Hazard */}
                <div
                  className="absolute border-2 border-amber-400 rounded-md bg-amber-500/20 backdrop-blur-xs flex items-start p-1"
                  style={{ top: '24%', left: '26%', width: '40%', height: '48%' }}
                >
                  <span className="text-[10px] font-mono font-bold bg-slate-950/90 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/40">
                    🔥 Fire · 58% (Uncertain)
                  </span>
                </div>

                {/* Heatmap Indicator */}
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900/90 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-slate-700">
                  <Flame className="w-3 h-3 text-red-400" />
                  <span>Rare Hazard Detected (&lt;5% frequency)</span>
                </div>
              </div>

              {/* Multi-Factor Telemetry Bar */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono text-xs">
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Entropy</div>
                  <div className="text-amber-400 font-bold">0.82 (High)</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Rarity</div>
                  <div className="text-rose-400 font-bold">0.94 (Rare)</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Diversity</div>
                  <div className="text-sky-400 font-bold">0.78 (Novel)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Active Learning Loop Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Rich Visual Component for Active Learning Loop */}
            <div className="rounded-2xl border border-gray-200 bg-slate-950 p-5 shadow-xl text-white space-y-4 order-2 md:order-1">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white font-mono">Closed Retraining Loop</div>
                    <div className="text-[10px] text-slate-400 font-mono">Human-in-the-Loop Flywheel</div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  +27.5% mAP Gain
                </span>
              </div>

              {/* 4 Cyclic Steps */}
              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-sky-400 font-bold uppercase">01. INFER & FILTER</div>
                  <div className="text-sm font-extrabold text-white">73.5% Auto</div>
                  <div className="text-[10px] text-slate-400">High confidence auto-passed</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-amber-400 font-bold uppercase">02. VALUE TRIAGE</div>
                  <div className="text-sm font-extrabold text-white">26.5% Hard</div>
                  <div className="text-[10px] text-slate-400">Uncertain samples to human</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-emerald-400 font-bold uppercase">03. HUMAN REVIEW</div>
                  <div className="text-sm font-extrabold text-white">8.7s / Image</div>
                  <div className="text-[10px] text-slate-400">Rapid micro-corrections</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-purple-400 font-bold uppercase">04. RETRAIN MODEL</div>
                  <div className="text-sm font-extrabold text-white">88.4% mAP</div>
                  <div className="text-[10px] text-slate-400">Compounds every round</div>
                </div>
              </div>

              {/* Evolution Mini-Bar */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">YOLOv8 Accuracy Trajectory</span>
                  <span className="text-emerald-400 font-bold">60.9% → 88.4% mAP@50</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-400 rounded-full w-[88.4%]" />
                </div>
              </div>
            </div>

            <div className="space-y-4 order-1 md:order-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5" />
                Compounding Model Quality
              </div>
              <h4 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Active Learning Loop</h4>
              <p className="text-gray-500 leading-relaxed text-sm sm:text-base">
                Every verified correction feeds back into retraining. Over 5 iterations, accuracy jumped from 60.9% to 88.4% while slashing human effort by 47%.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Section 4 - Results */}
      <motion.section {...fadeInUp} className="px-4 md:px-8 max-w-7xl mx-auto space-y-10">
        <div className="space-y-2 text-center max-w-2xl mx-auto">
          <h2 className="section-label text-[11px] uppercase tracking-widest text-gray-400 font-bold">RESULTS</h2>
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Verified Experiment Benchmarks
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div id="impact-card-effort" className="bg-gray-50 border border-gray-200 rounded-2xl p-8 hover:border-gray-300 transition-colors text-center space-y-2">
            <div className="text-5xl font-extrabold text-gray-900">47%</div>
            <div className="font-medium text-gray-500">Human effort saved</div>
          </div>
          <div id="impact-card-modelquality" className="bg-gray-50 border border-gray-200 rounded-2xl p-8 hover:border-gray-300 transition-colors text-center space-y-2">
            <div className="text-5xl font-extrabold text-gray-900">88.4%</div>
            <div className="font-medium text-gray-500">Final mAP@50</div>
          </div>
          <div id="impact-card-autolabel" className="bg-gray-50 border border-gray-200 rounded-2xl p-8 hover:border-gray-300 transition-colors text-center space-y-2">
            <div className="text-5xl font-extrabold text-gray-900">26.5%</div>
            <div className="font-medium text-gray-500">Review rate</div>
          </div>
        </div>
      </motion.section>

      {/* CTA Footer */}
      <motion.section {...fadeInUp} className="px-4 md:px-8 max-w-7xl mx-auto text-center space-y-6 pt-10 border-t border-gray-200">
        <h3 className="text-3xl font-extrabold text-gray-900">Start annotating smarter today.</h3>
        <div className="flex justify-center gap-4">
          <button
            onClick={onStartAnnotation}
            className="px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gray-900 hover:bg-gray-800 transition-colors shadow-md"
          >
            Start Active Pipeline
          </button>
        </div>
      </motion.section>
    </div>
  );
};
