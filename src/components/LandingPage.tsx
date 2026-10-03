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
  Check
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
        <div className="space-y-4">
          <h2 className="section-label text-[11px] uppercase tracking-widest text-gray-500 font-bold">FEATURES</h2>
          <h3 className="text-3xl font-bold text-gray-900">
            Detect. Route. Review. <span className="text-gray-400">Build loops for annotation.</span>
          </h3>
        </div>

        <div className="space-y-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h4 className="text-2xl font-bold text-gray-900">Smart Review Queue</h4>
              <p className="text-gray-500 leading-relaxed">
                AI ranks images by uncertainty, diversity & class rarity. Routes only the hardest cases to humans, minimizing redundant work while maximizing learning.
              </p>
            </div>
            <div className="aspect-video bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center shadow-sm">
              <Layers className="w-12 h-12 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="aspect-video bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center shadow-sm order-2 md:order-1">
              <TrendingUp className="w-12 h-12 text-gray-400" />
            </div>
            <div className="space-y-4 order-1 md:order-2">
              <h4 className="text-2xl font-bold text-gray-900">Active Learning Loop</h4>
              <p className="text-gray-500 leading-relaxed">
                Each round of human feedback improves the model. In our tests, 5 rounds took mAP from 60.9% to 88.4%, drastically reducing necessary human input.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Section 4 - Results */}
      <motion.section {...fadeInUp} className="px-4 md:px-8 max-w-7xl mx-auto space-y-10">
        <div className="space-y-4">
          <h2 className="section-label text-[11px] uppercase tracking-widest text-gray-500 font-bold">RESULTS</h2>
          <h3 className="text-3xl font-bold text-gray-900">
            Real experiment results. <span className="text-gray-400">Not just promises.</span>
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
