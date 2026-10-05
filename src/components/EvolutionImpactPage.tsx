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
    <div id="evolution-impact-page-root" className="space-y-10 pb-16 max-w-6xl mx-auto text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
              Model Evolution & Annotation Impact
            </h1>
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
              Active Learning Loop
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            How much human work can LabelLess AI eliminate without sacrificing computer vision model quality?
          </p>
        </div>

        <button
          id="export-model-weights-cta"
          onClick={() => setActiveTab('export')}
          className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-all flex items-center gap-2 font-mono-code uppercase tracking-wider cursor-pointer"
        >
          <span>Export Retrained Weights</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* BIG IMPACT HERO BANNER */}
      <section
        id="big-impact-banner"
        className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm relative overflow-hidden text-center"
      >
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none opacity-40" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none opacity-40" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono-code font-bold uppercase tracking-wider shadow-xs">
            <Award className="w-4 h-4 text-emerald-600" />
            Measured Round 1 Result (100-label budget)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center py-2">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-left relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
              <div className="text-4xl sm:text-5xl font-black font-mono-code text-emerald-600 tracking-tight">
                {pts(labellessRun.fireAP50, randomRun.fireAP50)}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider font-mono-code text-slate-800">
                Fire AP@50 vs Random
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {pct(labellessRun.fireAP50)} with LabelLess vs {pct(randomRun.fireAP50)} with Random, same 100 labels
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-left relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full pointer-events-none" />
              <div className="text-4xl sm:text-5xl font-black font-mono-code text-sky-600 tracking-tight">
                {pct(labellessRun.mAP50)}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider font-mono-code text-slate-800">
                mAP@50 after Round 1
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {pts(labellessRun.mAP50, seedRun.mAP50)} vs seed &bull; Random {pct(randomRun.mAP50)} &bull; Conf-only {pct(getRun('confidence').mAP50)}
              </p>
            </div>
          </div>

          {/* Interactive 3D Model Checkpoint Node */}
          <div className="my-4 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900">
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
            <h2 className="text-xs font-bold uppercase tracking-widest font-mono-code text-emerald-700 flex items-center gap-2 section-label">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Active Learning Evolution Timeline
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Visualizing how human corrections compound into superior model checkpoints
            </p>
          </div>

          <button
            id="trigger-retrain-btn"
            onClick={() => setShowNextRoundHelp((v) => !v)}
            className="px-3.5 py-1.5 text-xs font-bold font-mono-code text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>How to run Round {nextRound}</span>
          </button>
        </div>

        {showNextRoundHelp && (
          <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-2 shadow-xs">
            <p className="text-slate-600">
              Retraining runs offline on a GPU/CPU machine, not in the browser. After reviewing images here, run:
            </p>
            <code className="block p-3 rounded-lg bg-slate-50 border border-slate-200 text-emerald-700 font-mono-code">
              python scripts/run_experiment.py --method labelless --round {nextRound} --budget 100
            </code>
            <p className="text-slate-600">Then re-export results so this page and the Evidence page pick up the new metrics.</p>
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
                    ? 'bg-white border-emerald-500 ring-1 ring-emerald-200 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Round Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold font-mono-code uppercase tracking-widest ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>
                    ROUND {r.round}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${
                      r.status === 'completed'
                        ? isSelected ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isSelected ? 'bg-sky-50 text-sky-800 border border-sky-200 animate-pulse' : 'bg-sky-50 text-sky-700 border border-sky-200 animate-pulse'
                    }`}
                  >
                    {r.status === 'completed' ? '✓ TRAINED' : '● CURRENT'}
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  <div className={`text-3xl font-extrabold font-mono-code ${isSelected ? 'text-slate-900' : 'text-slate-800'}`}>
                    {r.mAP50}% <span className="text-xs font-sans text-slate-500">mAP@50</span>
                  </div>
                  <p className="text-[11px] font-mono-code text-slate-500">
                    YOLOv8n &bull; ~{r.trainingImages.toLocaleString()} training images
                  </p>
                </div>

                {/* Arrow to Next Round */}
                <div className={`pt-3 border-t text-[11px] flex items-center justify-between ${isSelected ? 'border-slate-200 text-slate-700' : 'border-slate-100 text-slate-500'}`}>
                  <span>Labels added:</span>
                  <span className={`font-mono-code font-bold ${isSelected ? 'text-emerald-700' : 'text-slate-800'}`}>
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
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs font-bold font-mono-code uppercase tracking-widest text-slate-600 section-label">
                Round {selectedRound.round} Overall Metrics
              </h3>
              <span className="text-xs font-mono-code text-emerald-700 font-bold">mAP@50: {selectedRound.mAP50}%</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-semibold font-mono-code tracking-wider">Precision</div>
                <div className="text-xl font-mono-code font-bold text-slate-900">{selectedRound.precision}%</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-semibold font-mono-code tracking-wider">Recall</div>
                <div className="text-xl font-mono-code font-bold text-slate-900">{selectedRound.recall}%</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-semibold font-mono-code tracking-wider">F1 Score</div>
                <div className="text-xl font-mono-code font-bold text-slate-900">{selectedRound.f1Score}%</div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-[10px] text-emerald-700 uppercase font-semibold font-mono-code tracking-wider">Train Images</div>
                <div className="text-xl font-mono-code font-bold text-emerald-700">{selectedRound.trainingImages}</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Measured on the held-out test split. Round 1 adds 100 LabelLess-selected human labels to the seed set.
            </p>
          </div>
        </div>

        {/* Class Performance Table */}
        <div className="lg:col-span-8 space-y-2">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs font-bold font-mono-code uppercase tracking-widest text-slate-600 section-label">
                Class Breakdown (Round {selectedRound.round})
              </h3>
              <span className="text-xs text-slate-500 font-mono-code">4 Object Categories</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-100 text-[10px] font-mono-code font-extrabold uppercase tracking-widest text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Precision</th>
                    <th className="px-4 py-3">Recall</th>
                    <th className="px-4 py-3">AP@50</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {selectedRound.classMetrics.map((m) => (
                    <tr key={m.className} className="hover:bg-slate-100 transition-colors">
                      <td className="px-4 py-3 flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: m.color }}></div>
                        <span className="font-semibold text-slate-900">{m.className}</span>
                      </td>
                      <td className="px-4 py-3 font-mono-code text-slate-600">{m.precision}%</td>
                      <td className="px-4 py-3 font-mono-code text-slate-600">{m.recall}%</td>
                      <td className="px-4 py-3 font-mono-code font-bold text-emerald-700">{m.ap50}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* THE MOST IMPORTANT EXPERIMENTAL COMPARISON */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-xs font-bold font-mono-code uppercase tracking-widest text-emerald-700 flex items-center gap-2 section-label">
            <Zap className="w-4 h-4 text-emerald-600" />
            Measured Comparison: Selection Strategies at Equal Budget
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Every strategy adds exactly 100 human labels to the same seed model
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Chart 1: Pool routing */}
          <div className="space-y-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono-code uppercase tracking-widest text-slate-800">
                Pool Routing ({routing.poolImages} images)
              </span>
              <span className="text-[10px] text-slate-500 font-mono-code">Priority threshold 0.58</span>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Sent to human review</span>
                  <span className="font-mono-code font-bold text-amber-700">
                    {pct(routing.humanFraction)} ({routing.sentToHuman} imgs)
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" style={{ width: pct(routing.humanFraction) }}></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Routed to auto-labelling</span>
                  <span className="font-mono-code font-bold text-emerald-700">
                    {pct(routing.autoFraction)} ({routing.autoLabeled} imgs)
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: pct(routing.autoFraction) }}></div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Auto-label accuracy has not been audited yet, so this is routing, not proven savings.
              </p>
            </div>
          </div>

          {/* Chart 2: Resulting Model Quality (mAP) */}
          <div className="space-y-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono-code uppercase tracking-widest text-slate-800">
                Resulting mAP@50 (bars start at 55%)
              </span>
              <span className="text-[10px] text-slate-500 font-mono-code">Higher is better</span>
            </div>
            <div className="space-y-3.5">
              {MEASURED_RUNS.map((run) => {
                const isLabelless = run.method === 'labelless';
                return (
                  <div key={run.method} className={`space-y-1.5 ${isLabelless ? 'pt-2 border-t border-slate-200' : ''}`}>
                    <div className={`flex justify-between text-xs ${isLabelless ? 'font-bold text-emerald-700' : 'text-slate-600'}`}>
                      <span>{run.label}{run.round > 0 ? ` (+${run.labelsAdded} labels)` : ''}</span>
                      <span className="font-mono-code font-bold">{pct(run.mAP50)}</span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isLabelless ? 'bg-emerald-600' : 'bg-slate-400'}`}
                        style={{ width: `${Math.max(4, ((run.mAP50 - 0.55) / 0.15) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              <p className="text-[11px] text-slate-500 italic">Single run, single seed. Differences under 1 point are within noise.</p>
            </div>
          </div>
        </div>
      </section>

      {/* "WHY LABELLESS?" COMPARISON MATRIX */}
      <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-xs font-bold font-mono-code uppercase tracking-widest text-slate-600 section-label">
            Why LabelLess? Architecture Differentiation
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            How LabelLess AI fundamentally changes the computer vision data engineering workflow
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-slate-200 bg-slate-100 text-[10px] font-mono-code font-extrabold uppercase tracking-widest text-slate-600">
              <tr>
                <th className="px-4 py-3.5 w-1/3">Capability</th>
                <th className="px-4 py-3.5 w-1/3 text-slate-500">Traditional Annotation Tools</th>
                <th className="px-4 py-3.5 w-1/3 text-emerald-800 font-bold bg-emerald-50 border-l border-emerald-200">
                  LabelLess AI (Active Pipeline)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium bg-transparent">
              <tr className="hover:bg-slate-100 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-slate-900">AI Assistance</td>
                <td className="px-4 py-3.5 text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold text-sm">~</span>
                    <span>Limited / Suggestion only</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-emerald-900 font-bold bg-emerald-50/70 border-l border-emerald-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
                    <span>Pseudo-labels for low-priority images</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-slate-100 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-slate-900">Automatic Labels</td>
                <td className="px-4 py-3.5 text-rose-600">
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-600 shrink-0 font-bold" />
                    <span>None (Manual review of 100% data)</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-emerald-900 font-bold bg-emerald-50/70 border-l border-emerald-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
                    <span>{pct(routing.autoFraction)} of pool routed (below priority 0.58)</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-slate-100 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-slate-900">Intelligent Sampling</td>
                <td className="px-4 py-3.5 text-rose-600">
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-600 shrink-0 font-bold" />
                    <span>Arbitrary order / Random sampling</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-emerald-900 font-bold bg-emerald-50/70 border-l border-emerald-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
                    <span>Uncertainty + Diversity + Rare Class weights</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-slate-100 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-slate-900">Human Review Scope</td>
                <td className="px-4 py-3.5 text-slate-600">
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-600 shrink-0 font-bold" />
                    <span>Everything ({routing.poolImages} images, high fatigue)</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-emerald-900 font-bold bg-emerald-50/70 border-l border-emerald-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
                    <span>Only high-priority cases ({pct(routing.humanFraction)})</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-slate-100 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-slate-900">Continuous Learning</td>
                <td className="px-4 py-3.5 text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold text-sm">~</span>
                    <span>Manual re-export & train script offline</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-emerald-900 font-bold bg-emerald-50/70 border-l border-emerald-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
                    <span>Saved reviews feed the next retraining round</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-slate-100 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-slate-900">Effort & Time Measurement</td>
                <td className="px-4 py-3.5 text-rose-600">
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-600 shrink-0 font-bold" />
                    <span>Unmeasured / Blind progress</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-emerald-900 font-bold bg-emerald-50/70 border-l border-emerald-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
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

