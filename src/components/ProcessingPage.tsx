import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectConfig, NavigationTab, DatasetItem } from '../types';
import { PIPELINE_STREAM_SAMPLES } from '../data/fallbackPresets';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Pause,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface ProcessingPageProps {
  config: ProjectConfig;
  datasetItems?: DatasetItem[];
  setActiveTab: (tab: NavigationTab) => void;
}

export const ProcessingPage: React.FC<ProcessingPageProps> = ({
  config,
  datasetItems = [],
  setActiveTab,
}) => {
  const totalImages = datasetItems.length > 0 ? datasetItems.length : 971;
  const autoAccepted = datasetItems.length > 0 ? datasetItems.filter((i) => i.status === 'auto_labeled').length : Math.round(totalImages * 0.75);
  const sentForReview = datasetItems.length > 0 ? datasetItems.filter((i) => i.status === 'pending' || i.status === 'human_reviewed').length : totalImages - autoAccepted;
  const skipped = 0;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [processedCount, setProcessedCount] = useState(autoAccepted + sentForReview);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PIPELINE_STREAM_SAMPLES.length);
      setProcessedCount((prev) => (prev < totalImages ? prev + 1 : totalImages));
    }, 2800);
    return () => clearInterval(interval);
  }, [isPlaying, totalImages]);

  const currentSample = PIPELINE_STREAM_SAMPLES[currentIndex];

  return (
    <div id="processing-page-root" className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Annotation in Progress
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
              ● Active Stream
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            Round {config.currentRound} &bull; Dataset: {config.datasetName} &bull; Model: {config.modelType} {config.modelVersion}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Stream' : 'Resume'}</span>
          </button>

          <button
            id="jump-to-queue-btn"
            onClick={() => setActiveTab('queue')}
            className="px-4 py-2 text-xs font-bold text-zinc-950 bg-blue-500 hover:bg-blue-400 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <span>Review Queue ({sentForReview.toLocaleString()})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Large Progress Bar */}
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between text-xs font-mono font-bold">
          <div className="flex items-center gap-2 text-zinc-300">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>AI PROCESSING & ACTIVE INFERENCE PIPELINE</span>
          </div>
          <span className="text-blue-400">
            {processedCount.toLocaleString()} / {totalImages.toLocaleString()} IMAGES ({((processedCount / totalImages) * 100).toFixed(1)}%)
          </span>
        </div>

        {/* Animated Bar */}
        <div className="h-4 w-full bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 rounded-full transition-all duration-500 relative"
            style={{ width: `${(processedCount / totalImages) * 100}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>

        {/* Live Statistics (4 Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Processed</span>
            <div className="text-xl font-extrabold font-mono text-white">{processedCount.toLocaleString()}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Auto-Accepted</span>
            <div className="text-xl font-extrabold font-mono text-emerald-400">{autoAccepted.toLocaleString()}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Sent to Review</span>
            <div className="text-xl font-extrabold font-mono text-rose-400">{sentForReview.toLocaleString()}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Skipped / Corrupt</span>
            <div className="text-xl font-extrabold font-mono text-zinc-500">{skipped}</div>
          </div>
        </div>
      </div>

      {/* LIVE IMAGE STREAM PREVIEW (The core pitch visual for demo!) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            Live Batch Stream & Routing Decisions
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">Streaming Frame {currentIndex + 1} of {PIPELINE_STREAM_SAMPLES.length}</span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSample.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
            >
              {/* Image Preview with Bounding Box Overlay */}
              <div className="md:col-span-6 relative rounded-2xl overflow-hidden border border-zinc-700 bg-black aspect-video flex items-center justify-center">
                <img
                  src={
                    currentSample.class === 'Damaged Building'
                      ? '/predictions/09e62858a678e6fcea8bced21d03ab1c.png'
                      : currentSample.class === 'Fire'
                      ? '/predictions/multidisaster_sample_1.jpg'
                      : currentSample.class === 'Smoke'
                      ? '/predictions/multidisaster_sample_3.jpg'
                      : '/predictions/00f205aea57febc8e82d4e99a18b1d51.png'
                  }
                  alt={currentSample.name}
                  className="w-full h-full object-cover"
                />

                {/* Simulated live inference box */}
                <div
                  className={`absolute inset-6 border-2 ${
                    currentSample.status === 'auto_labeled'
                      ? 'border-emerald-400 bg-emerald-500/20'
                      : 'border-dashed border-rose-400 bg-rose-500/20'
                  } rounded-lg flex items-start justify-start p-2`}
                >
                  <div
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold text-white shadow flex items-center gap-1 ${
                      currentSample.status === 'auto_labeled' ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  >
                    <span>{currentSample.class}</span>
                    <span>{(currentSample.conf * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/80 backdrop-blur-md text-[11px] font-mono text-zinc-300 border border-zinc-700">
                  {currentSample.id}
                </div>
              </div>

              {/* Status & Routing Decision Card */}
              <div className="md:col-span-6 space-y-4">
                <div>
                  <div className="text-xs text-zinc-400 font-mono mb-1">{currentSample.id} &bull; {currentSample.name}</div>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    Class: <span className="text-blue-400">{currentSample.class}</span>
                  </h3>
                </div>

                {/* Status Badge */}
                <div
                  className={`p-4 rounded-xl border ${currentSample.color} space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono tracking-wider flex items-center gap-1.5">
                      <span>{currentSample.icon}</span>
                      <span>{currentSample.statusText}</span>
                    </span>
                    <span className="text-xs font-mono font-bold">
                      Confidence: {(currentSample.conf * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="text-xs text-zinc-300">
                    <strong>Routing Reason:</strong> {currentSample.reason}
                  </div>
                </div>

                {/* Active Learning Explanation */}
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 space-y-1">
                  <div className="text-zinc-300 font-semibold">Active Learning Policy:</div>
                  {currentSample.status === 'auto_labeled' ? (
                    <p>
                      Confidence &ge; 85% with low embedding entropy. Bounding coordinates added directly to pseudo-labeled training corpus.
                    </p>
                  ) : (
                    <p>
                      Confidence &lt; 85% or rare class detected. Routed to high-priority review queue with calculated value score.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  {currentSample.status !== 'auto_labeled' && (
                    <button
                      onClick={() => setActiveTab('workspace')}
                      className="px-4 py-2 text-xs font-bold text-zinc-950 bg-blue-500 hover:bg-blue-400 rounded-xl transition-all shadow-md shadow-blue-500/20"
                    >
                      Annotate This Frame Now →
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('queue')}
                    className="px-4 py-2 text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 transition-colors"
                  >
                    View All Queued Images
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};
