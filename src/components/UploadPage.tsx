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

const DEMO_POOL_SIZE = 971;

export const UploadPage: React.FC<UploadPageProps> = ({
  config,
  setConfig,
  onStartProcessing,
  setActiveTab,
}) => {
  const [newClassInput, setNewClassInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  // Starts with the demo pool that has already been processed offline
  const [uploadedFilesCount, setUploadedFilesCount] = useState(DEMO_POOL_SIZE);
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
    <div id="upload-page-root" className="space-y-8 pb-12 max-w-5xl mx-auto text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3 mb-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
            Create Annotation Project
          </h1>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
            Pipeline Setup
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600">
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
              setUploadedFilesCount(e.dataTransfer.files.length);
            }}
            className={`relative rounded-2xl border-2 border-dashed transition-all p-8 text-center flex flex-col items-center justify-center gap-3 bg-white ${
              isDragging
                ? 'border-emerald-500 bg-slate-50 scale-[1.01]'
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
            }`}
          >
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold font-display text-slate-900">
                Drop unlabelled disaster images here
              </h3>
              <p className="text-xs text-slate-500 font-mono-code">
                PNG &bull; JPG &bull; JPEG &bull; WebP
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <label
                htmlFor="file-input"
                className="cursor-pointer px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm font-mono-code uppercase tracking-wider"
              >
                Browse Files
              </label>
              <input
                id="file-input"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setUploadedFilesCount(e.target.files?.length ?? 0)}
              />

              <button
                type="button"
                onClick={() => setUploadedFilesCount(DEMO_POOL_SIZE)}
                className="px-4 py-2.5 text-xs font-mono-code font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors shadow-xs cursor-pointer"
              >
                Use Demo Pool ({DEMO_POOL_SIZE} images)
              </button>
            </div>

            <div className="pt-2 text-xs text-emerald-700 font-mono-code flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{uploadedFilesCount.toLocaleString()} images selected</span>
            </div>
            <p className="text-[11px] text-slate-500 max-w-md leading-relaxed italic">
              Preview only: images are not sent to a server from this page. Detection and ranking run offline with{' '}
              <code className="font-mono-code text-slate-700">python run_pipeline.py</code>, and the demo pool shown in the
              review queue was processed that way.
            </p>
          </div>

          {/* Dataset Name & Classes */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-sm">
            <div className="space-y-2">
              <label className="text-xs font-bold font-mono-code uppercase tracking-widest text-slate-500 section-label">
                Dataset Name
              </label>
              <input
                type="text"
                value={config.datasetName}
                onChange={(e) => setConfig((p) => ({ ...p, datasetName: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-400 font-medium transition-shadow"
              />
            </div>

            {/* Target Classes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold font-mono-code uppercase tracking-widest text-slate-500 section-label">
                  Target Object Classes ({config.classes.length})
                </label>
                <span className="text-[11px] text-slate-500 font-mono-code">Bounding box categories</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {config.classes.map((cls) => (
                  <span
                    key={cls}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono-code font-semibold text-slate-800"
                  >
                    <span>{cls}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveClass(cls)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
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
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-shadow"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 text-xs font-bold font-mono-code text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Add Class</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Col: Model & Active Learning Hyperparameters */}
        <div className="lg:col-span-5 space-y-6">
          {/* Model & Strategy */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold font-mono-code uppercase tracking-widest text-slate-500 section-label">
                Detection Model Configuration
              </h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-600 font-medium">Pretrained CV Backbone</label>
              <select
                value={config.modelType}
                onChange={(e) => setConfig((p) => ({ ...p, modelType: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono-code font-semibold focus:outline-none focus:border-slate-400"
              >
                <option value="YOLOv8">YOLOv8 — Ultralytics PyTorch (Recommended)</option>
                <option value="RT-DETR">RT-DETR — Real-Time Detection Transformer</option>
                <option value="YOLOv9">YOLOv9 — Programmable Gradient Information</option>
                <option value="SAM-2">SAM-2 Assisted Zero-Shot Segmentation</option>
              </select>
            </div>

            {/* Annotation Strategy Selector */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <label className="text-xs font-bold font-mono-code uppercase tracking-widest text-slate-500 section-label">
                Active Annotation Strategy
              </label>

              <div className="space-y-2.5">
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
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      config.strategy === s.id
                        ? 'bg-slate-50 border-emerald-500 ring-1 ring-emerald-200 text-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
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
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                    />
                    <div>
                      <div className={`text-xs font-bold font-mono-code ${config.strategy === s.id ? 'text-emerald-700' : 'text-slate-800'}`}>{s.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{s.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Active Learning Hyperparameters */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold font-mono-code uppercase tracking-widest text-slate-500 section-label">
                  Review Priority Weights
                </h3>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-mono-code font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Recommended
              </span>
            </div>

            {/* Confidence Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-700 font-medium">Auto-Accept Confidence Threshold</span>
                <span className="font-mono-code font-bold text-emerald-700">
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
                className="w-full accent-emerald-600 bg-slate-200 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono-code">
                <span>0.70 (Aggressive)</span>
                <span>0.85 (Default)</span>
                <span>0.98 (Strict)</span>
              </div>
            </div>

            {/* Weights Sliders */}
            <div className="space-y-3.5 pt-4 border-t border-slate-200">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 font-semibold font-mono-code">Uncertainty Weight</span>
                  <span className="font-mono-code text-slate-500">{(config.uncertaintyWeight * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${config.uncertaintyWeight * 100}%` }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 font-semibold font-mono-code">Diversity (Scene Complexity)</span>
                  <span className="font-mono-code text-slate-500">{(config.diversityWeight * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-600 rounded-full" style={{ width: `${config.diversityWeight * 100}%` }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 font-semibold font-mono-code">Rare Class Imbalance Weight</span>
                  <span className="font-mono-code text-slate-500">{(config.rareClassWeight * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-600 rounded-full" style={{ width: `${config.rareClassWeight * 100}%` }}></div>
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
              className="w-full py-4 px-6 rounded-2xl font-bold font-mono-code uppercase tracking-wider text-xs text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSimulatingUpload ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Initializing Active Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Run AI Annotation Pipeline</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>

            {/* Pipeline stage preview (animation only; the real pipeline runs offline) */}
            {isSimulatingUpload && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 text-xs font-mono-code shadow-sm"
              >
                <div className="flex items-center gap-2 text-slate-700">
                  <span className={uploadProgressStep >= 1 ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                    {uploadProgressStep >= 1 ? '✓' : '○'} Uploading {uploadedFilesCount.toLocaleString()} disaster frames
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className={uploadProgressStep >= 2 ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                    {uploadProgressStep >= 2 ? '✓' : '○'} Loading {config.modelType} neural weights
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className={uploadProgressStep >= 3 ? 'text-sky-700 font-bold animate-pulse' : 'text-slate-400'}>
                    {uploadProgressStep >= 3 ? '◐' : '○'} Running batch tensor detection
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className={uploadProgressStep >= 4 ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                    {uploadProgressStep >= 4 ? '✓' : '○'} Generating pseudo-labels (&gt;85% conf)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className={uploadProgressStep >= 5 ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
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
