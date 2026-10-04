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
    <div id="dashboard-page-root" className="space-y-8 pb-12">
      {/* Dashboard Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Annotation Pipeline Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-gray-100 text-gray-600">
              Active Round {config.currentRound}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Monitoring active learning efficiency, routing distribution, and model mAP convergence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="dash-run-annotation-btn"
            onClick={() => setActiveTab('upload')}
            className="px-4 py-2 text-xs font-bold text-white bg-gray-900 hover:bg-gray-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upload New Batch</span>
          </button>

          <button
            id="dash-open-queue-btn"
            onClick={() => setActiveTab('queue')}
            className="px-4 py-2 text-xs font-bold text-gray-900 bg-white hover:bg-gray-50 rounded-xl border border-gray-300 transition-all flex items-center gap-1.5"
          >
            <span>Review Queue</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* SECTION A — DATASET OVERVIEW (4 Cards) */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Section A: Dataset & Pipeline Ingestion Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Images */}
          <div
            id="kpi-total-images"
            className="p-6 rounded-2xl bg-white border border-gray-200 space-y-2 shadow-sm hover:border-gray-300"
          >
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-semibold uppercase tracking-wider">Total Images</span>
              <Database className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-4xl font-extrabold font-mono text-gray-900">{totalImages.toLocaleString()}</div>
            <p className="text-[11px] text-gray-500">Disaster response active pool</p>
          </div>

          {/* Auto-labelled */}
          <div
            id="kpi-auto-labelled"
            className="p-6 rounded-2xl bg-white border border-gray-200 space-y-2 shadow-sm hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-emerald-600">
              <span className="font-semibold uppercase tracking-wider text-gray-500">Auto-Labelled</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-4xl font-extrabold font-mono text-gray-900">{autoLabeled.toLocaleString()}</div>
            <p className="text-[11px] text-gray-500">{autoPct}% automatically pseudo-labeled</p>
          </div>

          {/* Human Reviewed */}
          <div
            id="kpi-human-reviewed"
            className="p-6 rounded-2xl bg-white border border-gray-200 space-y-2 shadow-sm hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-blue-600">
              <span className="font-semibold uppercase tracking-wider text-gray-500">Human Reviewed</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-4xl font-extrabold font-mono text-gray-900">{humanReviewed.toLocaleString()}</div>
            <p className="text-[11px] text-gray-500">{humanPct}% targeted high-value reviews</p>
          </div>

          {/* Pending Review */}
          <div
            id="kpi-pending-review"
            className="p-6 rounded-2xl bg-white border border-gray-200 space-y-2 shadow-sm hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-red-500">
              <span className="font-semibold uppercase tracking-wider text-gray-500">Pending Review</span>
              <Clock className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-4xl font-extrabold font-mono text-gray-900">{pendingReview}</div>
            <p className="text-[11px] text-gray-500">{pendingPct}% in active review queue</p>
          </div>
        </div>
      </section>

      {/* SECTION B — THE MOST IMPORTANT VISUAL: "Where is human effort going?" */}
      <section
        id="dash-effort-visual"
        className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-5"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900">
                Effort Allocation
              </h3>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-gray-600 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
            Total Ingested: {totalImages.toLocaleString()} Images
          </span>
        </div>

        {/* Large segmented horizontal bar */}
        <div className="space-y-3">
          <div className="h-8 w-full bg-gray-100 rounded-xl overflow-hidden flex p-1 gap-1">
            <div
              style={{ width: `${autoPct}%` }}
              className="h-full bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center text-xs font-mono font-bold transition-all duration-500"
              title={`Auto-labelled: ${autoLabeled} (${autoPct}%)`}
            >
              {autoPct}%
            </div>
            <div
              style={{ width: `${humanPct}%` }}
              className="h-full bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center text-xs font-mono font-bold transition-all duration-500"
              title={`Human-reviewed: ${humanReviewed} (${humanPct}%)`}
            >
              {humanPct}%
            </div>
            <div
              style={{ width: `${pendingPct}%` }}
              className="h-full bg-red-100 text-red-800 rounded-lg flex items-center justify-center text-xs font-mono font-bold transition-all duration-500"
              title={`Pending review: ${pendingReview} (${pendingPct}%)`}
            >
              {pendingPct}%
            </div>
          </div>

          {/* Legend Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200">
              <div className="w-3 h-3 rounded-md bg-emerald-500 shrink-0"></div>
              <div>
                <div className="text-xs font-bold text-gray-900">
                  {autoPct}% Auto-labelled
                </div>
                <div className="text-[11px] font-mono text-gray-500">{autoLabeled.toLocaleString()} confident images</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200">
              <div className="w-3 h-3 rounded-md bg-gray-400 shrink-0"></div>
              <div>
                <div className="text-xs font-bold text-gray-900">
                  {humanPct}% Human-reviewed
                </div>
                <div className="text-[11px] font-mono text-gray-500">{humanReviewed.toLocaleString()} active retrain samples</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200">
              <div className="w-3 h-3 rounded-md bg-rose-500 shrink-0"></div>
              <div>
                <div className="text-xs font-bold text-gray-900">
                  {pendingPct}% Pending Queue
                </div>
                <div className="text-[11px] font-mono text-gray-500">{pendingReview.toLocaleString()} remaining in queue</div>
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
          className="lg:col-span-7 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900">
                  Measured Model Accuracy (mAP@50)
                </h3>
              </div>
              <span className="text-xs font-bold font-mono text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                {pts(labellessRun.mAP50, seedRun.mAP50)} after Round 1
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Each strategy adds the same 100 human labels to the seed model. Held-out test split.
            </p>
          </div>

          {/* Measured runs — values from src/data/measuredResults.ts */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
            {MEASURED_RUNS.map((run) => {
              const isLabelless = run.method === 'labelless';
              // Scale bars from 55% so small but real differences stay visible
              const width = Math.max(4, ((run.mAP50 - 0.55) / (0.7 - 0.55)) * 100);
              return (
                <div key={run.method} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={isLabelless ? 'font-bold text-gray-900' : 'text-gray-600'}>
                      {run.label}
                      {run.round > 0 && <span className="text-gray-400"> · +{run.labelsAdded} labels</span>}
                    </span>
                    <span className={`font-mono font-bold ${isLabelless ? 'text-emerald-600' : 'text-gray-700'}`}>
                      {pct(run.mAP50)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isLabelless ? 'bg-emerald-500' : 'bg-gray-500'}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="text-[11px] text-gray-500 pt-1">
              Bar axis starts at 55%. Fire AP@50: {pct(labellessRun.fireAP50)} with LabelLess vs{' '}
              {pct(getRun('random').fireAP50)} with Random. Single run, single seed.
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span>Model: <strong className="text-gray-900">YOLOv8n</strong></span>
            <button
              onClick={() => setActiveTab('evidence')}
              className="text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-1"
            >
              Full experiment evidence →
            </button>
          </div>
        </section>

        {/* SECTION E — WHY IS AI ASKING FOR HUMAN HELP? (Donut & Innovation Feature) */}
        <section
          id="dash-why-human-review"
          className="lg:col-span-5 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PieIcon className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900">
                Why is AI Asking for Human Help?
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              Not just confidence thresholding: intelligent multi-factor triage
            </p>
          </div>

          {/* Functional 2D Spatial YOLO Bounding Box Inspector */}
          <Interactive3DBoundingBox className="w-full !p-0 !border-0 !shadow-none bg-transparent" />

          {/* Triage factors breakdown (Compact 2x2 grid) */}
          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
            <div className="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between shadow-2xs">
              <span className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Uncertainty
              </span>
              <span className="font-mono font-bold text-xs text-amber-600">{uncPct}%</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between shadow-2xs">
              <span className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />
                Rare Class
              </span>
              <span className="font-mono font-bold text-xs text-red-600">{rarePct}%</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between shadow-2xs">
              <span className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                Diversity
              </span>
              <span className="font-mono font-bold text-xs text-blue-600">{divPct}%</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between shadow-2xs">
              <span className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                Boundary Jitter
              </span>
              <span className="font-mono font-bold text-xs text-gray-600">{otherPct}%</span>
            </div>
          </div>
        </section>
      </div>

      {/* SECTION D & SECTION F: Review Queue Snippet & Human Effort Tracker + Dataset Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SECTION D — REVIEW QUEUE (High Priority Snippet) */}
        <section
          id="dash-review-queue-snippet"
          className="lg:col-span-7 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900">
                  High Priority Review Queue
                </h3>
              </div>
              <p className="text-xs text-gray-500">
                {pendingHighPriority.length} images require immediate review for next retraining round
              </p>
            </div>

            <button
              onClick={() => setActiveTab('queue')}
              className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200"
            >
              <span>Full Queue ({totalImages.toLocaleString()})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-3 py-2.5">Image</th>
                  <th className="px-3 py-2.5">Predicted Class</th>
                  <th className="px-3 py-2.5">Confidence</th>
                  <th className="px-3 py-2.5">Priority</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {pendingHighPriority.slice(0, 3).map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors group cursor-pointer"
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
                          className="w-10 h-7 rounded object-cover border border-gray-200 shrink-0"
                        />
                        <span className="font-mono font-bold text-gray-900">
                          {item.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        {item.predictedClass}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-gray-600 font-semibold">
                      {(item.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-50 text-red-600 border border-red-100 flex items-center gap-1 w-fit">
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
                          className="px-2 py-1 text-[10px] font-semibold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 rounded border border-gray-300 transition-colors"
                        >
                          Explain
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectImage(item);
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold text-white bg-gray-900 hover:bg-gray-700 rounded shadow-sm transition-all"
                        >
                          Annotate →
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
          className="lg:col-span-5 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-900">
                Human Effort & Time Tracking
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              Estimate from pool routing. Assumes {MANUAL_SEC_PER_IMAGE}s per manual review.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Review every pool image ({routing.poolImages}):</span>
              <span className="font-mono font-bold text-gray-700">{hoursAll.toFixed(1)} Hours</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-700 font-semibold">
                Review only routed images ({routing.sentToHuman}, {pct(routing.humanFraction)}):
              </span>
              <span className="font-mono font-bold text-gray-900">{hoursRouted.toFixed(1)} Hours</span>
            </div>
            <div className="h-px bg-gray-200"></div>
            <div className="flex items-center justify-between text-sm font-bold">
              <span className="text-emerald-600 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Estimated Time Saved:
              </span>
              <span className="font-mono text-emerald-600 text-base">
                {(hoursAll - hoursRouted).toFixed(1)} Hours ({pct(routing.autoFraction)})
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              The accuracy of the {routing.autoLabeled} auto-labelled images has not been audited yet.
            </p>
          </div>

          {/* Class distribution of the current queue, computed from the loaded data */}
          <div className="p-3.5 rounded-xl bg-white border border-gray-200 space-y-2">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Predicted Class Distribution
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {classCounts.map(([cls, count]) => (
                <div key={cls} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="text-gray-500">{cls}:</span>
                  <span className="text-gray-900 font-semibold font-mono">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
