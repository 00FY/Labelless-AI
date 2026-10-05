import React, { useState } from 'react';
import { ProjectConfig, DatasetItem, ActiveLearningRound, NavigationTab } from '../types';
import {
  MEASURED_RUNS,
  getRun,
  pct,
  pts,
  getPoolRouting,
} from '../data/measuredResults';

// Assumed manual review time per image, used only for the effort estimate
const MANUAL_SEC_PER_IMAGE = 30;
import { Interactive3DBoundingBox } from './Interactive3DBoundingBox';
import { Interactive3DEmbeddingCluster } from './Interactive3DEmbeddingCluster';
import {
  Database,
  CheckCircle2,
  Users,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Flame,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  ShieldCheck,
  Zap,
  Info,
  Check,
} from 'lucide-react';

interface DashboardPageProps {
  config: ProjectConfig;
  datasetItems: DatasetItem[];
  rounds: ActiveLearningRound[];
  setActiveTab: (tab: NavigationTab) => void;
  onSelectImage: (item: DatasetItem) => void;
  onExplainItem: (item: DatasetItem) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  config,
  datasetItems,
  rounds,
  setActiveTab,
  onSelectImage,
  onExplainItem,
}) => {
  const routing = getPoolRouting(datasetItems);
  const seedRun = getRun('seed');
  const labellessRun = getRun('labelless');
  const hoursAll = (routing.poolImages * MANUAL_SEC_PER_IMAGE) / 3600;
  const hoursRouted = (routing.sentToHuman * MANUAL_SEC_PER_IMAGE) / 3600;

  const classCountMap: Record<string, number> = {};
  datasetItems.forEach((i) => {
    classCountMap[i.predictedClass] = (classCountMap[i.predictedClass] || 0) + 1;
  });
  const classCounts = Object.entries(classCountMap).sort((a, b) => b[1] - a[1]);

  // Calculate dynamic stats directly from dataset items
  const totalImages = datasetItems.length || 971;
  const autoLabeled = datasetItems.filter((i) => i.status === 'auto_labeled').length;
  const humanReviewed = datasetItems.filter((i) => i.status === 'human_reviewed').length;
  const pendingReview = datasetItems.filter((i) => i.status === 'pending').length;

  const autoPct = ((autoLabeled / totalImages) * 100).toFixed(1);
  const humanPct = ((humanReviewed / totalImages) * 100).toFixed(1);
  const pendingPct = ((pendingReview / totalImages) * 100).toFixed(1);

  const pendingHighPriority = datasetItems.filter(
    (i) => i.status === 'pending' && (i.priorityLevel === 'critical' || i.priorityLevel === 'high')
  );

  // Dynamic triage reasons distribution
  const uncCount = datasetItems.filter((i) => i.uncertaintyScore >= 0.5 || i.reasons.some((r) => r.toLowerCase().includes('conf') || r.toLowerCase().includes('unc'))).length;
  const rareCount = datasetItems.filter((i) => i.rareClassScore >= 0.4 || i.reasons.some((r) => r.toLowerCase().includes('rare'))).length;
  const divCount = datasetItems.filter((i) => i.diversityScore >= 0.6 || i.reasons.some((r) => r.toLowerCase().includes('complex') || r.toLowerCase().includes('entropy'))).length;
  const totalReasonWeight = uncCount + rareCount + divCount || 1;

  const uncPct = Math.round((uncCount / totalReasonWeight) * 100);
  const rarePct = Math.round((rareCount / totalReasonWeight) * 100);
  const divPct = Math.round((divCount / totalReasonWeight) * 100);
  const otherPct = Math.max(0, 100 - uncPct - rarePct - divPct);

  return (
    <div id="dashboard-page-root" className="space-y-10 pb-16 min-h-screen bg-slate-50 text-slate-900 max-w-7xl mx-auto px-4 lg:px-8 pt-4">
      {/* Dashboard Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
              Annotation Pipeline Dashboard
            </h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Round {config.currentRound}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            Monitoring active learning efficiency, routing distribution, and model mAP convergence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="dash-run-annotation-btn"
            onClick={() => setActiveTab('upload')}
            className="px-4 py-2.5 text-xs font-bold font-mono-code uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload New Batch</span>
          </button>

          <button
            id="dash-open-queue-btn"
            onClick={() => setActiveTab('queue')}
            className="px-4 py-2.5 text-xs font-bold font-mono-code text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all flex items-center gap-2 shadow-sm"
          >
            <span>Review Queue</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* SECTION A — DATASET OVERVIEW (4 Cards) */}
      <section className="space-y-4">
        <h2 className="text-[11px] font-mono-code font-bold uppercase tracking-widest text-emerald-600">
          Section A: Dataset & Pipeline Ingestion Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Images */}
          <div
            id="kpi-total-images"
            className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-sm hover:border-slate-300 transition-all"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono-code">
              <span className="font-semibold uppercase tracking-wider">Total Images</span>
              <Database className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-4xl font-extrabold font-mono-code text-slate-900">{totalImages.toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 font-mono-code">Disaster response active pool</p>
          </div>

          {/* Auto-labelled */}
          <div
            id="kpi-auto-labelled"
            className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-sm hover:border-slate-300 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-mono-code">
              <span className="font-semibold uppercase tracking-wider text-slate-500">Auto-Labeled</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-4xl font-extrabold font-mono-code text-emerald-600">{autoLabeled.toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 font-mono-code">{autoPct}% automatically pseudo-labeled</p>
          </div>

          {/* Human Reviewed */}
          <div
            id="kpi-human-reviewed"
            className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-sm hover:border-slate-300 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-mono-code">
              <span className="font-semibold uppercase tracking-wider text-slate-500">Human Reviewed</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-4xl font-extrabold font-mono-code text-indigo-600">{humanReviewed.toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 font-mono-code">{humanPct}% targeted high-value reviews</p>
          </div>

          {/* Pending Review */}
          <div
            id="kpi-pending-review"
            className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-sm hover:border-slate-300 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-mono-code">
              <span className="font-semibold uppercase tracking-wider text-slate-500">Pending Review</span>
              <Clock className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-4xl font-extrabold font-mono-code text-rose-600">{pendingReview}</div>
            <p className="text-[11px] text-slate-500 font-mono-code">{pendingPct}% in active review queue</p>
          </div>
        </div>
      </section>

      {/* SECTION B — EFFORT ALLOCATION STREAM */}
      <section
        id="dash-effort-visual"
        className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-display font-extrabold uppercase tracking-wider text-slate-900">
                Effort Allocation Stream
              </h3>
            </div>
          </div>

          <span className="text-xs font-mono-code font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
            Total Ingested: {totalImages.toLocaleString()} Images
          </span>
        </div>

        {/* Large segmented horizontal bar */}
        <div className="space-y-3">
          <div className="h-9 w-full bg-slate-100 rounded-xl overflow-hidden flex p-1 gap-1 border border-slate-200">
            <div
              style={{ width: `${autoPct}%` }}
              className="h-full bg-emerald-500 text-white rounded-lg flex items-center justify-center text-xs font-mono-code font-bold transition-all duration-500 shadow-sm"
              title={`Auto-labelled: ${autoLabeled} (${autoPct}%)`}
            >
              {autoPct}% Auto
            </div>
            <div
              style={{ width: `${humanPct}%` }}
              className="h-full bg-indigo-500 text-white rounded-lg flex items-center justify-center text-xs font-mono-code font-bold transition-all duration-500 shadow-sm"
              title={`Human-reviewed: ${humanReviewed} (${humanPct}%)`}
            >
              {humanPct}%
            </div>
            <div
              style={{ width: `${pendingPct}%` }}
              className="h-full bg-rose-500 text-white rounded-lg flex items-center justify-center text-xs font-mono-code font-bold transition-all duration-500 shadow-sm"
              title={`Pending review: ${pendingReview} (${pendingPct}%)`}
            >
              {pendingPct}%
            </div>
          </div>

          {/* Legend Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-3 h-3 rounded-md bg-emerald-500 shrink-0"></div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  {autoPct}% Auto-labelled
                </div>
                <div className="text-[11px] font-mono-code text-slate-500">{autoLabeled.toLocaleString()} confident images</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-3 h-3 rounded-md bg-indigo-500 shrink-0"></div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  {humanPct}% Human-reviewed
                </div>
                <div className="text-[11px] font-mono-code text-slate-500">{humanReviewed.toLocaleString()} active retrain samples</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-3 h-3 rounded-md bg-rose-500 shrink-0"></div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  {pendingPct}% Pending Queue
                </div>
                <div className="text-[11px] font-mono-code text-slate-500">{pendingReview.toLocaleString()} remaining in queue</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D EMBEDDING SPACE POINT CLOUD CLUSTER */}
      <section className="w-full">
        <Interactive3DEmbeddingCluster
          datasetItems={datasetItems}
          onSelectImage={onSelectImage}
          className="w-full"
        />
      </section>

      {/* SECTION C & SECTION E: Model Performance Graph & Why AI Asks For Help */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SECTION C — MODEL PERFORMANCE GRAPH (R1 to R4) */}
        <section
          id="dash-model-performance"
          className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  Measured Model Accuracy (mAP@50)
                </h3>
              </div>
              <span className="text-xs font-bold font-mono-code text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                {pts(labellessRun.mAP50, seedRun.mAP50)} after Round 1
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Each strategy adds the same 100 human labels to the seed model. Held-out test split.
            </p>
          </div>

          {/* Measured runs — values from src/data/measuredResults.ts */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            {MEASURED_RUNS.map((run) => {
              const isLabelless = run.method === 'labelless';
              const width = Math.max(4, ((run.mAP50 - 0.55) / (0.7 - 0.55)) * 100);
              return (
                <div key={run.method} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={isLabelless ? 'font-bold text-slate-900' : 'text-slate-600'}>
                      {run.label}
                      {run.round > 0 && <span className="text-slate-400"> &bull; +{run.labelsAdded} labels</span>}
                    </span>
                    <span className={`font-mono-code font-bold ${isLabelless ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {pct(run.mAP50)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isLabelless ? 'bg-emerald-500' : 'bg-slate-400'}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="text-[11px] text-slate-500 pt-1">
              Bar axis starts at 55%. Fire AP@50: {pct(labellessRun.fireAP50)} with LabelLess vs{' '}
              {pct(getRun('random').fireAP50)} with Random. Single run, single seed.
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Model: <strong className="text-slate-900 font-mono-code">YOLOv8n</strong></span>
            <button
              onClick={() => setActiveTab('evidence')}
              className="text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1"
            >
              Full experiment evidence &rarr;
            </button>
          </div>
        </section>

        {/* SECTION E — WHY IS AI ASKING FOR HUMAN HELP? */}
        <section
          id="dash-why-human-review"
          className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PieIcon className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                Why is AI Asking for Human Help?
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Not just confidence thresholding: intelligent multi-factor triage
            </p>
          </div>

          {/* Functional 2D Spatial YOLO Bounding Box Inspector */}
          <Interactive3DBoundingBox className="w-full !p-0 !border-0 !shadow-none bg-transparent" />

          {/* Triage factors breakdown */}
          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
              <span className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Uncertainty
              </span>
              <span className="font-mono-code font-bold text-xs text-amber-600">{uncPct}%</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
              <span className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                Rare Class
              </span>
              <span className="font-mono-code font-bold text-xs text-rose-600">{rarePct}%</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
              <span className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                Diversity
              </span>
              <span className="font-mono-code font-bold text-xs text-indigo-600">{divPct}%</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
              <span className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                Boundary Jitter
              </span>
              <span className="font-mono-code font-bold text-xs text-slate-600">{otherPct}%</span>
            </div>
          </div>
        </section>
      </div>

      {/* SECTION D & SECTION F: Review Queue Snippet & Human Effort Tracker + Dataset Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SECTION D — REVIEW QUEUE (High Priority Snippet) */}
        <section
          id="dash-review-queue-snippet"
          className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  High Priority Review Queue
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                {pendingHighPriority.length} images require immediate review for next retraining round
              </p>
            </div>

            <button
              onClick={() => setActiveTab('queue')}
              className="text-xs font-bold font-mono-code text-slate-700 hover:text-slate-900 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200"
            >
              <span>Full Queue ({totalImages.toLocaleString()})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-mono-code font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Image</th>
                  <th className="px-3 py-2.5">Predicted Class</th>
                  <th className="px-3 py-2.5">Confidence</th>
                  <th className="px-3 py-2.5">Priority</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {pendingHighPriority.slice(0, 3).map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => onSelectImage(item)}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            target.src = '/predictions/00f205aea57febc8e82d4e99a18b1d51.png';
                          }}
                          className="w-10 h-7 rounded object-cover border border-slate-200 shrink-0"
                        />
                        <span className="font-mono-code font-bold text-slate-900">
                          {item.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium font-mono-code bg-slate-100 text-slate-700 border border-slate-200">
                        {item.predictedClass}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono-code text-slate-600 font-semibold">
                      {(item.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono-code font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit">
                        <span>🔴</span>
                        <span>{item.priorityScore.toFixed(2)}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onExplainItem(item);
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold font-mono-code text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                        >
                          Explain
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectImage(item);
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold font-mono-code uppercase text-white bg-slate-900 hover:bg-slate-800 rounded shadow-sm transition-all"
                        >
                          Annotate &rarr;
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION F — HUMAN EFFORT TRACKING & DATASET HEALTH */}
        <section
          id="dash-effort-tracker"
          className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                Human Effort & Time Tracking
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Estimate from pool routing. Assumes {MANUAL_SEC_PER_IMAGE}s per manual review.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono-code">
              <span className="text-slate-500">Review every pool image ({routing.poolImages}):</span>
              <span className="font-bold text-slate-700">{hoursAll.toFixed(1)} Hours</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono-code">
              <span className="text-slate-700 font-semibold">
                Review only routed images ({routing.sentToHuman}, {pct(routing.humanFraction)}):
              </span>
              <span className="font-bold text-slate-900">{hoursRouted.toFixed(1)} Hours</span>
            </div>
            <div className="h-px bg-slate-200"></div>
            <div className="flex items-center justify-between text-sm font-bold">
              <span className="text-emerald-700 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                Estimated Time Saved:
              </span>
              <span className="font-mono-code text-emerald-700 text-base">
                {(hoursAll - hoursRouted).toFixed(1)} Hours ({pct(routing.autoFraction)})
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              The accuracy of the {routing.autoLabeled} auto-labelled images has not been audited yet.
            </p>
          </div>

          {/* Class distribution of the current queue */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono-code">
              Predicted Class Distribution
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono-code">
              {classCounts.map(([cls, count]) => (
                <div key={cls} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-600">{cls}:</span>
                  <span className="text-slate-900 font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
