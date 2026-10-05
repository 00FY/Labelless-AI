import React, { useState } from 'react';
import { ProjectConfig, DatasetItem } from '../types';
import { getRun } from '../data/measuredResults';
import { getPipelineConfig } from '../data/pipelineConfig';

// Map a box label ("Damaged Building" or "damagedbuilding") to its YOLO class id
const classIdFor = (label: string): number => {
  const norm = label.toLowerCase().replace(/\s+/g, '');
  const cls = getPipelineConfig().classes.find((c) => c.yolo_name === norm);
  return cls ? cls.id : -1;
};
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
        // A human-reviewed item is a correction only if a box was edited; otherwise the AI labels were accepted
        const edited = item.boxes.some((b) => b.isHumanCorrected);
        const action = item.status === 'rejected' ? 'reject' : item.status === 'human_reviewed' && edited ? 'correct' : 'accept';
        return {
          image_id: item.filename || `${item.id}.png`,
          action: action,
          boxes: action === 'reject' ? [] : item.boxes.filter((b) => classIdFor(b.label) >= 0).map((b) => {
            const normName = b.label.toLowerCase().replace(/\s+/g, '');
            const clsId = classIdFor(b.label);
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

  // Items that belong in a training export: reviewed or auto-labelled, never pending/rejected
  const exportableItems = datasetItems.filter(
    (i) =>
      (i.status === 'human_reviewed' && includeHumanVerified) ||
      (i.status === 'auto_labeled' && includeHighConfPseudo)
  );

  // YOLO format: "<class_id> <x_center> <y_center> <width> <height>", normalised 0-1.
  // Box x/y are top-left percentages, so convert to centres.
  const getYoloPreview = () => {
    const classes = getPipelineConfig().classes;
    const header = [
      '# LabelLess AI Export - YOLOv8 Format',
      `# Dataset: ${config.datasetName} | Round ${config.currentRound}`,
      `# Classes: ${classes.map((c) => `${c.id}=${c.yolo_name}`).join(', ')}`,
    ];
    const blocks = exportableItems
      .filter((i) => i.boxes.length > 0)
      .slice(0, 10)
      .map((item) => {
        const source = item.status === 'human_reviewed' ? 'Human Verified' : 'Auto Pseudo-Label';
        const lines = item.boxes
          .filter((b) => classIdFor(b.label) >= 0)
          .map((b) => {
            const xc = (b.x + b.width / 2) / 100;
            const yc = (b.y + b.height / 2) / 100;
            return `${classIdFor(b.label)} ${xc.toFixed(4)} ${yc.toFixed(4)} ${(b.width / 100).toFixed(4)} ${(
              b.height / 100
            ).toFixed(4)}  # ${b.label} (${source})`;
          });
        return [`# ${item.filename}`, ...lines].join('\n');
      });
    if (blocks.length === 0) blocks.push('# No reviewed or auto-labelled images with boxes yet');
    return [...header, '', ...blocks].join('\n\n');
  };

  const getCocoPreview = () => {
    const imgSize = getPipelineConfig().training.image_size;
    return JSON.stringify(
      {
        info: {
          description: config.datasetName,
          version: config.modelVersion,
          generator: 'LabelLess AI Active Learning Engine',
          date_created: '2026-08-27',
        },
        categories: getPipelineConfig().classes.map((c) => ({ id: c.id, name: c.yolo_name, supercategory: 'disaster' })),
        images: exportableItems.slice(0, 10).map((item, idx) => ({
          id: idx + 1,
          file_name: item.filename || `${item.id}.png`,
          width: imgSize,
          height: imgSize,
        })),
        annotations: exportableItems.slice(0, 10).flatMap((item, idx) =>
          item.boxes.map((box, bIdx) => ({
            id: idx * 10 + bIdx + 1,
            image_id: idx + 1,
            category_id: classIdFor(box.label),
            // COCO bbox is [x, y, width, height] in pixels; boxes are stored as percentages
            bbox: [box.x, box.y, box.width, box.height].map((v) => Number(((v / 100) * imgSize).toFixed(1))),
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
    const meta = JSON.stringify(
      {
        model: config.modelType,
        version: config.modelVersion,
        active_round: config.currentRound,
        mAP50: parseFloat((getRun('labelless').mAP50 * 100).toFixed(1)),
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
    <div id="export-page-root" className="space-y-8 pb-12 max-w-5xl mx-auto text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3 mb-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
            Export Dataset & Model Checkpoints
          </h1>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
            Production Output
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600">
          Export verified annotations in standardized computer vision formats or export retrained PyTorch / ONNX weights.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-6 space-y-6">
          {/* Dataset Ingestion Summary */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold font-mono-code uppercase tracking-widest text-slate-500 section-label">
              Dataset Manifest ({datasetItems.length.toLocaleString()} Images)
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="flex items-center gap-2 text-emerald-700 font-semibold font-mono-code">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Auto-Labeled (&gt;85% Conf)
                </span>
                <span className="font-mono-code font-bold text-slate-900">
                  {totalAuto.toLocaleString()} images
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="flex items-center gap-2 text-sky-700 font-semibold font-mono-code">
                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                  Human-Reviewed & Corrected
                </span>
                <span className="font-mono-code font-bold text-slate-900">
                  {totalHuman.toLocaleString()} images
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="flex items-center gap-2 text-slate-600 font-semibold font-mono-code">
                  <Layers className="w-4 h-4 text-slate-400" />
                  Pending / Queued
                </span>
                <span className="font-mono-code font-bold text-slate-600">
                  {totalPending.toLocaleString()} images
                </span>
              </div>
            </div>
          </div>

          {/* Export Format Selection */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold font-mono-code uppercase tracking-widest text-slate-500 section-label">
              Export Annotation Format
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'human_labels', label: 'human_labels.json', desc: 'Person D Retrain Pipeline' },
                { id: 'yolo', label: 'YOLOv8 (.txt)', desc: 'Ultralytics PyTorch / Darknet' },
                { id: 'coco', label: 'COCO (.json)', desc: 'Standard JSON instances format' },
                { id: 'json', label: 'Custom JSON', desc: 'Full active-learning metadata' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id as any)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    format === f.id
                      ? 'bg-slate-50 border-emerald-500 ring-1 ring-emerald-200 text-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  <div className="text-xs font-bold font-mono-code text-slate-900">{f.label}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{f.desc}</div>
                </button>
              ))}
            </div>

            {/* Inclusions Filter Checkboxes */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <label className="text-xs font-bold font-mono-code uppercase tracking-widest text-slate-500 section-label">
                Include in Export:
              </label>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHumanVerified}
                    onChange={(e) => setIncludeHumanVerified(e.target.checked)}
                    className="rounded bg-slate-50 border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <span>Human verified & corrected ground truth ({totalHuman.toLocaleString()})</span>
                </label>

                <label className="flex items-center gap-2.5 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHighConfPseudo}
                    onChange={(e) => setIncludeHighConfPseudo(e.target.checked)}
                    className="rounded bg-slate-50 border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <span>High-confidence AI pseudo-labels ({totalAuto.toLocaleString()})</span>
                </label>

                <label className="flex items-center gap-2.5 text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLowConf}
                    onChange={(e) => setIncludeLowConf(e.target.checked)}
                    className="rounded bg-slate-50 border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <span>Low-confidence raw predictions (Not recommended)</span>
                </label>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
              <button
                id="download-dataset-btn"
                onClick={handleDownloadDataset}
                disabled={isExporting}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all flex items-center justify-center gap-2 font-mono-code uppercase tracking-wider cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Packaging Archive...' : 'Export Dataset Archive'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Code & File Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold font-mono-code uppercase tracking-widest text-slate-500 section-label">
                  Payload Preview ({format.toUpperCase()})
                </h3>
              </div>

              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono-code border border-slate-200 flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{isCopied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono-code text-emerald-400 overflow-x-auto max-h-[320px] leading-relaxed shadow-inner scrollbar-thin">
              {getActivePreview()}
            </pre>
          </div>

          {/* NEW COMING SOON CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-2.5 right-2.5 bg-slate-100 text-slate-500 text-[9px] font-mono-code font-bold px-2 py-0.5 rounded uppercase tracking-wider">Soon</div>
              <h4 className="text-xs font-bold font-mono-code text-slate-900 pr-10">Export ONNX</h4>
              <p className="text-[10px] text-slate-500">Cross-platform hardware inference format</p>
            </div>
            
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-2.5 right-2.5 bg-slate-100 text-slate-500 text-[9px] font-mono-code font-bold px-2 py-0.5 rounded uppercase tracking-wider">Soon</div>
              <h4 className="text-xs font-bold font-mono-code text-slate-900 pr-10">Export TFLite</h4>
              <p className="text-[10px] text-slate-500">Mobile edge & Android runtime model</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2 flex flex-col justify-between cursor-pointer hover:border-emerald-500/50 hover:bg-slate-50 transition-all group" onClick={handleDownloadModel}>
              <Cpu className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <div>
                <h4 className="text-xs font-bold font-mono-code text-slate-900">best.pt Weights</h4>
                <p className="text-[10px] text-slate-500">Download active PyTorch checkpoint</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
