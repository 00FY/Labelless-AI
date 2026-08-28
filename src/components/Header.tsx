import React from 'react';
import { ProjectConfig, NavigationTab } from '../types';
import { Activity, Sparkles, Database, Cpu, PlayCircle, Eye } from 'lucide-react';

interface HeaderProps {
  config: ProjectConfig;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  onOpenDemoTour: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  activeTab,
  setActiveTab,
  onOpenDemoTour,
}) => {
  const getStatusBadge = () => {
    switch (config.pipelineStatus) {
      case 'processing':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>◐ PROCESSING</span>
          </div>
        );
      case 'round_complete':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>✓ ROUND {config.currentRound} COMPLETE</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>● PIPELINE ACTIVE</span>
          </div>
        );
    }
  };

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md px-4 lg:px-6 py-2.5"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <button
            id="brand-logo-btn"
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-3 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-lg border border-blue-400/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  LabelLess AI
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  Active Learning
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">
                AI-Powered Annotation Assistant
              </p>
            </div>
          </button>

          <div className="md:hidden">
            {getStatusBadge()}
          </div>
        </div>

        {/* Center: Project Metadata Bar */}
        <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-zinc-400">Project:</span>
            <span className="font-semibold text-zinc-200">{config.projectName}</span>
          </div>

          <div className="w-px h-3.5 bg-zinc-700/60"></div>

          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="text-zinc-400">Dataset:</span>
            <span className="font-medium text-zinc-200">{config.datasetName}</span>
          </div>

          <div className="w-px h-3.5 bg-zinc-700/60"></div>

          <div className="flex items-center gap-1.5 text-zinc-300">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-zinc-400">Model:</span>
            <span className="font-mono font-semibold text-indigo-300">
              {config.modelType} <span className="text-[10px] text-zinc-400">{config.modelVersion}</span>
            </span>
          </div>
        </div>

        {/* Right Actions: Status & Judge Tour CTA */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="hidden md:block">
            {getStatusBadge()}
          </div>

          <button
            id="judge-demo-tour-btn"
            onClick={onOpenDemoTour}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-950 bg-gradient-to-r from-blue-400 to-indigo-300 hover:from-blue-300 hover:to-indigo-200 rounded-lg shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Judge 6-Screen Story</span>
          </button>
        </div>
      </div>
    </header>
  );
};
