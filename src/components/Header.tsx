import React from 'react';
import { ProjectConfig, NavigationTab } from '../types';
import { Sparkles, PlayCircle } from 'lucide-react';

interface HeaderProps {
  config: ProjectConfig;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  onOpenDemoTour: () => void;
  isLiveBackend?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  activeTab,
  setActiveTab,
  onOpenDemoTour,
  isLiveBackend = false,
}) => {
  const getBackendStatusBadge = () => {
    if (isLiveBackend) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold" title="Connected to FastAPI Server on :8000">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>● FASTAPI LIVE</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold" title="Running in static offline replay mode. Start 'python -m uvicorn server:app' for live backend.">
        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
        <span>○ OFFLINE REPLAY MODE</span>
      </div>
    );
  };

  const getStatusBadge = () => {
    switch (config.pipelineStatus) {
      case 'processing':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Processing</span>
          </div>
        );
      case 'round_complete':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>✓ ROUND {config.currentRound} COMPLETE</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
            <span>Pipeline Active</span>
          </div>
        );
    }
  };

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'evidence', label: 'Evidence & Benchmarks' },
    { id: 'landing', label: 'Features' },
    { id: 'queue', label: 'Review Queue' },
    { id: 'evolution', label: 'Model Impact' },
  ];

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white px-4 lg:px-6 py-3"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <button
            id="brand-logo-btn"
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-2 text-left group"
          >
            <Sparkles className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            <span className="text-lg font-bold tracking-tight text-gray-900">
              LabelLess AI
            </span>
          </button>

          <div className="md:hidden">
            {getStatusBadge()}
          </div>
        </div>

        {/* Center: Navigation links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id as NavigationTab)}
              className={`text-sm font-medium transition-colors ${
                activeTab === link.id
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right Actions: Status & Judge Tour CTA */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <div className="hidden md:flex items-center gap-2">
            {getBackendStatusBadge()}
            {getStatusBadge()}
          </div>

          <button
            id="judge-demo-tour-btn"
            onClick={onOpenDemoTour}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 rounded-xl transition-colors shadow-sm"
          >
            <PlayCircle className="w-4 h-4" />
            <span>View Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
