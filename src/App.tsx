import React, { useState } from 'react';
import { NavigationTab, DatasetItem, ProjectConfig, ActiveLearningRound } from './types';
import {
  INITIAL_PROJECT_CONFIG,
  ACTIVE_LEARNING_ROUNDS,
} from './data/fallbackPresets';
import { loadPipelineConfig } from './data/pipelineConfig';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { DashboardPage } from './components/DashboardPage';
import { UploadPage } from './components/UploadPage';
import { ProcessingPage } from './components/ProcessingPage';
import { SmartReviewQueuePage } from './components/SmartReviewQueuePage';
import { AnnotationWorkspacePage } from './components/AnnotationWorkspacePage';
import { EvolutionImpactPage } from './components/EvolutionImpactPage';
import { EvidencePage } from './components/EvidencePage';
import { ExportPage } from './components/ExportPage';
import { ExplainDecisionModal } from './components/ExplainDecisionModal';

import { fetchQueue, submitHumanLabel, saveLocalReview } from './services/api';

export const App: React.FC = () => {
  const getUrlTab = (): NavigationTab => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab');
      if (t) return t as NavigationTab;
      const hash = window.location.hash.replace('#', '');
      if (hash) return hash as NavigationTab;
    } catch {
      // fallback
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<NavigationTab>(getUrlTab());

  const setActiveTab = (tab: NavigationTab) => {
    setActiveTabState(tab);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  };

  const [config, setConfig] = useState<ProjectConfig>(INITIAL_PROJECT_CONFIG);
  const [datasetItems, setDatasetItems] = useState<DatasetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [rounds] = useState<ActiveLearningRound[]>(ACTIVE_LEARNING_ROUNDS);
  const [selectedItemForWorkspace, setSelectedItemForWorkspace] = useState<DatasetItem | null>(
    null
  );
  const [explainItem, setExplainItem] = useState<DatasetItem | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Load pipeline config and real active-learning ranked data
  React.useEffect(() => {
    // Load pipeline config (weights, thresholds) from the exported JSON
    loadPipelineConfig();

    setIsLoading(true);
    fetchQueue()
      .then(({ items, isLiveBackend: isLive }) => {
        setIsLiveBackend(isLive);
        if (Array.isArray(items) && items.length > 0) {
          setDatasetItems(items);
          setSelectedItemForWorkspace(items[0]);
        }
      })
      .catch(() => {
        // No data available — empty state will be shown
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Update a single item from workspace or queue with disk persistence
  const handleUpdateItem = (updated: DatasetItem) => {
    setDatasetItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedItemForWorkspace(updated);
    // Keep a browser copy, then persist to the backend (data/reviewed_labels.json)
    saveLocalReview(updated);
    submitHumanLabel(updated, updated.status || 'human_reviewed').then((ok) => {
      if (!ok) {
        setSaveNotice('Backend not reachable: this review is saved in this browser only.');
        setTimeout(() => setSaveNotice(null), 4000);
      }
    });
  };

  // Switch to workspace with specific item
  const handleSelectImageForWorkspace = (item: DatasetItem) => {
    setSelectedItemForWorkspace(item);
    setActiveTab('workspace');
  };

  // Open the "Why this image?" active-learning modal
  const handleOpenExplainModal = (item: DatasetItem) => {
    setExplainItem(item);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top Navigation Header */}
      <Header
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDemoTour={() => setActiveTab('evolution')}
        isLiveBackend={isLiveBackend}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Collapsible Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingReviewCount={datasetItems.filter((i) => i.status === 'pending').length}
          rounds={rounds}
        />

        {/* Dynamic Page Content Stage */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50/50">
          <div className="max-w-7xl mx-auto">
            {/* Loading state */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-sm text-zinc-400">Loading pipeline data…</p>
              </div>
            )}

            {/* Empty state — no data loaded */}
            {!isLoading && datasetItems.length === 0 && activeTab !== 'landing' && activeTab !== 'evidence' && activeTab !== 'upload' && activeTab !== 'datasets' && activeTab !== 'settings' && activeTab !== 'evolution' && activeTab !== 'model_improvement' && activeTab !== 'retrain' && activeTab !== 'processing' && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-3xl">📂</div>
                <h2 className="text-lg font-bold text-zinc-200">No Dataset Loaded</h2>
                <p className="text-sm text-zinc-400 max-w-md">
                  Run the pipeline to generate predictions and a ranked queue, then use
                  <code className="mx-1 px-1.5 py-0.5 rounded bg-zinc-800 text-blue-400 text-xs font-mono">python scripts/sync_queue_to_ui.py</code>
                  to populate the review dashboard.
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="mt-2 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  Go to Upload
                </button>
              </div>
            )}

            {!isLoading && activeTab === 'evidence' && (
              <EvidencePage setActiveTab={setActiveTab} />
            )}

            {!isLoading && activeTab === 'landing' && (
              <LandingPage
                onStartAnnotation={() => setActiveTab('upload')}
                onViewDemoDataset={() => setActiveTab('dashboard')}
                setActiveTab={setActiveTab}
              />
            )}

            {!isLoading && activeTab === 'dashboard' && (
              <DashboardPage
                config={config}
                datasetItems={datasetItems}
                rounds={rounds}
                onSelectImage={handleSelectImageForWorkspace}
                onExplainItem={handleOpenExplainModal}
                setActiveTab={setActiveTab}
              />
            )}

            {!isLoading && (activeTab === 'upload' || activeTab === 'datasets') && (
              <UploadPage
                config={config}
                setConfig={setConfig}
                onStartProcessing={() => {}}
                setActiveTab={setActiveTab}
              />
            )}

            {!isLoading && activeTab === 'processing' && (
              <ProcessingPage config={config} datasetItems={datasetItems} setActiveTab={setActiveTab} />
            )}

            {!isLoading && activeTab === 'queue' && (
              <SmartReviewQueuePage
                datasetItems={datasetItems}
                onSelectImage={handleSelectImageForWorkspace}
                onExplainItem={handleOpenExplainModal}
                setActiveTab={setActiveTab}
              />
            )}

            {!isLoading && activeTab === 'workspace' && selectedItemForWorkspace && (
              <AnnotationWorkspacePage
                item={selectedItemForWorkspace}
                datasetItems={datasetItems}
                onUpdateItem={handleUpdateItem}
                onNavigateItem={(next) => setSelectedItemForWorkspace(next)}
                onExplainItem={handleOpenExplainModal}
                setActiveTab={setActiveTab}
              />
            )}

            {!isLoading && (activeTab === 'evolution' || activeTab === 'model_improvement' || activeTab === 'retrain') && (
              <EvolutionImpactPage
                rounds={rounds}
                setActiveTab={setActiveTab}
              />
            )}

            {!isLoading && activeTab === 'export' && (
              <ExportPage config={config} datasetItems={datasetItems} />
            )}

            {!isLoading && activeTab === 'settings' && (
              <UploadPage
                config={config}
                setConfig={setConfig}
                onStartProcessing={() => {}}
                setActiveTab={setActiveTab}
              />
            )}
          </div>
        </main>
      </div>

      {saveNotice && (
        <div
          role="status"
          className="fixed bottom-4 left-4 z-50 max-w-sm px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium shadow-sm"
        >
          {saveNotice}
        </div>
      )}

      {/* "Why This Image?" Active Learning Diagnostic Modal (Innovation pitch highlight) */}
      <ExplainDecisionModal
        isOpen={!!explainItem}
        onClose={() => setExplainItem(null)}
        item={explainItem}
        onOpenWorkspace={handleSelectImageForWorkspace}
      />
    </div>
  );
};

export default App;
