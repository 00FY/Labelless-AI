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
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Round {config.currentRound} · {isLiveBackend ? 'FastAPI Live' : 'Active'}</span>
      </div>
    );
  };

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard' },
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
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="hidden md:flex items-center">
            {getStatusBadge()}
          </div>

          <button
            id="judge-demo-tour-btn"
            onClick={onOpenDemoTour}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-gray-900 hover:bg-gray-700 rounded-xl transition-colors shadow-sm"
          >
            <PlayCircle className="w-4 h-4" />
            <span>View Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
