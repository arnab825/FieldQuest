import React, { useState } from 'react';
import {
  X,
  Cpu,
  ShieldCheck,
  HardDrive,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Server,
  Upload,
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

  // Mode selection state (persisted in localStorage)
  const [selectedMode, setSelectedMode] = useState<'demo' | 'ollama'>(() => {
    return (localStorage.getItem('fieldquest_ai_mode') as 'demo' | 'ollama') || 'demo';
  });

  const [endpoint, setEndpoint] = useState<string>(() => {
    return localStorage.getItem('fieldquest_ollama_endpoint') || 'http://localhost:11434';
  });

  const [model, setModel] = useState<string>(() => {
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

  const isCurrentModelInstalled = installedList.length === 0 || isModelInstalled(model);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetchAIStatus(selectedMode, model, endpoint);
      setTestResult(res);

      // Automatically sync input field to matched or auto-synced model from container!
      if (res.available && res.model && res.model !== 'unknown') {
        setModel(res.model);
        localStorage.setItem('fieldquest_ollama_model', res.model);
      }
    } catch {
      setTestResult({
        available: false,
        status: 'unavailable',
        provider: selectedMode,
        model: model,
        message: 'Could not connect to the backend service to verify AI engine.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    localStorage.setItem('fieldquest_ai_mode', selectedMode);
    localStorage.setItem('fieldquest_ollama_endpoint', endpoint);
    localStorage.setItem('fieldquest_ollama_model', model);

    try {
      await saveAIConfig({
        mode: selectedMode,
        model: model,
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

  const popularModels = [
    { id: 'qwen2.5:3b', name: 'Qwen 2.5 (3B)', note: 'Recommended: Balanced & Ecological' },
    { id: 'gemma2:2b', name: 'Gemma 2 (2B)', note: 'Google DeepMind: Ultra Fast' },
    { id: 'llama3.2:3b', name: 'Llama 3.2 (3B)', note: 'Meta: Concise & Sharp' },
    { id: 'phi3.5:mini', name: 'Phi 3.5 (3.8B)', note: 'Microsoft: Strong Reasoning' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-forest-dark/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
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
                Active: {aiStatus.provider} ({aiStatus.model})
              </span>
            )}
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-forest-deep">
            AI Engine & Settings
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Choose your AI inference provider, manage local models, or run offline.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm">
          {/* 1. AI Provider Selection Cards */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-forest-deep block">
              1. Select Active AI Engine
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Demo Naturalist Engine */}
              <div
                onClick={() => setSelectedMode('demo')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  selectedMode === 'demo'
                    ? 'border-forest-deep bg-parchment-warm/70 shadow-xs'
                    : 'border-border-subtle bg-paper-white hover:border-moss-green/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-editorial font-bold text-forest-deep text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-leaf-accent" />
                    <span>Demo Naturalist Engine</span>
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedMode === 'demo'
                        ? 'border-forest-deep bg-forest-deep'
                        : 'border-border-subtle'
                    }`}
                  >
                    {selectedMode === 'demo' && <div className="w-1.5 h-1.5 rounded-full bg-paper-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Instant response (&lt;3ms), 100% offline. Generates naturalist-verified sensory quests with zero setup or GPU requirements.
                </p>
                <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  Ready Out-of-the-Box
                </span>
              </div>

              {/* Option B: Local Open-Weight AI */}
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

          {/* 2. Ollama / Podman Configuration Area (shown when Ollama is selected) */}
          {selectedMode === 'ollama' && (
            <div className="p-4 rounded-2xl border border-border-subtle bg-parchment-warm/50 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-forest-deep uppercase tracking-wider">
                  Ollama / Podman Endpoint & Model
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
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder="qwen2.5:3b"
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-paper-white text-xs font-mono text-forest-deep focus:outline-none focus:border-forest-deep"
                />

                {/* Popular Models Chips with Installed vs Needs Download Badges */}
                <div className="space-y-2 mt-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-text-muted mr-1">Presets:</span>
                    {popularModels.map(m => {
                      const isPresetInstalled = isModelInstalled(m.id);
                      const isSelected = model === m.id;

                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setModel(m.id)}
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
                        <span>Download "{model}" using Podman</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        This model is not yet downloaded inside your container. Run this command in your PowerShell/terminal:
                      </p>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-forest-deep text-leaf-accent font-mono text-[11px] shadow-2xs">
                        <span className="overflow-x-auto scrollbar-none pr-2">
                          podman exec -it fieldquest-ai ollama pull {model}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(`podman exec -it fieldquest-ai ollama pull ${model}`)}
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
                              onClick={() => setModel(mName)}
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
                          Model <code className="font-mono font-bold bg-white/70 px-1 py-0.5 rounded text-emerald-900">{model}</code> is downloaded & ready in Podman.
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
                      <span className="text-emerald-700">Settings Saved!</span>
                    </>
                  ) : (
                    <span>Save Preference</span>
                  )}
                </button>
              </div>

              {/* Test Result Feedback Box */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs space-y-1.5 border ${
                    testResult.status === 'available'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {testResult.status === 'available' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Ollama Connected Successfully</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-700" />
                        <span>Ollama Status Check</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed">{testResult.message}</p>

                  {/* If model needs pulling, show one-click command */}
                  {testResult.status !== 'available' && (
                    <div className="pt-1.5">
                      <span className="text-[10px] text-text-muted block mb-1">
                        Run this command in your terminal to pull the model:
                      </span>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-forest-deep text-leaf-accent font-mono text-[10px]">
                        <span>podman exec -it fieldquest-ai ollama pull {model}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(`podman exec -it fieldquest-ai ollama pull ${model}`)}
                          className="p-1 hover:bg-white/10 rounded cursor-pointer text-paper-white"
                          title="Copy command"
                        >
                          {copiedCommand ? <Check className="w-3 h-3 text-leaf-accent" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List installed models if available with one-click sync */}
                  {testResult.installedModels && testResult.installedModels.length > 0 && (
                    <div className="pt-2 text-[11px] border-t border-border-subtle/50 mt-1">
                      <span className="font-semibold text-forest-deep block mb-1">
                        Installed in your Ollama container:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {testResult.installedModels.map(mName => (
                          <button
                            key={mName}
                            type="button"
                            onClick={() => {
                              setModel(mName);
                              localStorage.setItem('fieldquest_ollama_model', mName);
                            }}
                            className={`px-2.5 py-1 rounded-lg font-mono text-[10px] border transition-all cursor-pointer flex items-center gap-1 ${
                              model === mName
                                ? 'bg-forest-deep text-paper-white border-forest-deep font-bold shadow-2xs'
                                : 'bg-paper-white text-forest-deep border-border-subtle hover:bg-parchment-warm'
                            }`}
                            title="Click to select this installed model"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{mName}</span>
                            <span className="text-[9px] opacity-80">
                              {model === mName ? '(Active)' : '(Sync)'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* When Demo is selected, show Save button */}
          {selectedMode === 'demo' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 rounded-xl bg-forest-deep text-paper-white text-xs font-semibold hover:bg-forest-dark transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-leaf-accent" />
                    <span>Demo Mode Active!</span>
                  </>
                ) : (
                  <span>Save Mode</span>
                )}
              </button>
            </div>
          )}

          {/* 3. Privacy & Zero-Tracking Guarantee */}
          <div className="p-4 rounded-2xl border border-border-subtle bg-paper-white space-y-1.5">
            <div className="font-bold text-forest-deep flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Zero-Tracking Privacy Guarantee</span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              FieldQuest does not track your location, require sign-in accounts, or upload observations to third-party clouds. All field notes and photos remain securely on this machine in your browser IndexedDB.
            </p>
          </div>

          {/* 4. Local Data Management */}
          <div className="p-4 rounded-2xl border border-border-subtle bg-paper-white space-y-3">
            <div className="font-bold text-forest-deep flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-moss-green" />
              <span>Local Data Management</span>
            </div>

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
            className="px-6 py-2.5 rounded-xl bg-forest-deep text-paper-white text-xs font-semibold hover:bg-forest-dark transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
