import React from 'react';
import { NavigationTab, ActiveLearningRound, DatasetItem } from '../types';
import { getPoolRouting, getRun, pct } from '../data/measuredResults';
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
  datasetItems: DatasetItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingReviewCount,
  rounds,
  datasetItems,
}) => {
  const routing = getPoolRouting(datasetItems);
  const latestRound = rounds && rounds.length > 0 ? rounds[rounds.length - 1] : null;
  const currentMap = latestRound ? `${latestRound.mAP50}%` : pct(getRun('labelless').mAP50);
  const sections = [
    {
      group: 'WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        {
          id: 'queue',
          label: 'Review Queue',
          icon: Layers,
          badge: pendingReviewCount > 0 ? `${pendingReviewCount}` : null,
          badgeColor: 'bg-rose-50 text-rose-600 border border-rose-200',
        },
        { id: 'workspace', label: 'Annotation Studio', icon: Edit3, badge: null },
      ],
    },
    {
      group: 'ACTIVE LEARNING',
      items: [
        { id: 'evolution', label: 'Model Impact', icon: TrendingUp, badge: null },
        { id: 'evidence', label: 'Experiment Evidence', icon: FileCheck2, badge: 'Verified', badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
        { id: 'processing', label: 'Auto Annotation', icon: Cpu, badge: null },
        { id: 'upload', label: 'Datasets & Setup', icon: UploadCloud, badge: null },
      ],
    },
    {
      group: 'OUTPUT & CONFIG',
      items: [
        { id: 'export', label: 'Export Dataset', icon: Download, badge: null },
        { id: 'settings', label: 'Pipeline Settings', icon: Settings, badge: null },
        { id: 'landing', label: 'Project Overview', icon: Sparkles, badge: null },
      ],
    },
  ];

  return (
    <aside
      id="main-app-sidebar"
      className="w-full lg:w-60 shrink-0 border-r border-slate-200 bg-white p-3.5 flex flex-col justify-between h-full overflow-y-auto shadow-sm"
    >
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.group} className="space-y-1.5">
            <h4 className="px-3 text-[10px] font-mono-code font-bold tracking-widest text-slate-400 uppercase">
              {section.group}
            </h4>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}-btn`}
                    onClick={() => setActiveTab(item.id as NavigationTab)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm border border-slate-900'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold ${
                          item.badgeColor || 'bg-slate-100 text-slate-700 border border-slate-200'
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

      {/* Clean Status Pill in Footer */}
      <div className="mt-6 pt-3 border-t border-slate-200">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono-code space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[11px]">Accuracy</span>
            <span className="font-bold text-slate-900">{currentMap} mAP</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[11px]">Sent to Humans</span>
            <span className="font-bold text-emerald-600">{pct(routing.humanFraction)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
