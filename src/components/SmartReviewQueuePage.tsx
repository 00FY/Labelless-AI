import React, { useState } from 'react';
import { DatasetItem, NavigationTab } from '../types';
import { getPipelineConfig } from '../data/pipelineConfig';
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

  const levels = getPipelineConfig().routing.priority_levels;
  const fmt = (n: number) => n.toFixed(2);

  // Class options and their share of the loaded queue, computed from the data
  const classCounts: Record<string, number> = {};
  datasetItems.forEach((i) => {
    classCounts[i.predictedClass] = (classCounts[i.predictedClass] || 0) + 1;
  });
  const classOptions = Object.entries(classCounts).sort((a, b) => b[1] - a[1]);

  const priorityLabel = (level: DatasetItem['priorityLevel']) =>
    level === 'critical' ? 'CRITICAL' : level === 'high' ? 'HIGH' : level === 'medium' ? 'MEDIUM' : 'LOW';

  const getScoreTag = (score: number) => {
    if (score >= 0.75) return { text: 'HIGH', color: 'text-red-700 bg-red-50 border-red-200' };
    if (score >= 0.45) return { text: 'MED', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { text: 'LOW', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  return (
    <div id="smart-review-queue-page" className="space-y-10 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Smart Review Queue
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-gray-100 text-gray-600 border border-gray-200">
              Active Learning Ranked
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            LabelLess AI ranked these images by the expected value of human feedback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-gray-500 font-medium">Prioritized for Human Attention</div>
            <div className="text-sm font-mono font-bold text-gray-900">
              {filteredItems.length} of {datasetItems.length} images shown
            </div>
          </div>
        </div>
      </div>

      {/* TOP FILTER BAR */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2 section-label">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span>Active Filter & Query Controls</span>
          </div>
          <button
            onClick={() => {
              setPriorityFilter('all');
              setClassFilter('all');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="text-[11px] text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Priority Level</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
            >
              <option value="all">All Priorities</option>
              <option value="critical">🔴 Critical (&ge;{fmt(levels.critical)})</option>
              <option value="high">🟠 High ({fmt(levels.high)} – {fmt(levels.critical)})</option>
              <option value="medium">🟡 Medium ({fmt(levels.medium)} – {fmt(levels.high)})</option>
              <option value="low">🟢 Low (&lt;{fmt(levels.medium)})</option>
            </select>
          </div>

          {/* Class */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Predicted Class</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
            >
              <option value="all">All Classes</option>
              {classOptions.map(([cls, count]) => (
                <option key={cls} value={cls}>
                  {cls} ({((count / datasetItems.length) * 100).toFixed(1)}% of queue)
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Queue Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-medium focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
            >
              <option value="pending">Pending Review Only</option>
              <option value="human_reviewed">Human Reviewed</option>
              <option value="auto_labeled">Auto-Labeled</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Statuses</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Search ID or Reason</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search #1842, Fire, smoke..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-300 transition-colors"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Table + Side Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Table Column */}
        <div className="lg:col-span-8 space-y-3">
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-gray-200 bg-gray-50 text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Thumbnail</th>
                  <th className="px-3 py-3.5">Image ID</th>
                  <th className="px-3 py-3.5">Predicted Class</th>
                  <th className="px-3 py-3.5">Conf.</th>
                  <th className="px-2 py-3.5 text-center">Unc.</th>
                  <th className="px-2 py-3.5 text-center">Div.</th>
                  <th className="px-2 py-3.5 text-center">Rare</th>
                  <th className="px-3 py-3.5">Priority</th>
                  <th className="px-3 py-3.5">Flags / Reason</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium bg-white">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
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
                            ? 'bg-gray-50 border-l-2 border-gray-900'
                            : 'hover:bg-gray-50 border-l-2 border-transparent'
                        }`}
                      >
                        {/* Thumbnail */}
                        <td className="px-4 py-3">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.onerror = null;
                              target.src = '/predictions/00f205aea57febc8e82d4e99a18b1d51.png';
                            }}
                            className="w-12 h-9 rounded-md object-cover border border-gray-200 shrink-0"
                          />
                        </td>

                        {/* ID */}
                        <td className="px-3 py-3 font-mono font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {item.id}
                        </td>

                        {/* Predicted Class */}
                        <td className="px-3 py-3">
                          <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                            {item.predictedClass}
                          </span>
                        </td>

                        {/* Confidence */}
                        <td className="px-3 py-3 font-mono font-bold">
                          <span
                            className={
                              item.confidence >= 0.85
                                ? 'text-emerald-700'
                                : item.confidence >= 0.60
                                ? 'text-amber-600'
                                : 'text-red-600'
                            }
                          >
                            {(item.confidence * 100).toFixed(0)}%
                          </span>
                        </td>

                        {/* Uncertainty */}
                        <td className="px-2 py-3 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${uncTag.color}`}>
                            {uncTag.text}
                          </span>
                        </td>

                        {/* Diversity */}
                        <td className="px-2 py-3 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${divTag.color}`}>
                            {divTag.text}
                          </span>
                        </td>

                        {/* Rare Class */}
                        <td className="px-2 py-3 text-center">
                          {item.rareClassScore >= 0.6 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200">
                              YES
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-gray-400">NO</span>
                          )}
                        </td>

                        {/* Priority Score */}
                        <td className="px-3 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold flex items-center gap-1 w-fit border ${
                              item.priorityLevel === 'critical'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : item.priorityLevel === 'high'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            <span>{item.priorityLevel === 'critical' ? '🔴' : item.priorityLevel === 'high' ? '🟠' : item.priorityLevel === 'medium' ? '🟡' : '🟢'}</span>
                            <span>{item.priorityScore.toFixed(2)}</span>
                          </span>
                        </td>

                        {/* Flags */}
                        <td className="px-3 py-3">
                          <span className="text-[11px] text-gray-500 truncate max-w-[120px] block" title={item.reasons[0]}>
                            {item.reasons.length} flags: {item.reasons[0]}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onExplainItem(item);
                              }}
                              className="px-2.5 py-1 text-[10px] font-semibold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-md border border-gray-200 transition-colors"
                            >
                              Explain
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectImage(item);
                              }}
                              className="px-3 py-1 text-[10px] font-bold text-white bg-gray-900 hover:bg-gray-700 rounded-md transition-colors"
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

        {/* Right Side: Selected Image Deep Score Card */}
        <div className="lg:col-span-4 space-y-4">
          {selectedPreviewItem ? (
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-5 sticky top-20">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <span className="section-label block mb-1">
                    Active Learning Diagnostic
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <span>WHY THIS IMAGE?</span>
                    <span className="font-mono text-gray-500 font-normal text-xs">({selectedPreviewItem.id})</span>
                  </h3>
                </div>

                <button
                  onClick={() => onExplainItem(selectedPreviewItem)}
                  className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 text-xs font-semibold border border-gray-200 transition-colors"
                >
                  Full Modal
                </button>
              </div>

              {/* Image Preview */}
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 aspect-video">
                <img
                  src={selectedPreviewItem.imageUrl}
                  alt={selectedPreviewItem.title}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = '/predictions/00f205aea57febc8e82d4e99a18b1d51.png';
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-white/90 text-[11px] font-mono text-gray-900 border border-gray-200 shadow-sm font-semibold">
                  {selectedPreviewItem.predictedClass} ({(selectedPreviewItem.confidence * 100).toFixed(0)}%)
                </div>
              </div>

              {/* Priority Score Display */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Review Priority Score
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-md border ${
                      selectedPreviewItem.priorityLevel === 'critical'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : selectedPreviewItem.priorityLevel === 'high'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {selectedPreviewItem.priorityScore.toFixed(2)} {priorityLabel(selectedPreviewItem.priorityLevel)}
                  </span>
                </div>

                {/* Score breakdown bars */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-amber-700 font-medium">Uncertainty</span>
                      <span className="font-mono text-gray-600">
                        +{(selectedPreviewItem.explanation.uncertaintyContribution).toFixed(2)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${selectedPreviewItem.uncertaintyScore * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-700 font-medium">Diversity</span>
                      <span className="font-mono text-gray-600">
                        +{(selectedPreviewItem.explanation.diversityContribution).toFixed(2)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${selectedPreviewItem.diversityScore * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-red-700 font-medium">Rare Class</span>
                      <span className="font-mono text-gray-600">
                        +{(selectedPreviewItem.explanation.rareClassContribution).toFixed(2)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${selectedPreviewItem.rareClassScore * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation and Reasons */}
              <div className="space-y-2 text-xs">
                <div className="text-gray-900 font-semibold">
                  Active Learning Recommendation:
                </div>
                <p className="text-gray-600 font-medium">
                  {selectedPreviewItem.explanation.recommendation}
                </p>

                <ul className="space-y-1.5 pt-2 text-gray-500">
                  {selectedPreviewItem.explanation.bulletPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-gray-400 font-bold">&bull;</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action */}
              <button
                id="open-workspace-from-queue-btn"
                onClick={() => onSelectImage(selectedPreviewItem)}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gray-900 hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>Open in Annotation Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-gray-200 text-center text-sm text-gray-500 shadow-sm">
              Select an image from the queue to inspect its active-learning score.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
