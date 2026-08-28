import React, { useState } from 'react';
import { ProjectConfig, DatasetItem } from '../types';
import { getLabellessEffort } from '../data/realMetrics';
import {
  Download,
  FileCode,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExportPageProps {
  config: ProjectConfig;
  datasetItems: DatasetItem[];
}

export const ExportPage: React.FC<ExportPageProps> = ({ config, datasetItems }) => {
  const [format, setFormat] = useState<'yolo' | 'coco' | 'pascal' | 'json' | 'human_labels'>('human_labels');
  const [includeHumanVerified, setIncludeHumanVerified] = useState(true);
  const [includeHighConfPseudo, setIncludeHighConfPseudo] = useState(true);
  const [includeLowConf, setIncludeLowConf] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const totalAuto = datasetItems.filter((i) => i.status === 'auto_labeled').length;
  const totalHuman = datasetItems.filter((i) => i.status === 'human_reviewed').length;
  const totalPending = datasetItems.filter((i) => i.status === 'pending').length;

  // Person D Retraining Pipeline format (inputs/human_labels.json)
  const getHumanLabelsPayload = () => {
    const labels = datasetItems
      .filter((item) => {
        if (item.status === 'pending' && !includeLowConf) return false;
        if (item.status === 'human_reviewed' && !includeHumanVerified) return false;
        if (item.status === 'auto_labeled' && !includeHighConfPseudo) return false;
        return true;
      })
      .map((item) => {
        const action = item.status === 'rejected' ? 'reject' : item.status === 'human_reviewed' ? 'correct' : 'accept';
        return {
          image_id: item.filename || `${item.id}.png`,
          action: action,
          boxes: action === 'reject' ? [] : item.boxes.map((b) => {
            const normName = b.label.toLowerCase().replace(/\s+/g, '');
            const clsId = normName.includes('undamaged')
              ? 0
              : normName.includes('damaged')
              ? 1
              : normName.includes('fire')
              ? 2
              : normName.includes('smoke')
              ? 3
              : 0;
            return {
              class_id: clsId,
              class_name: normName,
              x: Number(b.x.toFixed(2)),
              y: Number(b.y.toFixed(2)),
              width: Number(b.width.toFixed(2)),
              height: Number(b.height.toFixed(2)),
              confidence: Number((b.confidence ?? 1.0).toFixed(2)),
            };
          }),
        };
      });

    return { labels };
  };

  const getHumanLabelsPreview = () => {
    return JSON.stringify(getHumanLabelsPayload(), null, 2);
  };

  // Sample exported payload preview
  const getYoloPreview = () => {
    return `# LabelLess AI Export - YOLOv8 Format
# Dataset: ${config.datasetName} | Round ${config.currentRound}
# Classes: ${config.classes.join(', ')}

# image_1842.jpg
0 0.4500 0.4900 0.6400 0.6800  # Building (Human Verified)
4 0.6400 0.7900 0.3800 0.2800  # Debris (Human Verified)

# image_0921.jpg
3 0.5400 0.5200 0.4400 0.4800  # Fire (Human Verified)
2 0.4900 0.6600 0.8200 0.5200  # Building (Human Verified)

# image_0194.jpg
1 0.5100 0.5200 0.5800 0.5200  # Vehicle (Auto Pseudo-Label: 98% conf)`;
  };

  const getCocoPreview = () => {
    return JSON.stringify(
      {
        info: {
          description: config.datasetName,
          version: config.modelVersion,
          generator: 'LabelLess AI Active Learning Engine',
          date_created: '2026-08-27',
        },
        categories: config.classes.map((c, i) => ({ id: i, name: c, supercategory: 'disaster' })),
        images: datasetItems.slice(0, 10).map((item, idx) => ({
          id: idx + 1,
          file_name: item.filename || `${item.id}.png`,
          width: 1000,
          height: 800,
        })),
        annotations: datasetItems.slice(0, 10).flatMap((item, idx) =>
          item.boxes.map((box, bIdx) => ({
            id: idx * 10 + bIdx + 1,
            image_id: idx + 1,
            category_id: 1,
            bbox: [box.x * 10, box.y * 8, box.width * 10, box.height * 8],
            confidence: box.confidence,
            is_human_verified: item.status === 'human_reviewed',
          }))
        ),
      },
      null,
      2
    );
  };

  const getActivePreview = () => {
    if (format === 'human_labels') return getHumanLabelsPreview();
    if (format === 'coco') return getCocoPreview();
    if (format === 'json') return JSON.stringify(datasetItems.slice(0, 5), null, 2);
    return getYoloPreview();
  };

  const handleDownloadDataset = () => {
    setIsExporting(true);
    setTimeout(() => {
      let content = getActivePreview();
      let filename = `labelless_${config.projectName.toLowerCase()}_${format}_annotations.txt`;
      let mime = 'text/plain;charset=utf-8';

      if (format === 'human_labels') {
        filename = 'human_labels.json';
        mime = 'application/json;charset=utf-8';
      } else if (format === 'coco' || format === 'json') {
        filename = `labelless_${format}_annotations.json`;
        mime = 'application/json;charset=utf-8';
      }

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsExporting(false);
      confetti({ particleCount: 50, spread: 70 });
    }, 600);
  };

  const handleDownloadModel = () => {
    const effort = getLabellessEffort();
    const meta = JSON.stringify(
      {
        model: config.modelType,
        version: config.modelVersion,
        active_round: config.currentRound,
        mAP50: parseFloat((effort.final_mAP50 * 100).toFixed(1)),
        weights: `models/round_${config.currentRound}/best.pt`,
        classes: config.classes,
      },
      null,
      2
    );
    const blob = new Blob([meta], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `yolov8_disaster_round${config.currentRound}_weights.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    confetti({ particleCount: 40, spread: 60 });
  };

  const handleCopy = () => {
    const text = getActivePreview();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div id="export-page-root" className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Export Dataset & Model Checkpoints
          </h1>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Production Output
          </span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-400">
          Export verified annotations in standardized computer vision formats or export retrained PyTorch / ONNX weights.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-6 space-y-6">
          {/* Dataset Ingestion Summary */}
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Dataset Manifest ({datasetItems.length.toLocaleString()} Images)
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800">
                <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Auto-Labeled (&gt;85% Conf)
                </span>
                <span className="font-mono font-bold text-zinc-200">
                  {totalAuto.toLocaleString()} images
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800">
                <span className="flex items-center gap-2 text-blue-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Human-Reviewed & Corrected
                </span>
                <span className="font-mono font-bold text-zinc-200">
                  {totalHuman.toLocaleString()} images
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800">
                <span className="flex items-center gap-2 text-rose-400 font-semibold">
                  <Layers className="w-4 h-4" />
                  Pending / Queued
                </span>
                <span className="font-mono font-bold text-zinc-400">
                  {totalPending.toLocaleString()} images
                </span>
              </div>
            </div>
          </div>

          {/* Export Format Selection */}
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Export Annotation Format
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'human_labels', label: 'human_labels.json', desc: 'Person D Retrain Pipeline' },
                { id: 'yolo', label: 'YOLOv8 (.txt)', desc: 'Ultralytics PyTorch / Darknet' },
                { id: 'coco', label: 'COCO (.json)', desc: 'Standard JSON instances format' },
                { id: 'json', label: 'Custom JSON', desc: 'Full active-learning metadata' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    format === f.id
                      ? 'bg-blue-500/15 border-blue-500/50 text-white shadow'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-xs font-bold">{f.label}</div>
                  <div className="text-[10px] text-zinc-400">{f.desc}</div>
                </button>
              ))}
            </div>

            {/* Inclusions Filter Checkboxes */}
            <div className="space-y-2 pt-3 border-t border-zinc-800">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Include in Export:
              </label>

              <div className="space-y-1.5 text-xs">
                <label className="flex items-center gap-2.5 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHumanVerified}
                    onChange={(e) => setIncludeHumanVerified(e.target.checked)}
                    className="rounded bg-zinc-950 border-zinc-700 text-blue-500"
                  />
                  <span>Human verified & corrected ground truth ({totalHuman.toLocaleString()})</span>
                </label>

                <label className="flex items-center gap-2.5 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHighConfPseudo}
                    onChange={(e) => setIncludeHighConfPseudo(e.target.checked)}
                    className="rounded bg-zinc-950 border-zinc-700 text-blue-500"
                  />
                  <span>High-confidence AI pseudo-labels ({totalAuto.toLocaleString()})</span>
                </label>

                <label className="flex items-center gap-2.5 text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLowConf}
                    onChange={(e) => setIncludeLowConf(e.target.checked)}
                    className="rounded bg-zinc-950 border-zinc-700 text-blue-500"
                  />
                  <span>Low-confidence raw predictions (Not recommended)</span>
                </label>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <button
                id="download-dataset-btn"
                onClick={handleDownloadDataset}
                disabled={isExporting}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-zinc-950 bg-blue-500 hover:bg-blue-400 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Packaging Archive...' : 'Export Dataset Archive'}</span>
              </button>

              <button
                id="download-model-btn"
                onClick={handleDownloadModel}
                className="py-3 px-4 rounded-xl font-bold text-xs text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors flex items-center justify-center gap-2"
              >
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Export Model Weights</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Code & File Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Export Payload Preview ({format.toUpperCase()})
                </h3>
              </div>

              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 transition-colors"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-[380px] leading-relaxed">
              {format === 'coco' ? getCocoPreview() : getYoloPreview()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
