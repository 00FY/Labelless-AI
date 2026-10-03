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
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Create Annotation Project
          </h1>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-gray-100 text-gray-600 border border-gray-200">
            Pipeline Setup
          </span>
        </div>
        <p className="text-xs sm:text-sm text-gray-500">
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
            className={`relative rounded-2xl border-2 border-dashed transition-all p-8 text-center flex flex-col items-center justify-center gap-3 bg-gray-50 ${
              isDragging
                ? 'border-gray-400 bg-gray-100 scale-[1.01]'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-100'
            }`}
          >
            <div className="p-4 rounded-2xl bg-white text-gray-400 border border-gray-200 shadow-sm">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">
                Drop unlabelled disaster images here
              </h3>
              <p className="text-xs text-gray-500">
                PNG • JPG • JPEG • WebP &bull; Up to 10,000 images per batch
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <label
                htmlFor="file-input"
                className="cursor-pointer px-4 py-2 text-xs font-bold text-white bg-gray-900 hover:bg-gray-700 rounded-xl transition-all shadow-sm"
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
                className="px-3.5 py-2 text-xs font-semibold text-gray-900 bg-white hover:bg-gray-50 rounded-xl border border-gray-300 transition-colors shadow-sm"
              >
                Load Pre-configured Disaster Dataset (10k)
              </button>
            </div>

            <div className="pt-2 text-[11px] text-emerald-700 font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{uploadedFilesCount.toLocaleString()} images staged and indexed</span>
            </div>
          </div>

          {/* Dataset Name & Classes */}
          <div className="p-6 rounded-2xl bg-white border border-gray-200 space-y-5 shadow-sm">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 section-label">
                Dataset Name
              </label>
              <input
                type="text"
                value={config.datasetName}
                onChange={(e) => setConfig((p) => ({ ...p, datasetName: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 font-medium transition-shadow"
              />
            </div>

            {/* Target Classes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 section-label">
                  Target Object Classes ({config.classes.length})
                </label>
                <span className="text-[11px] text-gray-500">Bounding box categories</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {config.classes.map((cls) => (
                  <span
                    key={cls}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700"
                  >
                    <span>{cls}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveClass(cls)}
                      className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors"
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
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-shadow"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-bold text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl flex items-center gap-1 transition-colors shadow-sm"
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
          <div className="p-6 rounded-2xl bg-white border border-gray-200 space-y-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-gray-400" />
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 section-label">
                Detection Model Configuration
              </h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500 font-medium">Pretrained CV Backbone</label>
              <select
                value={config.modelType}
                onChange={(e) => setConfig((p) => ({ ...p, modelType: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 font-semibold focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
              >
                <option value="YOLOv8">YOLOv8 — Ultralytics PyTorch (Recommended)</option>
                <option value="RT-DETR">RT-DETR — Real-Time Detection Transformer</option>
                <option value="YOLOv9">YOLOv9 — Programmable Gradient Information</option>
                <option value="SAM-2">SAM-2 Assisted Zero-Shot Segmentation</option>
              </select>
            </div>

            {/* Annotation Strategy Selector */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 section-label">
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
                        ? 'bg-gray-50 border-gray-900 text-gray-900 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
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
                      className="mt-0.5 text-gray-900 focus:ring-gray-900 accent-gray-900"
                    />
                    <div>
                      <div className={`text-xs font-bold ${config.strategy === s.id ? 'text-gray-900' : 'text-gray-700'}`}>{s.label}</div>
                      <div className="text-[11px] text-gray-500">{s.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Active Learning Hyperparameters */}
          <div className="p-6 rounded-2xl bg-white border border-gray-200 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-gray-400" />
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 section-label">
                  Review Priority Weights
                </h3>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Recommended
              </span>
            </div>

            {/* Confidence Threshold */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 font-medium">Auto-Accept Confidence Threshold</span>
                <span className="font-mono font-bold text-gray-900">
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
                className="w-full accent-gray-900"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>0.70 (Aggressive)</span>
                <span>0.85 (Default)</span>
                <span>0.98 (Strict)</span>
              </div>
            </div>

            {/* Weights Sliders */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-700 font-semibold">Uncertainty Weight</span>
                  <span className="font-mono text-gray-600">{(config.uncertaintyWeight * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-400 rounded-full" style={{ width: `${config.uncertaintyWeight * 100}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-700 font-semibold">Diversity (Embedding Distance)</span>
                  <span className="font-mono text-gray-600">{(config.diversityWeight * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-400 rounded-full" style={{ width: `${config.diversityWeight * 100}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-700 font-semibold">Rare Class Imbalance Weight</span>
                  <span className="font-mono text-gray-600">{(config.rareClassWeight * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-400 rounded-full" style={{ width: `${config.rareClassWeight * 100}%` }}></div>
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
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-gray-900 hover:bg-gray-800 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs font-mono"
              >
                <div className="flex items-center gap-2 text-gray-700">
                  <span className={uploadProgressStep >= 1 ? 'text-emerald-600' : 'text-gray-400'}>
                    {uploadProgressStep >= 1 ? '✓' : '○'} Uploading {uploadedFilesCount.toLocaleString()} disaster frames
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className={uploadProgressStep >= 2 ? 'text-emerald-600' : 'text-gray-400'}>
                    {uploadProgressStep >= 2 ? '✓' : '○'} Loading {config.modelType} neural weights
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className={uploadProgressStep >= 3 ? 'text-gray-900 font-bold animate-pulse' : 'text-gray-400'}>
                    {uploadProgressStep >= 3 ? '◐' : '○'} Running batch tensor detection
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className={uploadProgressStep >= 4 ? 'text-emerald-600' : 'text-gray-400'}>
                    {uploadProgressStep >= 4 ? '✓' : '○'} Generating pseudo-labels (&gt;85% conf)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <span className={uploadProgressStep >= 5 ? 'text-emerald-600' : 'text-gray-400'}>
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
