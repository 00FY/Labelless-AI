import React from 'react';
import { NavigationTab } from '../types';
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
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  pendingReviewCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingReviewCount,
}) => {
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
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        },
        { id: 'workspace', label: 'Annotation Studio', icon: Edit3, badge: null },
      ],
    },
    {
      group: 'IMPROVEMENT',
      items: [
        { id: 'evolution', label: 'Model Impact & Experiments', icon: TrendingUp, badge: '64% Saved' },
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
      className="w-full lg:w-64 shrink-0 border-r border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md p-3 flex flex-col justify-between"
    >
      <div className="space-y-5">
        {sections.map((section) => (
          <div key={section.group} className="space-y-1">
            <h4 className="px-3 text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          item.badgeColor || (isActive ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700')
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
      <div className="mt-6 pt-3 border-t border-zinc-800/80">
        <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Active Learning Loop
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">ONLINE</span>
          </div>

          <div className="text-[11px] text-zinc-400">
            Routing high-entropy samples to queue. Confident samples auto-tagged.
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1 border-t border-zinc-800">
            <span>mAP@50: <b className="text-zinc-200">86.4%</b></span>
            <span>Effort: <b className="text-emerald-400">-64%</b></span>
          </div>
        </div>
      </div>
    </aside>
  );
};
