import React from 'react';
import { NavigationTab, ActiveLearningRound } from '../types';
import { getLabellessEffort } from '../data/realMetrics';
import {
  LayoutDashboard,
  UploadCloud,
  Cpu,
  Layers,
  Edit3,
  TrendingUp,
  Download,
  Settings,
  Sparkles,
  FileCheck2,
} from 'lucide-react';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  pendingReviewCount: number;
  rounds?: ActiveLearningRound[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingReviewCount,
  rounds,
}) => {
  const effort = getLabellessEffort();
  const latestRound = rounds && rounds.length > 0 ? rounds[rounds.length - 1] : null;
  const currentMap = latestRound ? `${latestRound.mAP50}%` : `${(effort.final_mAP50 * 100).toFixed(1)}%`;
  const effortSaved = `${effort.effort_reduction_vs_baseline_pct.toFixed(0)}% Saved`;
  const sections = [
    {
      group: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        { id: 'landing', label: 'Project Home / Pitch', icon: Sparkles, badge: 'Hero' },
      ],
    },
    {
      group: 'DATA',
      items: [
        { id: 'upload', label: 'Datasets & Setup', icon: UploadCloud, badge: null },
        { id: 'processing', label: 'AI Annotation', icon: Cpu, badge: 'Live' },
      ],
    },
    {
      group: 'INTELLIGENCE',
      items: [
        {
          id: 'queue',
          label: 'Review Queue',
          icon: Layers,
          badge: pendingReviewCount > 0 ? `${pendingReviewCount}` : null,
          badgeColor: 'bg-red-50 text-red-600',
        },
        { id: 'workspace', label: 'Annotation Studio', icon: Edit3, badge: null },
      ],
    },
    {
      group: 'IMPROVEMENT',
      items: [
        { id: 'evidence', label: 'Experiment Evidence', icon: FileCheck2, badge: 'Verified' },
        { id: 'evolution', label: 'Model Impact & Experiments', icon: TrendingUp, badge: effortSaved },
      ],
    },
    {
      group: 'OUTPUT',
      items: [
        { id: 'export', label: 'Export Dataset', icon: Download, badge: 'YOLO/COCO' },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Pipeline Settings', icon: Settings, badge: null },
      ],
    },
  ];

  return (
    <aside
      id="main-app-sidebar"
      className="w-full lg:w-64 shrink-0 border-r border-gray-200 bg-white p-4 flex flex-col justify-between h-full overflow-y-auto"
    >
      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.group} className="space-y-2">
            <h4 className="px-3 text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
              {section.group}
            </h4>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}-btn`}
                    onClick={() => setActiveTab(item.id as NavigationTab)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-gray-900 font-semibold'
                        : 'text-gray-600 font-medium hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                          item.badgeColor || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Mini Active Learning Health Indicator in Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <div className="px-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-gray-500 font-medium">
            <span>mAP@50: <span className="text-gray-900 font-semibold">{currentMap}</span></span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs uppercase tracking-wider text-gray-500">Online</span>
            </div>
          </div>
          <div className="text-[11px] text-gray-500">
            Routing high-entropy samples to queue. Confident samples auto-tagged.
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 pt-1 border-t border-gray-200">
            <span>mAP@50: <b className="text-gray-900">{currentMap}</b></span>
            <span>Effort: <b className="text-emerald-600">-{effort.effort_reduction_vs_baseline_pct.toFixed(0)}%</b></span>
          </div>
        </div>
      </div>
    </aside>
  );
};
