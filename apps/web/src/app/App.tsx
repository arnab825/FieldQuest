import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../components/layout/Navbar.js';
import { Footer } from '../components/layout/Footer.js';
import { LandingPage } from '../features/landing/LandingPage.js';
import { AdventureSetupForm } from '../features/adventure/AdventureSetupForm.js';
import { ActiveAdventureScreen } from '../features/adventure/ActiveAdventureScreen.js';
import { JournalView } from '../features/journal/JournalView.js';
import { AISettingsModal } from '../features/settings/AISettingsModal.js';
import { ObjectiveBasisModal } from '../features/about/ObjectiveBasisModal.js';
import { fetchAIStatus } from '../services/api.js';
import { AIProviderStatus } from '../types/index.js';

export const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isObjectiveBasisOpen, setIsObjectiveBasisOpen] = useState(false);

  const { data: aiStatus } = useQuery<AIProviderStatus>({
    queryKey: ['aiStatusGlobal'],
    queryFn: () => fetchAIStatus(),
    refetchInterval: 60000,
    retry: 1,
  });

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-parchment-warm text-forest-deep selection:bg-leaf-accent/30 selection:text-forest-dark">
        {/* Global Navigation */}
        <Navbar
          aiStatus={aiStatus}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenObjectiveBasis={() => setIsObjectiveBasisOpen(true)}
        />

        {/* Main Content View */}
        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <LandingPage
                  onOpenObjectiveBasis={() => setIsObjectiveBasisOpen(true)}
                />
              }
            />
            <Route path="/setup" element={<AdventureSetupForm />} />
            <Route path="/adventure" element={<ActiveAdventureScreen />} />
            <Route path="/journal" element={<JournalView />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <Footer />

        {/* Settings & Diagnostics Modal */}
        <AISettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          aiStatus={aiStatus}
        />

        {/* Objective Basis & Judges Guide Modal */}
        <ObjectiveBasisModal
          isOpen={isObjectiveBasisOpen}
          onClose={() => setIsObjectiveBasisOpen(false)}
        />
      </div>
    </BrowserRouter>
  );
};
