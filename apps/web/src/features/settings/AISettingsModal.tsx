import React, { useState } from 'react';
import {
  X,
  Cpu,
  ShieldCheck,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Server,
  Upload,
  Cloud,
  Layers,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { AIProviderStatus } from '../../types/index.js';
import { exportAllDataAsJSON, importDataFromJSON, clearAllLocalData } from '../../lib/db.js';
import { fetchAIStatus, saveAIConfig } from '../../services/api.js';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiStatus?: AIProviderStatus;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  aiStatus,
}) => {
  const queryClient = useQueryClient();

  // Mode selection state: 'cloud' (Production Cloud with Local Failover) vs 'ollama' (Local Open-Weight AI)
  const [selectedMode, setSelectedMode] = useState<'cloud' | 'ollama'>(() => {
    const saved = localStorage.getItem('fieldquest_ai_mode');
    return saved === 'ollama' ? 'ollama' : 'cloud';
  });

  // Ollama configuration (for developers / local runners)
  const [endpoint, setEndpoint] = useState<string>(() => {
    return localStorage.getItem('fieldquest_ollama_endpoint') || 'http://localhost:11434';
  });

  const [ollamaModel, setOllamaModel] = useState<string>(() => {
    return localStorage.getItem('fieldquest_ollama_model') || 'qwen2.5:3b';
  });

  // Diagnostics & testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<AIProviderStatus | null>(null);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const installedList = testResult?.installedModels || aiStatus?.installedModels || [];

  const isModelInstalled = (mId: string) => {
    return installedList.some(
      (inst) => inst === mId || inst.startsWith(mId.split(':')[0]) || mId.startsWith(inst.split(':')[0])
    );
  };

  const isCurrentModelInstalled = installedList.length === 0 || isModelInstalled(ollamaModel);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetchAIStatus(selectedMode, ollamaModel, endpoint);
      setTestResult(res);

      if (selectedMode === 'ollama' && res.available && res.model && res.model !== 'unknown') {
        setOllamaModel(res.model);
        localStorage.setItem('fieldquest_ollama_model', res.model);
      }
    } catch {
      setTestResult({
        available: false,
        status: 'unavailable',
        provider: selectedMode,
        model: selectedMode === 'cloud' ? 'cloud-production' : ollamaModel,
        message: 'Could not connect to the backend service to verify AI engine.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    localStorage.setItem('fieldquest_ai_mode', selectedMode);
    localStorage.setItem('fieldquest_ollama_endpoint', endpoint);
    localStorage.setItem('fieldquest_ollama_model', ollamaModel);

    try {
      await saveAIConfig({
        mode: selectedMode,
        model: ollamaModel,
        endpoint: endpoint,
      });
    } catch (err) {
      console.warn('Backend sync fallback:', err);
    }

    // Refresh queries so Navbar status updates immediately
    queryClient.invalidateQueries({ queryKey: ['aiStatusGlobal'] });
    queryClient.invalidateQueries({ queryKey: ['aiStatus'] });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const handleExport = async () => {
    const jsonStr = await exportAllDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fieldquest-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importDataFromJSON(text);
      alert('Backup restored successfully!');
      window.location.reload();
    } catch (err: any) {
      alert('Failed to import backup: ' + (err.message || 'Invalid JSON file'));
    }
  };

  const handleWipe = async () => {
    if (window.confirm('Permanently wipe all locally saved data? This cannot be undone.')) {
      await clearAllLocalData();
      alert('All local data has been cleared.');
      onClose();
      window.location.reload();
    }
  };

  const popularOllamaModels = [
    { id: 'qwen2.5:3b', name: 'Qwen 2.5 (3B)', note: 'Recommended: Balanced & Ecological' },
    { id: 'gemma2:2b', name: 'Gemma 2 (2B)', note: 'Google DeepMind: Ultra Fast' },
    { id: 'llama3.2:3b', name: 'Llama 3.2 (3B)', note: 'Meta: Concise & Sharp' },
    { id: 'phi3.5:mini', name: 'Phi 3.5 (3.8B)', note: 'Microsoft: Strong Reasoning' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-forest-dark/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-paper-white rounded-3xl border border-border-subtle p-5 sm:p-7 max-w-xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto scrollbar-none">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-text-muted hover:text-forest-deep transition-colors cursor-pointer"
          aria-label="Close settings"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="mb-6 pr-8 sm:pr-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-forest-deep/10 text-forest-deep text-[11px] font-semibold">
              <Cpu className="w-3.5 h-3.5 text-moss-green" />
              <span>Inference Diagnostics & Configuration</span>
            </div>
            {aiStatus && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-parchment-warm text-forest-deep border border-border-subtle">
                Active: {aiStatus.provider === 'cloud' ? 'Cloud Naturalist' : aiStatus.provider} ({aiStatus.model})
              </span>
            )}
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-forest-deep">
            AI Engine & Settings
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Choose your AI inference provider or manage local containerized models.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm">
          {/* 1. Dual AI Engine Selection Cards */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-forest-deep block">
              1. Select Active AI Engine
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Cloud Naturalist Engine */}
              <div
                onClick={() => setSelectedMode('cloud')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  selectedMode === 'cloud'
                    ? 'border-forest-deep bg-parchment-warm/70 shadow-xs'
                    : 'border-border-subtle bg-paper-white hover:border-moss-green/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-editorial font-bold text-forest-deep text-sm flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-leaf-accent" />
                    <span>Cloud Naturalist Engine</span>
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedMode === 'cloud'
                        ? 'border-forest-deep bg-forest-deep'
                        : 'border-border-subtle'
                    }`}
                  >
                    {selectedMode === 'cloud' && <div className="w-1.5 h-1.5 rounded-full bg-paper-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Production-grade cloud AI inference. Zero local setup or GPU required. If cloud capacity is exhausted, automatically fails over to local AI or curated field logs.
                </p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Ready Out-of-the-Box
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-forest-deep/10 text-forest-deep">
                    Auto-Failover Protection
                  </span>
                </div>
              </div>

              {/* Option B: Local Open-Weight AI (Ollama / Podman) */}
              <div
                onClick={() => setSelectedMode('ollama')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  selectedMode === 'ollama'
                    ? 'border-forest-deep bg-parchment-warm/70 shadow-xs'
                    : 'border-border-subtle bg-paper-white hover:border-moss-green/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-editorial font-bold text-forest-deep text-sm flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-moss-green" />
                    <span>Local AI (Ollama / Podman)</span>
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedMode === 'ollama'
                        ? 'border-forest-deep bg-forest-deep'
                        : 'border-border-subtle'
                    }`}
                  >
                    {selectedMode === 'ollama' && <div className="w-1.5 h-1.5 rounded-full bg-paper-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Connects to your local or containerized Ollama instance running open-weight models (Qwen, Gemma, Llama).
                </p>
                <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-forest-deep/10 text-forest-deep">
                  Self-Hosted & Private
                </span>
              </div>
            </div>
          </div>

          {/* 2A. Cloud Naturalist Engine Architecture & Failover Area */}
          {selectedMode === 'cloud' && (
            <div className="p-4 sm:p-5 rounded-2xl border border-border-subtle bg-parchment-warm/50 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-1 border-b border-border-subtle/60">
                <span className="text-xs font-bold text-forest-deep uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-moss-green" />
                  <span>Production AI Architecture & Failover Pipeline</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Zero Downtime
                </span>
              </div>

              {/* Visual Pipeline Flow */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl bg-paper-white border border-border-subtle space-y-1">
                    <span className="text-[10px] font-bold text-moss-green uppercase block">Step 1 • Primary</span>
                    <h5 className="font-editorial text-xs font-bold text-forest-deep flex items-center gap-1">
                      <Cloud className="w-3 h-3 text-moss-green" />
                      <span>Production Cloud AI</span>
                    </h5>
                    <p className="text-[10px] text-text-muted leading-tight">
                      Executes via server-managed cloud models with zero client configuration.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-paper-white border border-border-subtle space-y-1">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block">Step 2 • Failover</span>
                    <h5 className="font-editorial text-xs font-bold text-forest-deep flex items-center gap-1">
                      <Server className="w-3 h-3 text-amber-700" />
                      <span>Local AI (Ollama)</span>
                    </h5>
                    <p className="text-[10px] text-text-muted leading-tight">
                      If cloud quota is exhausted or rate-limited, automatically triggers local container.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-paper-white border border-border-subtle space-y-1">
                    <span className="text-[10px] font-bold text-forest-deep uppercase block">Step 3 • Offline</span>
                    <h5 className="font-editorial text-xs font-bold text-forest-deep flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-forest-deep" />
                      <span>Curated Field Library</span>
                    </h5>
                    <p className="text-[10px] text-text-muted leading-tight">
                      Deterministic naturalist missions ensure 100% reliability even if fully offline.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-paper-white/80 border border-border-subtle text-[11px] text-text-muted leading-relaxed">
                  💡 <strong>No configuration needed:</strong> Cloud credentials and rate limits are managed directly on the backend server. You never have to configure keys in the browser, and quest generation will never fail.
                </div>
              </div>

              {/* Test & Save Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleTestConnection}
                  className="px-4 py-2 rounded-xl bg-forest-deep text-paper-white text-xs font-semibold hover:bg-forest-dark transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing Engine Status...' : 'Test Engine Status'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-4 py-2 rounded-xl border border-border-subtle bg-paper-white hover:bg-parchment-warm text-forest-deep text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="text-emerald-700 font-bold">Preferences Saved!</span>
                    </>
                  ) : (
                    <span>Save Preference</span>
                  )}
                </button>
              </div>

              {/* Test Result Feedback Box */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs space-y-1 border animate-in fade-in ${
                    testResult.status === 'available'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {testResult.status === 'available' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    )}
                    <span>
                      {testResult.status === 'available' ? 'Engine Ready' : 'Status Info'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90 pl-6">
                    {testResult.message}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2B. Ollama / Podman Configuration Area */}
          {selectedMode === 'ollama' && (
            <div className="p-4 sm:p-5 rounded-2xl border border-border-subtle bg-parchment-warm/50 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-1 border-b border-border-subtle/60">
                <span className="text-xs font-bold text-forest-deep uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-moss-green" />
                  <span>Ollama / Podman Endpoint & Model</span>
                </span>
                <span className="text-[10px] text-text-muted">Port 11434</span>
              </div>

              {/* Endpoint Input */}
              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1">
                  Ollama Host URL:
                </label>
                <input
                  type="text"
                  value={endpoint}
                  onChange={e => setEndpoint(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-paper-white text-xs font-mono text-forest-deep focus:outline-none focus:border-forest-deep"
                />
              </div>

              {/* Model Input & Quick Select Chips */}
              <div>
                <label className="block text-[11px] font-semibold text-text-muted mb-1">
                  Active Model Name:
                </label>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={e => setOllamaModel(e.target.value)}
                  placeholder="qwen2.5:3b"
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-paper-white text-xs font-mono text-forest-deep focus:outline-none focus:border-forest-deep"
                />

                {/* Popular Models Chips with Installed vs Needs Download Badges */}
                <div className="space-y-2 mt-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-text-muted mr-1">Presets:</span>
                    {popularOllamaModels.map(m => {
                      const isPresetInstalled = isModelInstalled(m.id);
                      const isSelected = ollamaModel === m.id;

                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setOllamaModel(m.id)}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'border-forest-deep bg-forest-deep text-paper-white shadow-2xs font-semibold'
                              : 'border-border-subtle bg-paper-white text-forest-deep hover:bg-parchment-warm'
                          }`}
                          title={
                            isPresetInstalled
                              ? `${m.note} (Already downloaded in Podman container)`
                              : `${m.note} (Requires download via Podman)`
                          }
                        >
                          <span>{m.name}</span>
                          {isPresetInstalled ? (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-leaf-accent' : 'bg-emerald-500'
                              }`}
                              title="Ready in Podman container"
                            />
                          ) : (
                            <span
                              className={`text-[8px] uppercase tracking-wider px-1 py-0.2 rounded font-sans font-bold ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                              }`}
                              title="Requires podman pull"
                            >
                              pull
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Visual Instruction: If selected model requires Podman download */}
                  {!isCurrentModelInstalled && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2 animate-in fade-in">
                      <div className="flex items-center gap-1.5 text-amber-950 font-bold">
                        <Download className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Download "{ollamaModel}" using Podman</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        This model is not yet downloaded inside your container. Run this command in your PowerShell/terminal:
                      </p>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-forest-deep text-leaf-accent font-mono text-[11px] shadow-2xs">
                        <span className="overflow-x-auto scrollbar-none pr-2">
                          podman exec -it fieldquest-ai ollama pull {ollamaModel}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(`podman exec -it fieldquest-ai ollama pull ${ollamaModel}`)}
                          className="p-1 hover:bg-white/10 rounded cursor-pointer text-paper-white shrink-0"
                          title="Copy Podman pull command"
                        >
                          {copiedCommand ? <Check className="w-3.5 h-3.5 text-leaf-accent" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {installedList.length > 0 && (
                        <div className="text-[11px] text-amber-900 flex flex-wrap items-center gap-1 pt-0.5">
                          <span>Or use currently downloaded model:</span>
                          {installedList.map(mName => (
                            <button
                              key={mName}
                              type="button"
                              onClick={() => setOllamaModel(mName)}
                              className="underline font-bold text-forest-deep hover:text-emerald-800 cursor-pointer"
                            >
                              ✓ {mName} (Ready)
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* If selected model is installed and ready */}
                  {isCurrentModelInstalled && installedList.length > 0 && (
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>
                          Model <code className="font-mono font-bold bg-white/70 px-1 py-0.5 rounded text-emerald-900">{ollamaModel}</code> is downloaded & ready in Podman.
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                        Ready
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Test Connection Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleTestConnection}
                  className="px-4 py-2 rounded-xl bg-forest-deep text-paper-white text-xs font-semibold hover:bg-forest-dark transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing Connection...' : 'Test Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-4 py-2 rounded-xl border border-border-subtle bg-paper-white hover:bg-parchment-warm text-forest-deep text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="text-emerald-700 font-bold">Settings Saved!</span>
                    </>
                  ) : (
                    <span>Save Preference</span>
                  )}
                </button>
              </div>

              {/* Test Result Feedback Box */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs space-y-1.5 border animate-in fade-in ${
                    testResult.status === 'available'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {testResult.status === 'available' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    )}
                    <span>
                      {testResult.status === 'available' ? 'Connection Verified' : 'Connection Warning'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90 pl-6">
                    {testResult.message}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 3. Data & Privacy Management */}
          <div className="space-y-3 pt-4 border-t border-border-subtle">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-forest-deep block">
                2. Data Privacy & Storage (IndexedDB)
              </label>
              <span className="text-[11px] text-text-muted flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-moss-green" />
                <span>100% Local Storage</span>
              </span>
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              Your field journals, observation notes, photos, and quest history never leave your browser unless you export them.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleExport}
                className="flex-1 py-2.5 px-3 rounded-xl border border-border-subtle bg-parchment-warm hover:bg-paper-white text-xs font-semibold text-forest-deep flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-moss-green" />
                <span>Export Backup</span>
              </button>

              <label className="flex-1 py-2.5 px-3 rounded-xl border border-border-subtle bg-parchment-warm hover:bg-paper-white text-xs font-semibold text-forest-deep flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-moss-green" />
                <span>Restore Backup</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleWipe}
                className="py-2.5 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Wipe Storage</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-border-subtle flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-forest-deep text-paper-white text-xs font-semibold hover:bg-forest-dark transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
