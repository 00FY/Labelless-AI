import React, { useState } from 'react';
import { DatasetItem, NavigationTab } from '../types';
import {
  Layers,
  Filter,
  Search,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Eye,
  Info,
  Clock,
} from 'lucide-react';

interface SmartReviewQueuePageProps {
  datasetItems: DatasetItem[];
  onSelectImage: (item: DatasetItem) => void;
  onExplainItem: (item: DatasetItem) => void;
  setActiveTab: (tab: NavigationTab) => void;
}

export const SmartReviewQueuePage: React.FC<SmartReviewQueuePageProps> = ({
  datasetItems,
  onSelectImage,
  onExplainItem,
  setActiveTab,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<DatasetItem | null>(
    datasetItems[0] || null
  );

  // Filter items
  const filteredItems = datasetItems.filter((item) => {
    if (priorityFilter !== 'all' && item.priorityLevel !== priorityFilter) return false;
    if (classFilter !== 'all' && item.predictedClass !== classFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.predictedClass.toLowerCase().includes(q) ||
        item.reasons.some((r) => r.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getScoreTag = (score: number) => {
    if (score >= 0.75) return { text: 'HIGH', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    if (score >= 0.45) return { text: 'MED', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { text: 'LOW', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  };

  return (
    <div id="smart-review-queue-page" className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Smart Review Queue
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Active Learning Ranked
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            LabelLess AI ranked these images by the expected value of human feedback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-zinc-400 font-medium">Prioritized for Human Attention</div>
            <div className="text-sm font-mono font-bold text-blue-400">
              {filteredItems.length} of {datasetItems.length} images shown
            </div>
          </div>
        </div>
      </div>

      {/* TOP FILTER BAR */}
      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-lg space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span>Active Filter & Query Controls</span>
          </div>
          <button
            onClick={() => {
              setPriorityFilter('all');
              setClassFilter('all');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="text-[11px] text-zinc-400 hover:text-blue-400 transition-colors"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Priority */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400">Priority Level</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">🔴 Critical (&ge;0.90)</option>
              <option value="high">🟠 High (0.80 - 0.89)</option>
              <option value="medium">🟡 Medium (0.50 - 0.79)</option>
              <option value="low">🟢 Low / Auto (&lt;0.50)</option>
            </select>
          </div>

          {/* Class */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400">Predicted Class</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Classes</option>
              <option value="Building">Building (Structural)</option>
              <option value="Fire">Fire (Rare 5.4%)</option>
              <option value="Debris">Debris (Rare 3.2%)</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Person">Person</option>
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400">Queue Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="pending">Pending Review Only</option>
              <option value="human_reviewed">Human Reviewed</option>
              <option value="auto_labeled">Auto-Labeled</option>
              <option value="all">All Statuses</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400">Search ID or Reason</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search #1842, Fire, smoke..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Table + Side Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table Column */}
        <div className="lg:col-span-8 space-y-3">
          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-3 py-3">Thumbnail</th>
                  <th className="px-3 py-3">Image ID</th>
                  <th className="px-3 py-3">Predicted Class</th>
                  <th className="px-3 py-3">Conf.</th>
                  <th className="px-2 py-3 text-center">Unc.</th>
                  <th className="px-2 py-3 text-center">Div.</th>
                  <th className="px-2 py-3 text-center">Rare</th>
                  <th className="px-3 py-3">Priority</th>
                  <th className="px-3 py-3">Flags / Reason</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-zinc-500">
                      No images match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const uncTag = getScoreTag(item.uncertaintyScore);
                    const divTag = getScoreTag(item.diversityScore);
                    const isSelected = selectedPreviewItem?.id === item.id;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedPreviewItem(item)}
                        className={`cursor-pointer transition-colors group ${
                          isSelected
                            ? 'bg-blue-500/10 border-l-2 border-blue-400'
                            : 'hover:bg-zinc-900/70'
                        }`}
                      >
                        {/* Thumbnail */}
                        <td className="px-3 py-2.5">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-12 h-9 rounded-lg object-cover border border-zinc-700 shrink-0"
                          />
                        </td>

                        {/* ID */}
                        <td className="px-3 py-2.5 font-mono font-bold text-zinc-200 group-hover:text-blue-300">
                          {item.id}
                        </td>

                        {/* Predicted Class */}
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {item.predictedClass}
                          </span>
                        </td>

                        {/* Confidence */}
                        <td className="px-3 py-2.5 font-mono font-bold text-zinc-200">
                          <span
                            className={
                              item.confidence >= 0.85
                                ? 'text-emerald-400'
                                : item.confidence >= 0.60
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }
                          >
                            {(item.confidence * 100).toFixed(0)}%
                          </span>
                        </td>

                        {/* Uncertainty */}
                        <td className="px-2 py-2.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${uncTag.color}`}>
                            {uncTag.text}
                          </span>
                        </td>

                        {/* Diversity */}
                        <td className="px-2 py-2.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${divTag.color}`}>
                            {divTag.text}
                          </span>
                        </td>

                        {/* Rare Class */}
                        <td className="px-2 py-2.5 text-center">
                          {item.rareClassScore >= 0.6 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              YES
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-zinc-500">NO</span>
                          )}
                        </td>

                        {/* Priority Score */}
                        <td className="px-3 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 w-fit border ${
                              item.priorityLevel === 'critical'
                                ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                                : item.priorityLevel === 'high'
                                ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                            }`}
                          >
                            <span>{item.priorityLevel === 'critical' ? '🔴' : item.priorityLevel === 'high' ? '🟠' : '🟡'}</span>
                            <span>{item.priorityScore.toFixed(2)}</span>
                          </span>
                        </td>

                        {/* Flags */}
                        <td className="px-3 py-2.5">
                          <span className="text-[11px] text-zinc-400 truncate max-w-[120px] block">
                            {item.reasons.length} flags: {item.reasons[0]}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onExplainItem(item);
                              }}
                              className="px-2 py-1 text-[10px] font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 transition-colors"
                            >
                              Explain
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectImage(item);
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold text-zinc-950 bg-blue-500 hover:bg-blue-400 rounded shadow transition-all"
                            >
                              Review →
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Selected Image Deep Score Card & "Why This Image?" (The Core Innovation Pitch Feature!) */}
        <div className="lg:col-span-4 space-y-4">
          {selectedPreviewItem ? (
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4 sticky top-20">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">
                    Active Learning Diagnostic
                  </span>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>WHY THIS IMAGE?</span>
                    <span className="font-mono text-zinc-400 font-normal">({selectedPreviewItem.id})</span>
                  </h3>
                </div>

                <button
                  onClick={() => onExplainItem(selectedPreviewItem)}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold border border-blue-500/30 transition-colors"
                >
                  Full Modal
                </button>
              </div>

              {/* Image Preview */}
              <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-black aspect-video">
                <img
                  src={selectedPreviewItem.imageUrl}
                  alt={selectedPreviewItem.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[11px] font-mono text-zinc-200 border border-zinc-700">
                  {selectedPreviewItem.predictedClass} ({(selectedPreviewItem.confidence * 100).toFixed(0)}%)
                </div>
              </div>

              {/* Priority Score Display */}
              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Review Priority Score
                  </span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-rose-950/80 text-rose-300 border border-rose-700">
                    {selectedPreviewItem.priorityScore.toFixed(2)} VERY HIGH
                  </span>
                </div>

                {/* Score breakdown bars */}
                <div className="space-y-2 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-amber-400">Uncertainty</span>
                      <span className="font-mono text-zinc-300">
                        +{(selectedPreviewItem.explanation.uncertaintyContribution).toFixed(2)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${selectedPreviewItem.uncertaintyScore * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-400">Diversity</span>
                      <span className="font-mono text-zinc-300">
                        +{(selectedPreviewItem.explanation.diversityContribution).toFixed(2)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full"
                        style={{ width: `${selectedPreviewItem.diversityScore * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-rose-400">Rare Class</span>
                      <span className="font-mono text-zinc-300">
                        +{(selectedPreviewItem.explanation.rareClassContribution).toFixed(2)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-400 rounded-full"
                        style={{ width: `${selectedPreviewItem.rareClassScore * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation and Reasons */}
              <div className="space-y-2 text-xs">
                <div className="text-zinc-300 font-semibold">
                  Active Learning Recommendation:
                </div>
                <p className="text-blue-300 font-medium">
                  {selectedPreviewItem.explanation.recommendation}
                </p>

                <ul className="space-y-1 pt-1 text-zinc-400">
                  {selectedPreviewItem.explanation.bulletPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-blue-400 font-bold">&bull;</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action */}
              <button
                id="open-workspace-from-queue-btn"
                onClick={() => onSelectImage(selectedPreviewItem)}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-zinc-950 bg-blue-500 hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5"
              >
                <span>Open in Annotation Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center text-xs text-zinc-500">
              Select an image from the queue to inspect its active-learning score.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
