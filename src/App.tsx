import React, { useState } from 'react';
import { NavigationTab, DatasetItem, ProjectConfig, ActiveLearningRound } from './types';
import {
  INITIAL_PROJECT_CONFIG,
  INITIAL_DATASET_ITEMS,
  ACTIVE_LEARNING_ROUNDS,
} from './data/mockDataset';

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
import { ExportPage } from './components/ExportPage';
import { ExplainDecisionModal } from './components/ExplainDecisionModal';

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
  const [datasetItems, setDatasetItems] = useState<DatasetItem[]>(INITIAL_DATASET_ITEMS);
  const [rounds, setRounds] = useState<ActiveLearningRound[]>(ACTIVE_LEARNING_ROUNDS);
  const [selectedItemForWorkspace, setSelectedItemForWorkspace] = useState<DatasetItem>(
    INITIAL_DATASET_ITEMS[0]
  );
  const [explainItem, setExplainItem] = useState<DatasetItem | null>(null);

  // Load real active-learning ranked data from Person A/B if available
  React.useEffect(() => {
    fetch('/ranked_dataset.json')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Fallback to initial items');
      })
      .then((data: DatasetItem[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setDatasetItems(data);
          setSelectedItemForWorkspace(data[0]);
        }
      })
      .catch(() => {
        // Keep initial dataset items
      });
  }, []);

  // Update a single item from workspace or queue
  const handleUpdateItem = (updated: DatasetItem) => {
    setDatasetItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedItemForWorkspace(updated);
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

  // Trigger retraining simulation (Round 4 or new round)
  const handleTriggerRetrain = () => {
    setRounds((prev) => [
      ...prev.map((r) => (r.round === 3 ? { ...r, status: 'completed' as const } : r)),
    ]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-blue-500 selection:text-zinc-950">
      {/* Top Navigation Header */}
      <Header
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDemoTour={() => setActiveTab('evolution')}
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-zinc-950">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'landing' && (
              <LandingPage
                onStartAnnotation={() => setActiveTab('upload')}
                onViewDemoDataset={() => setActiveTab('dashboard')}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardPage
                config={config}
                datasetItems={datasetItems}
                rounds={rounds}
                onSelectImage={handleSelectImageForWorkspace}
                onExplainItem={handleOpenExplainModal}
                setActiveTab={setActiveTab}
              />
            )}

            {(activeTab === 'upload' || activeTab === 'datasets') && (
              <UploadPage
                config={config}
                setConfig={setConfig}
                onStartProcessing={() => {}}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'processing' && (
              <ProcessingPage config={config} datasetItems={datasetItems} setActiveTab={setActiveTab} />
            )}

            {activeTab === 'queue' && (
              <SmartReviewQueuePage
                datasetItems={datasetItems}
                onSelectImage={handleSelectImageForWorkspace}
                onExplainItem={handleOpenExplainModal}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'workspace' && (
              <AnnotationWorkspacePage
                item={selectedItemForWorkspace}
                datasetItems={datasetItems}
                onUpdateItem={handleUpdateItem}
                onNavigateItem={(next) => setSelectedItemForWorkspace(next)}
                onExplainItem={handleOpenExplainModal}
                setActiveTab={setActiveTab}
              />
            )}

            {(activeTab === 'evolution' || activeTab === 'model_improvement' || activeTab === 'retrain') && (
              <EvolutionImpactPage
                rounds={rounds}
                onTriggerRetrain={handleTriggerRetrain}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'export' && (
              <ExportPage config={config} datasetItems={datasetItems} />
            )}

            {activeTab === 'settings' && (
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

      {/* "Why This Image?" Active Learning Diagnostic Modal (Innovation pitch highlight) */}
      <ExplainDecisionModal
        isOpen={!!explainItem}
        onClose={() => setExplainItem(null)}
        item={explainItem}
      />
    </div>
  );
};

export default App;
