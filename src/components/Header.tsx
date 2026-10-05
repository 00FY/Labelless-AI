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
  const getStatusBadge = () => {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono-code tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>ROUND {config.currentRound} &bull; {isLiveBackend ? 'FASTAPI LIVE' : 'ACTIVE'}</span>
      </div>
    );
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
      className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 lg:px-8 py-3.5 shadow-sm"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <button
            id="brand-logo-btn"
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 group-hover:bg-emerald-500/20 transition-all">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-lg font-display font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
              LabelLess<span className="text-emerald-600 font-serif-editorial italic ml-1 font-normal text-xl">AI</span>
            </span>
          </button>

          <div className="md:hidden">
            {getStatusBadge()}
          </div>
        </div>

        {/* Center: Navigation links */}
        <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id as NavigationTab)}
                className={`relative px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'text-slate-900 bg-white shadow-sm border border-slate-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {isActive && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 -ml-0.5"></span>
                )}
                {link.label}
              </button>
            );
          })}
        </div>

        {/* Right Actions: Status & Judge Tour CTA */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="hidden md:flex items-center">
            {getStatusBadge()}
          </div>

          <button
            id="judge-demo-tour-btn"
            onClick={onOpenDemoTour}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold font-mono-code text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-sm active:scale-95 uppercase tracking-wider"
          >
            <PlayCircle className="w-4 h-4 text-emerald-400" />
            <span>Interactive Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
