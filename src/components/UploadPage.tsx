import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ProjectConfig, NavigationTab } from '../types';
import {
  UploadCloud,
  Plus,
  X,
  Sparkles,
  Cpu,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileImage,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface UploadPageProps {
  config: ProjectConfig;
  setConfig: React.Dispatch<React.SetStateAction<ProjectConfig>>;
  onStartProcessing: () => void;
  setActiveTab: (tab: NavigationTab) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({
  config,
  setConfig,
  onStartProcessing,
  setActiveTab,
}) => {
  const [newClassInput, setNewClassInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFilesCount, setUploadedFilesCount] = useState(10000);
  const [isSimulatingUpload, setIsSimulatingUpload] = useState(false);
  const [uploadProgressStep, setUploadProgressStep] = useState<number>(0);

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassInput.trim()) return;
    const trimmed = newClassInput.trim();
    if (!config.classes.includes(trimmed)) {
      setConfig((prev) => ({
        ...prev,
        classes: [...prev.classes, trimmed],
      }));
    }
    setNewClassInput('');
  };

  const handleRemoveClass = (clsToRemove: string) => {
    if (config.classes.length <= 1) return;
    setConfig((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c !== clsToRemove),
    }));
  };

  const handleRunAnnotation = () => {
    setIsSimulatingUpload(true);
    setUploadProgressStep(1); // Uploading

    setTimeout(() => {
      setUploadProgressStep(2); // Loading model
    }, 600);

    setTimeout(() => {
      setUploadProgressStep(3); // Running detection
    }, 1200);

    setTimeout(() => {
      setUploadProgressStep(4); // Generating pseudo labels
    }, 1800);

    setTimeout(() => {
      setUploadProgressStep(5); // Calculating priority
    }, 2400);

    setTimeout(() => {
      setIsSimulatingUpload(false);
      onStartProcessing();
      setActiveTab('processing');
    }, 3000);
  };

  return (
    <div id="upload-page-root" className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create Annotation Project
          </h1>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Pipeline Setup
          </span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-400">
          Upload unlabeled images and let LabelLess AI build the active annotation pipeline.
        </p>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Upload Area & Dataset Config */}
        <div className="lg:col-span-7 space-y-6">
          {/* Upload Dropzone */}
          <div
            id="upload-dropzone"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              setUploadedFilesCount(10000);
            }}
            className={`relative rounded-2xl border-2 border-dashed transition-all p-8 text-center flex flex-col items-center justify-center gap-3 bg-zinc-900/60 ${
              isDragging
                ? 'border-blue-400 bg-blue-500/10 scale-[1.01]'
                : 'border-zinc-700 hover:border-zinc-600'
            }`}
          >
            <div className="p-4 rounded-2xl bg-zinc-800 text-blue-400 shadow-md">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-100">
                Drop unlabelled disaster images here
              </h3>
              <p className="text-xs text-zinc-400">
                PNG • JPG • JPEG • WebP &bull; Up to 10,000 images per batch
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <label
                htmlFor="file-input"
                className="cursor-pointer px-4 py-2 text-xs font-bold text-zinc-950 bg-blue-500 hover:bg-blue-400 rounded-xl transition-all shadow-md shadow-blue-500/20"
              >
                Browse Files
              </label>
              <input
                id="file-input"
                type="file"
                multiple
                className="hidden"
                onChange={() => setUploadedFilesCount(10000)}
              />

              <button
                type="button"
                onClick={() => setUploadedFilesCount(10000)}
                className="px-3.5 py-2 text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 transition-colors"
              >
                Load Pre-configured Disaster Dataset (10k)
              </button>
            </div>

            <div className="pt-2 text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{uploadedFilesCount.toLocaleString()} images staged and indexed</span>
            </div>
          </div>

          {/* Dataset Name & Classes */}
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Dataset Name
              </label>
              <input
                type="text"
                value={config.datasetName}
                onChange={(e) => setConfig((p) => ({ ...p, datasetName: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            {/* Target Classes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Target Object Classes ({config.classes.length})
                </label>
                <span className="text-[11px] text-zinc-500">Bounding box categories</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {config.classes.map((cls) => (
                  <span
                    key={cls}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200"
                  >
                    <span>{cls}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveClass(cls)}
                      className="text-zinc-400 hover:text-rose-400 p-0.5 rounded transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add class inline form */}
              <form onSubmit={handleAddClass} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add new class (e.g. Smoke, Helicopter)..."
                  value={newClassInput}
                  onChange={(e) => setNewClassInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-bold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Class</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Col: Model & Active Learning Hyperparameters */}
        <div className="lg:col-span-5 space-y-6">
          {/* Model & Strategy */}
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-5">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                Detection Model Configuration
              </h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-medium">Pretrained CV Backbone</label>
              <select
                value={config.modelType}
                onChange={(e) => setConfig((p) => ({ ...p, modelType: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="YOLOv8">YOLOv8 — Ultralytics PyTorch (Recommended)</option>
                <option value="RT-DETR">RT-DETR — Real-Time Detection Transformer</option>
                <option value="YOLOv9">YOLOv9 — Programmable Gradient Information</option>
                <option value="SAM-2">SAM-2 Assisted Zero-Shot Segmentation</option>
              </select>
            </div>

            {/* Annotation Strategy Selector */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Active Annotation Strategy
              </label>

              <div className="space-y-2">
                {[
                  {
                    id: 'conservative',
                    label: 'Conservative',
                    desc: 'More human review, maximum label reliability (Threshold: 0.92)',
                  },
                  {
                    id: 'balanced',
                    label: 'Balanced (Recommended)',
                    desc: 'Optimal 64% effort savings with 98% quality retention (Threshold: 0.85)',
                  },
                  {
                    id: 'aggressive',
                    label: 'Aggressive Automation',
                    desc: 'Maximum automation speed (Threshold: 0.75)',
                  },
                ].map((s) => (
                  <label
                    key={s.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      config.strategy === s.id
                        ? 'bg-blue-500/10 border-blue-500/40 text-zinc-100'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="strategy"
                      checked={config.strategy === s.id}
                      onChange={() =>
                        setConfig((p) => ({
                          ...p,
                          strategy: s.id as any,
                          confidenceThreshold: s.id === 'conservative' ? 0.92 : s.id === 'balanced' ? 0.85 : 0.75,
                        }))
                      }
                      className="mt-0.5 text-blue-500 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-xs font-bold">{s.label}</div>
                      <div className="text-[11px] text-zinc-400">{s.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Active Learning Hyperparameters */}
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Review Priority Weights
                </h3>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Recommended
              </span>
            </div>

            {/* Confidence Threshold */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-medium">Auto-Accept Confidence Threshold</span>
                <span className="font-mono font-bold text-blue-400">
                  {(config.confidenceThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.70"
                max="0.98"
                step="0.01"
                value={config.confidenceThreshold}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, confidenceThreshold: parseFloat(e.target.value) }))
                }
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>0.70 (Aggressive)</span>
                <span>0.85 (Default)</span>
                <span>0.98 (Strict)</span>
              </div>
            </div>

            {/* Weights Sliders */}
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-amber-400 font-semibold">Uncertainty Weight</span>
                  <span className="font-mono text-zinc-300">{(config.uncertaintyWeight * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${config.uncertaintyWeight * 100}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-400 font-semibold">Diversity (Embedding Distance)</span>
                  <span className="font-mono text-zinc-300">{(config.diversityWeight * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${config.diversityWeight * 100}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-rose-400 font-semibold">Rare Class Imbalance Weight</span>
                  <span className="font-mono text-zinc-300">{(config.rareClassWeight * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full" style={{ width: `${config.rareClassWeight * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Huge CTA button */}
          <div className="space-y-3">
            <button
              id="run-ai-annotation-btn"
              type="button"
              onClick={handleRunAnnotation}
              disabled={isSimulatingUpload}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-zinc-950 bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-300 hover:from-blue-400 hover:to-indigo-200 shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 disabled:opacity-50"
            >
              {isSimulatingUpload ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Initializing Active Learning Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run AI Annotation Pipeline</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Simulation Stage Indicators */}
            {isSimulatingUpload && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs font-mono"
              >
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className={uploadProgressStep >= 1 ? 'text-emerald-400' : 'text-zinc-500'}>
                    {uploadProgressStep >= 1 ? '✓' : '○'} Uploading {uploadedFilesCount.toLocaleString()} disaster frames
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className={uploadProgressStep >= 2 ? 'text-emerald-400' : 'text-zinc-500'}>
                    {uploadProgressStep >= 2 ? '✓' : '○'} Loading {config.modelType} neural weights
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className={uploadProgressStep >= 3 ? 'text-blue-400 font-bold animate-pulse' : 'text-zinc-500'}>
                    {uploadProgressStep >= 3 ? '◐' : '○'} Running batch tensor detection
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className={uploadProgressStep >= 4 ? 'text-emerald-400' : 'text-zinc-500'}>
                    {uploadProgressStep >= 4 ? '✓' : '○'} Generating pseudo-labels (&gt;85% conf)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className={uploadProgressStep >= 5 ? 'text-emerald-400' : 'text-zinc-500'}>
                    {uploadProgressStep >= 5 ? '✓' : '○'} Calculating review priority for uncertain cases
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
