import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ActiveLearningRound, DatasetItem, NavigationTab } from '../types';
import { MEASURED_RUNS, getPoolRouting, getRun, pct, pts } from '../data/measuredResults';
import { InteractiveRetrainingMesh3D } from './InteractiveRetrainingMesh3D';
import {
  TrendingUp,
  Zap,
  CheckCircle2,
  RefreshCw,
  Award,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  Clock,
} from 'lucide-react';

interface EvolutionImpactPageProps {
  rounds: ActiveLearningRound[];
  datasetItems: DatasetItem[];
  setActiveTab: (tab: NavigationTab) => void;
}

export const EvolutionImpactPage: React.FC<EvolutionImpactPageProps> = ({
  rounds,
  datasetItems,
  setActiveTab,
}) => {
  const routing = getPoolRouting(datasetItems);
  const [selectedRoundNum, setSelectedRoundNum] = useState<number>(rounds[rounds.length - 1]?.round ?? 0);

  const selectedRound = rounds.find((r) => r.round === selectedRoundNum) || rounds[rounds.length - 1];

  const seedRun = getRun('seed');
  const labellessRun = getRun('labelless');
  const randomRun = getRun('random');
  const [showNextRoundHelp, setShowNextRoundHelp] = useState(false);
  const nextRound = (rounds[rounds.length - 1]?.round ?? 0) + 1;

  return (
    <div id="evolution-impact-page-root" className="space-y-10 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Model Evolution & Annotation Impact
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-gray-100 text-gray-600 border border-gray-200">
              Active Learning Loop
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            How much human work can LabelLess AI eliminate without sacrificing computer vision model quality?
          </p>
        </div>

        <button
          id="export-model-weights-cta"
          onClick={() => setActiveTab('export')}
          className="px-4 py-2 text-xs font-bold text-white bg-gray-900 hover:bg-gray-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
        >
          <span>Export Retrained Weights</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* BIG IMPACT HERO BANNER */}
      <section
        id="big-impact-banner"
        className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm relative overflow-hidden text-center"
      >
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            Measured Round 1 Result (100-label budget)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center py-2">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
              <div className="text-5xl sm:text-6xl font-black font-mono text-emerald-600">
                {pts(labellessRun.fireAP50, randomRun.fireAP50)}
              </div>
              <div className="text-sm font-bold uppercase tracking-wider text-gray-900">
                Fire AP@50 vs Random
              </div>
              <p className="text-xs text-gray-500">
                {pct(labellessRun.fireAP50)} with LabelLess vs {pct(randomRun.fireAP50)} with Random, same 100 labels
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
              <div className="text-5xl sm:text-6xl font-black font-mono text-blue-600">
                {pct(labellessRun.mAP50)}
              </div>
              <div className="text-sm font-bold uppercase tracking-wider text-gray-900">
                mAP@50 after Round 1
              </div>
              <p className="text-xs text-gray-500">
                {pts(labellessRun.mAP50, seedRun.mAP50)} vs seed · Random {pct(randomRun.mAP50)} · Confidence-only {pct(getRun('confidence').mAP50)}
              </p>
            </div>
          </div>

          {/* Interactive 3D Model Checkpoint Node */}
          <div className="my-4 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <InteractiveRetrainingMesh3D
              currentRound={selectedRoundNum}
              height="h-64 sm:h-72"
            />
          </div>
        </div>
      </section>

      {/* EVOLUTION TIMELINE */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2 section-label">
              <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
              Active Learning Evolution Timeline
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Visualizing how human corrections compound into superior model checkpoints
            </p>
          </div>

          <button
            id="trigger-retrain-btn"
            onClick={() => setShowNextRoundHelp((v) => !v)}
            className="px-3.5 py-1.5 text-xs font-bold text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>How to run Round {nextRound}</span>
          </button>
        </div>

        {showNextRoundHelp && (
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-2">
            <p>
              Retraining runs offline on a GPU/CPU machine, not in the browser. After reviewing images here, run:
            </p>
            <code className="block p-3 rounded-lg bg-gray-900 text-emerald-300 font-mono">
              python scripts/run_experiment.py --method labelless --round {nextRound} --budget 100
            </code>
            <p>Then re-export results so this page and the Evidence page pick up the new metrics.</p>
          </div>
        )}

        {/* 4 Rounds Flow Chart */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rounds.map((r) => {
            const isSelected = r.round === selectedRoundNum;
            return (
              <div
                key={r.round}
                onClick={() => setSelectedRoundNum(r.round)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-gray-900 border-gray-900 shadow-sm text-white'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Round Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                    ROUND {r.round}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      r.status === 'completed'
                        ? isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
                        : isSelected ? 'bg-white/20 text-white animate-pulse' : 'bg-blue-50 text-blue-700 animate-pulse'
                    }`}
                  >
                    {r.status === 'completed' ? '✓ TRAINED' : '● CURRENT'}
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  <div className={`text-3xl font-extrabold font-mono ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {r.mAP50}% <span className={`text-xs font-sans ${isSelected ? 'text-gray-400' : 'text-gray-500'}`}>mAP@50</span>
                  </div>
                  <p className={`text-[11px] font-mono ${isSelected ? 'text-gray-400' : 'text-gray-500'}`}>
                    YOLOv8n &bull; ~{r.trainingImages.toLocaleString()} training images
                  </p>
                </div>

                {/* Arrow to Next Round */}
                <div className={`pt-2 border-t text-[11px] flex items-center justify-between ${isSelected ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-500'}`}>
                  <span>Labels added this round:</span>
                  <span className={`font-mono font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {r.humanReviewedCount.toLocaleString()} images
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Model Metrics Breakdown & Performance by Class */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Metric Cards */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 section-label">
                Round {selectedRound.round} Overall Metrics
              </h3>
              <span className="text-xs font-mono text-gray-900 font-bold">mAP@50: {selectedRound.mAP50}%</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Precision</div>
                <div className="text-xl font-mono font-bold text-gray-900">{selectedRound.precision}%</div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Recall</div>
                <div className="text-xl font-mono font-bold text-gray-900">{selectedRound.recall}%</div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">F1 Score</div>
                <div className="text-xl font-mono font-bold text-gray-900">{selectedRound.f1Score}%</div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="text-[10px] text-emerald-700 uppercase font-semibold tracking-wider">Training Images</div>
                <div className="text-xl font-mono font-bold text-emerald-700">{selectedRound.trainingImages}</div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Measured on the held-out test split. Round 1 adds 100 LabelLess-selected human labels to the seed set.
            </p>
          </div>
        </div>

        {/* Class Performance Table */}
        <div className="lg:col-span-8 space-y-2">
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 section-label">
                Class-Level Performance Breakdown (Round {selectedRound.round})
              </h3>
              <span className="text-xs text-gray-500 font-medium">4 Disaster Object Categories</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50 text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                  <tr>
                    <th className="px-3.5 py-2.5">Class</th>
                    <th className="px-3.5 py-2.5">Precision</th>
                    <th className="px-3.5 py-2.5">Recall</th>
                    <th className="px-3.5 py-2.5">AP@50</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {selectedRound.classMetrics.map((m) => (
                    <tr key={m.className} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3.5 py-2.5 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }}></div>
                        <span className="font-semibold text-gray-900">{m.className}</span>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-gray-600">{m.precision}%</td>
                      <td className="px-3.5 py-2.5 font-mono text-gray-600">{m.recall}%</td>
                      <td className="px-3.5 py-2.5 font-mono font-bold text-gray-900">{m.ap50}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* THE MOST IMPORTANT EXPERIMENTAL COMPARISON: Human Effort vs Baseline */}
      <section className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-6">
        <div className="border-b border-gray-200 pb-3">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2 section-label">
            <Zap className="w-4 h-4 text-gray-400" />
            Measured Comparison: Selection Strategies at Equal Budget
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Every strategy adds exactly 100 human labels to the same seed model
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Chart 1: Pool routing */}
          <div className="space-y-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                Pool Routing ({routing.poolImages} images)
              </span>
              <span className="text-[10px] text-gray-500 font-bold">Priority threshold 0.58</span>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Sent to human review</span>
                  <span className="font-mono font-bold text-gray-900">
                    {pct(routing.humanFraction)} ({routing.sentToHuman} imgs)
                  </span>
                </div>
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: pct(routing.humanFraction) }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Routed to auto-labelling</span>
                  <span className="font-mono font-bold text-gray-900">
                    {pct(routing.autoFraction)} ({routing.autoLabeled} imgs)
                  </span>
                </div>
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: pct(routing.autoFraction) }}></div>
                </div>
              </div>
              <p className="text-[11px] text-gray-500">
                Auto-label accuracy has not been audited yet, so this is routing, not proven savings.
              </p>
            </div>
          </div>

          {/* Chart 2: Resulting Model Quality (mAP) */}
          <div className="space-y-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                Resulting mAP@50 (bars start at 55%)
              </span>
              <span className="text-[10px] text-gray-500 font-bold">Higher is better</span>
            </div>
            <div className="space-y-3">
              {MEASURED_RUNS.map((run) => {
                const isLabelless = run.method === 'labelless';
                return (
                  <div key={run.method} className={`space-y-1 ${isLabelless ? 'pt-1 border-t border-gray-200' : ''}`}>
                    <div className={`flex justify-between text-xs ${isLabelless ? 'font-bold text-blue-700' : 'text-gray-600'}`}>
                      <span>{run.label}{run.round > 0 ? ` (+${run.labelsAdded} labels)` : ''}</span>
                      <span className="font-mono font-bold">{pct(run.mAP50)}</span>
                    </div>
                    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isLabelless ? 'bg-blue-500' : 'bg-gray-400'}`}
                        style={{ width: `${Math.max(4, ((run.mAP50 - 0.55) / 0.15) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              <p className="text-[11px] text-gray-500">Single run, single seed. Differences of under 1 point are within noise.</p>
            </div>
          </div>
        </div>
      </section>

      {/* "WHY LABELLESS?" COMPARISON MATRIX */}
      <section className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <div className="border-b border-gray-200 pb-3">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 section-label">
            Why LabelLess? Architecture Differentiation
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            How LabelLess AI fundamentally changes the computer vision data engineering workflow
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-gray-200 bg-gray-50 text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
              <tr>
                <th className="px-4 py-3.5 w-1/3">Capability</th>
                <th className="px-4 py-3.5 w-1/3 text-gray-500">Traditional Annotation Tools</th>
                <th className="px-4 py-3.5 w-1/3 text-emerald-800 font-bold bg-emerald-50/50 border-l border-emerald-100">
                  LabelLess AI (Active Pipeline)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium bg-white">
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-gray-900">AI Assistance</td>
                <td className="px-4 py-3.5 text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-bold text-sm">~</span>
                    <span>Limited / Suggestion only</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-emerald-700 font-bold bg-emerald-50/30 border-l border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Pseudo-labels for low-priority images</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-gray-900">Automatic Labels</td>
                <td className="px-4 py-3.5 text-red-600">
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-500 shrink-0" />
                    <span>None (Manual review of 100% data)</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-emerald-700 font-bold bg-emerald-50/30 border-l border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{pct(routing.autoFraction)} of pool routed (below priority 0.58)</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-gray-900">Intelligent Sampling</td>
                <td className="px-4 py-3.5 text-red-600">
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-500 shrink-0" />
                    <span>Arbitrary order / Random sampling</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-emerald-700 font-bold bg-emerald-50/30 border-l border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Uncertainty + Diversity + Rare Class weights</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-gray-900">Human Review Scope</td>
                <td className="px-4 py-3.5 text-gray-500">
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-500 shrink-0" />
                    <span>Everything ({routing.poolImages} images, high fatigue)</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-emerald-700 font-bold bg-emerald-50/30 border-l border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Only high-priority cases ({pct(routing.humanFraction)})</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-gray-900">Continuous Learning</td>
                <td className="px-4 py-3.5 text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-bold text-sm">~</span>
                    <span>Manual re-export & train script offline</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-emerald-700 font-bold bg-emerald-50/30 border-l border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Saved reviews feed the next retraining round</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-gray-900">Effort & Time Measurement</td>
                <td className="px-4 py-3.5 text-red-600">
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-500 shrink-0" />
                    <span>Unmeasured / Blind progress</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-emerald-700 font-bold bg-emerald-50/30 border-l border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Per-image review timer in the workspace</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
