import React, { useState, useEffect } from 'react';
import { ProductStory } from './components/ProductStory';
import { AuditWorkspace } from './components/AuditWorkspace';
import { UnifiedSystemModal } from './components/UnifiedSystemModal';
import { SampleCase } from './types/audit';

type AppView = 'workspace' | 'story';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('workspace');
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [samples, setSamples] = useState<SampleCase[]>([]);

  useEffect(() => {
    fetch('/samples/manifest.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.cases) setSamples(data.cases);
      })
      .catch((err) => console.error('Failed to load sample cases:', err));
  }, []);

  const handleLaunchSample = (caseId: string) => {
    setSelectedSampleId(caseId);
    setCurrentView('workspace');
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#20211F] font-sans antialiased selection:bg-[#3158C9]/15">
      {currentView === 'story' ? (
        <ProductStory
          onLaunchAudit={() => setCurrentView('workspace')}
          onOpenDiagnostics={() => setIsSystemModalOpen(true)}
        />
      ) : (
        <AuditWorkspace
          onBackToStory={() => setCurrentView('story')}
          onOpenDiagnostics={() => setIsSystemModalOpen(true)}
          initialSampleCaseId={selectedSampleId}
        />
      )}

      <UnifiedSystemModal
        isOpen={isSystemModalOpen}
        onClose={() => setIsSystemModalOpen(false)}
        samples={samples}
        onSelectSample={handleLaunchSample}
      />
    </div>
  );
}
