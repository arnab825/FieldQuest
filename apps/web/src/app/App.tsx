import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../components/layout/Navbar.js';
import { MobileBottomNav } from '../components/layout/MobileBottomNav.js';
import { Footer } from '../components/layout/Footer.js';
import { LandingPage } from '../features/landing/LandingPage.js';
import { AdventureSetupForm } from '../features/adventure/AdventureSetupForm.js';
import { ActiveAdventureScreen } from '../features/adventure/ActiveAdventureScreen.js';
import { JournalView } from '../features/journal/JournalView.js';
import { FieldStudioView } from '../features/journal/FieldStudioView.js';
import { AISettingsModal } from '../features/settings/AISettingsModal.js';
import { ObjectiveBasisModal } from '../features/about/ObjectiveBasisModal.js';
import { fetchAIStatus } from '../services/api.js';
import { AIProviderStatus } from '../types/index.js';

export const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isObjectiveBasisOpen, setIsObjectiveBasisOpen] = useState(false);

  const { data: aiStatus } = useQuery<AIProviderStatus>({
    queryKey: ['aiStatusGlobal'],
    queryFn: () => {
      const mode = (localStorage.getItem('fieldquest_ai_mode') as 'cloud' | 'ollama' | 'demo') || 'cloud';
      const cloudService = (localStorage.getItem('fieldquest_cloud_service') as 'gemini' | 'groq') || 'gemini';
      const cloudApiKey = cloudService === 'groq'
        ? localStorage.getItem('fieldquest_groq_api_key') || undefined
        : localStorage.getItem('fieldquest_gemini_api_key') || undefined;
      const cloudModel = cloudService === 'groq'
        ? (localStorage.getItem('fieldquest_groq_model') || 'llama-3.3-70b-versatile')
        : (localStorage.getItem('fieldquest_gemini_model') || 'gemini-1.5-flash');
      const model = mode === 'cloud' ? cloudModel : (localStorage.getItem('fieldquest_ollama_model') || 'qwen2.5:3b');
      const endpoint = localStorage.getItem('fieldquest_ollama_endpoint') || 'http://localhost:11434';
      return fetchAIStatus(mode, model, endpoint, cloudService, cloudApiKey);
    },
    refetchInterval: 30000,
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

        {/* Main Content View with mobile bottom nav safe padding */}
        <main className="flex-1 pb-20 md:pb-0">
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
            <Route path="/studio" element={<FieldStudioView />} />
            <Route path="/plates" element={<FieldStudioView />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <Footer onOpenObjectiveBasis={() => setIsObjectiveBasisOpen(true)} />

        {/* Mobile Bottom Navigation Bar (Screens < md) */}
        <MobileBottomNav
          aiStatus={aiStatus}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenObjectiveBasis={() => setIsObjectiveBasisOpen(true)}
        />

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
