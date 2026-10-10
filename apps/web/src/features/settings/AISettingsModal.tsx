import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Shield,
  Zap,
  Terminal,
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

  // State to toggle custom Ollama endpoint input (defaults to false since localhost:11434 is standard)
  const [showCustomEndpoint, setShowCustomEndpoint] = useState(() => {
    const saved = localStorage.getItem('fieldquest_ollama_endpoint');
    return Boolean(saved && saved !== 'http://localhost:11434');
  });

  // Cloud provider preference state: 'gemini' | 'groq'
  const [selectedCloudService, setSelectedCloudService] = useState<'gemini' | 'groq'>(() => {
    const saved = localStorage.getItem('fieldquest_cloud_service');
    return saved === 'groq' ? 'groq' : ((aiStatus?.cloudService as 'gemini' | 'groq') || 'gemini');
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

  // Automatically fetch live status when modal opens or active mode changes
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;
    const fetchCurrentStatus = async () => {
      try {
        const res = await fetchAIStatus(
          selectedMode,
          selectedMode === 'ollama' ? ollamaModel : undefined,
          selectedMode === 'ollama' ? endpoint : undefined,
          selectedMode === 'cloud' ? selectedCloudService : undefined
        );
        if (!isCancelled) {
          setTestResult(res);
        }
      } catch {
        // preserve existing status
      }
    };
    fetchCurrentStatus();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, selectedMode, endpoint, ollamaModel, selectedCloudService]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetchAIStatus(
        selectedMode,
        selectedMode === 'ollama' ? ollamaModel : undefined,
        selectedMode === 'ollama' ? endpoint : undefined,
        selectedMode === 'cloud' ? selectedCloudService : undefined
      );
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
        model: selectedMode === 'cloud' ? (aiStatus?.model || 'gemini-3.8-flash') : ollamaModel,
        cloudService: selectedCloudService,
        message: 'Could not connect to the backend service to verify AI engine.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    localStorage.setItem('fieldquest_ai_mode', selectedMode);
    if (selectedMode === 'cloud') {
      localStorage.setItem('fieldquest_cloud_service', selectedCloudService);
    }
    if (selectedMode === 'ollama') {
      localStorage.setItem('fieldquest_ollama_endpoint', endpoint);
      localStorage.setItem('fieldquest_ollama_model', ollamaModel);
    }

    try {
      await saveAIConfig({
        mode: selectedMode,
        cloudService: selectedMode === 'cloud' ? selectedCloudService : undefined,
        model: selectedMode === 'ollama' ? ollamaModel : undefined,
        endpoint: selectedMode === 'ollama' ? endpoint : undefined,
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
            {(() => {
              const currentStatus = testResult || aiStatus;
              if (!currentStatus) return null;
              const isAvailable = currentStatus.status === 'available';
              const displayProvider = currentStatus.provider === 'cloud' ? 'Cloud Naturalist' : currentStatus.provider;
              const displayModel = currentStatus.model || (selectedMode === 'cloud' ? 'gemini-3.8-flash' : ollamaModel);
              return (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-parchment-warm text-forest-deep border border-border-subtle flex items-center gap-1.5 shadow-2xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                  <span>Active: {displayProvider} ({displayModel})</span>
                </span>
              );
            })()}
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
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5 text-amber-800" />
                    <span>Rate-Limit Protected</span>
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
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-forest-deep/10 text-forest-deep">
                    Self-Hosted & Private
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Unlimited • No Rate Limits
                  </span>
                </div>
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

              {/* AI Suggestion Box: Pro-Tip to use Local for Best Experience */}
              <div className="p-3.5 rounded-xl bg-forest-deep/5 border border-forest-deep/15 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-[11px] font-bold text-forest-deep flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-moss-green" />
                    <span>AI Recommendation for Best Experience</span>
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-forest-deep/10 text-forest-deep flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5 text-forest-deep" />
                    <span>Rate-Limiter Active</span>
                  </span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {aiStatus?.suggestion ||
                    "Want an even better experience? For lower latency, zero rate limits, and 100% private offline exploration, we recommend running Local AI (Ollama with qwen2.5:3b)."}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-border-subtle/40 flex-wrap gap-2">
                  <span className="text-[10px] text-text-muted font-mono">
                    Production cap: {aiStatus?.rateLimit?.missionsPerMinute || 15} quests / min per IP
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedMode('ollama')}
                    className="text-[11px] font-bold text-forest-deep hover:text-moss-green hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Switch to Local AI</span>
                    <span aria-hidden="true">&rarr;</span>
                  </button>
                </div>
              </div>

              {/* Premium Cloud Naturalist Architecture & Live Multi-Cloud Failover Pipeline */}
              {(() => {
                const currentStatus = testResult || aiStatus;
                const isAvailable = currentStatus?.status === 'available';
                const effectiveCloudService = selectedCloudService || currentStatus?.cloudService || 'gemini';
                const isGroqPrimary = effectiveCloudService === 'groq';

                const geminiList = currentStatus?.geminiModels && currentStatus.geminiModels.length > 0
                  ? currentStatus.geminiModels
                  : ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-flash-lite-latest'];

                const groqList = currentStatus?.groqModels && currentStatus.groqModels.length > 0
                  ? currentStatus.groqModels
                  : ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-120b'];

                const primaryModel = currentStatus?.model || (isGroqPrimary ? groqList[0] : geminiList[0]);
                const totalTiers = geminiList.length + groqList.length + 2;

                return (
                  <div className="relative overflow-hidden rounded-2xl border border-forest-deep/15 bg-gradient-to-b from-paper-white via-parchment-warm/25 to-paper-white p-4 sm:p-5 shadow-xs space-y-4">
                    {/* Ambient botanical aura glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-leaf-accent/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

                    {/* 1. Header: Multi-Cloud Resilience Engine Identity */}
                    <div className="flex items-center justify-between flex-wrap gap-3 relative z-10 pb-3 border-b border-border-subtle/60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-forest-deep text-leaf-accent flex items-center justify-center shadow-xs ring-1 ring-forest-deep/20 shrink-0">
                          <Cloud className="w-5 h-5 text-leaf-accent" />
                        </div>
                        <div>
                          <h4 className="font-editorial text-base sm:text-lg font-bold text-forest-deep leading-tight">
                            Multi-Cloud Naturalist Engine
                          </h4>
                          <p className="text-[11px] text-text-muted">
                            Google Gemini + Groq LPU dual-cluster architecture with server key rotation
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Gemini Status Chip */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                          <span className="relative flex h-2 w-2">
                            {isAvailable && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                          <span className="text-[10px] font-bold tracking-tight">Gemini Live</span>
                        </div>

                        {/* Groq Status Chip */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs">
                          <span className="relative flex h-2 w-2">
                            {isAvailable && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />}
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                          </span>
                          <span className="text-[10px] font-bold tracking-tight">Groq LPU Live</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Primary Cloud Provider Selector Tabs */}
                    <div className="space-y-1.5 relative z-10">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                        Select Primary Cloud Service:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCloudService('gemini')}
                          className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between text-left cursor-pointer ${
                            !isGroqPrimary
                              ? 'border-forest-deep bg-forest-deep text-paper-white shadow-xs'
                              : 'border-border-subtle bg-paper-white hover:border-moss-green/40 text-forest-deep'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold text-xs">
                              <Sparkles className={`w-3.5 h-3.5 ${!isGroqPrimary ? 'text-leaf-accent' : 'text-forest-deep'}`} />
                              <span>Google Gemini</span>
                            </div>
                            <p className={`text-[10px] ${!isGroqPrimary ? 'text-paper-white/80' : 'text-text-muted'}`}>
                              {geminiList.length} Models • High-Fidelity Multimodal
                            </p>
                          </div>
                          {!isGroqPrimary && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-leaf-accent/20 text-leaf-accent uppercase">
                              Primary
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedCloudService('groq')}
                          className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between text-left cursor-pointer ${
                            isGroqPrimary
                              ? 'border-forest-deep bg-forest-deep text-paper-white shadow-xs'
                              : 'border-border-subtle bg-paper-white hover:border-moss-green/40 text-forest-deep'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold text-xs">
                              <Zap className={`w-3.5 h-3.5 ${isGroqPrimary ? 'text-leaf-accent' : 'text-amber-700'}`} />
                              <span>Groq Cloud (LPU)</span>
                            </div>
                            <p className={`text-[10px] ${isGroqPrimary ? 'text-paper-white/80' : 'text-text-muted'}`}>
                              {groqList.length} Models • Ultra-Fast Sub-Second Inference
                            </p>
                          </div>
                          {isGroqPrimary && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-leaf-accent/20 text-leaf-accent uppercase">
                              Primary
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 3. Hero Active Model Spotlight (Dark Forest Glass Card) */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-forest-deep via-[#102C25] to-forest-deep p-4 text-paper-white shadow-md border border-forest-deep/40 z-10">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-leaf-accent uppercase">
                            <Sparkles className="w-3 h-3 text-leaf-accent" />
                            <span>Active Primary Model • Tier 1 Ingestion</span>
                          </div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono text-sm sm:text-base font-bold tracking-wide text-paper-white break-all">
                              {primaryModel}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-leaf-accent/20 text-leaf-accent border border-leaf-accent/30 flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5" />
                              <span>Live Inference</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <div className="px-3 py-1.5 rounded-lg bg-paper-white/10 backdrop-blur-xs border border-paper-white/10 text-left sm:text-right">
                            <span className="text-[9px] uppercase tracking-wider text-paper-white/70 block">Failover Protection</span>
                            <span className="text-xs font-bold text-leaf-accent font-mono">
                              {totalTiers} Tiers Active
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4. Interactive Multi-Cluster Sequential Failover Pipeline */}
                    <div className="space-y-3 relative z-10 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-forest-deep flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-moss-green" />
                          <span>Sequential Failover Pipeline (Live from .env)</span>
                        </span>
                        <span className="text-[10px] text-text-muted font-medium">
                          Zero-Downtime Auto-Handoff
                        </span>
                      </div>

                      {/* Cluster A: Google Gemini Models */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>Google Gemini Cluster ({geminiList.length} Models)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                          {geminiList.map((modelId, idx) => {
                            const isCurrentPrimary = !isGroqPrimary && (idx === 0 || modelId === primaryModel);
                            return (
                              <div
                                key={modelId}
                                className={`p-3 rounded-xl border transition-all space-y-1 ${
                                  isCurrentPrimary
                                    ? 'bg-forest-deep text-paper-white border-forest-deep shadow-xs'
                                    : 'bg-paper-white border-border-subtle hover:border-emerald-600/40'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className={`font-bold uppercase tracking-wider ${isCurrentPrimary ? 'text-leaf-accent' : 'text-emerald-800'}`}>
                                    Tier {idx + 1} • {isCurrentPrimary ? 'Active' : 'Standby'}
                                  </span>
                                  {isCurrentPrimary ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-leaf-accent animate-pulse" />
                                  ) : (
                                    <span className="text-[9px] font-mono text-text-muted bg-parchment-warm px-1.5 py-0.5 rounded">
                                      Auto-Retry
                                    </span>
                                  )}
                                </div>
                                <div className={`font-mono text-xs font-bold break-all ${isCurrentPrimary ? 'text-paper-white' : 'text-forest-deep'}`}>
                                  {modelId}
                                </div>
                                <p className={`text-[10px] ${isCurrentPrimary ? 'text-paper-white/75' : 'text-text-muted'}`}>
                                  {idx === 0 ? 'Primary Naturalist Engine' : 'Instant Quota Failover'}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Cluster B: Groq Cloud Models */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                          <Zap className="w-3 h-3 text-amber-700" />
                          <span>Groq LPU High-Speed Cluster ({groqList.length} Models)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {groqList.map((modelId, idx) => {
                            const isCurrentPrimary = isGroqPrimary && (idx === 0 || modelId === primaryModel);
                            const tierNumber = geminiList.length + idx + 1;
                            return (
                              <div
                                key={modelId}
                                className={`p-3 rounded-xl border transition-all space-y-1 ${
                                  isCurrentPrimary
                                    ? 'bg-forest-deep text-paper-white border-forest-deep shadow-xs'
                                    : 'bg-paper-white border-border-subtle hover:border-amber-600/40'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className={`font-bold uppercase tracking-wider ${isCurrentPrimary ? 'text-leaf-accent' : 'text-amber-800'}`}>
                                    Tier {tierNumber} • {isCurrentPrimary ? 'Active' : 'LPU Standby'}
                                  </span>
                                  {isCurrentPrimary ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-leaf-accent animate-pulse" />
                                  ) : (
                                    <span className="text-[9px] font-mono text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                                      Groq LPU
                                    </span>
                                  )}
                                </div>
                                <div className={`font-mono text-xs font-bold break-all ${isCurrentPrimary ? 'text-paper-white' : 'text-forest-deep'}`}>
                                  {modelId}
                                </div>
                                <p className={`text-[10px] ${isCurrentPrimary ? 'text-paper-white/75' : 'text-text-muted'}`}>
                                  {idx === 0 ? 'Secondary Cloud Failover' : 'High-Speed LPU Redundancy'}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Cluster C: On-Device & Air-Gapped Resiliency */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-moss-green">
                          <Shield className="w-3 h-3 text-moss-green" />
                          <span>Local & Air-Gapped Resiliency Tiers</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Local AI Container Tier */}
                          <div className="p-3 rounded-xl bg-paper-white border border-border-subtle hover:border-moss-green/40 transition-all space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-amber-800 uppercase tracking-wider">
                                Tier {geminiList.length + groqList.length + 1} • On-Device
                              </span>
                              <Server className="w-3 h-3 text-amber-700" />
                            </div>
                            <div className="font-mono text-xs font-bold text-forest-deep">
                              Local AI (Ollama Container)
                            </div>
                            <p className="text-[10px] text-text-muted">
                              Open-Weight Private Container
                            </p>
                          </div>

                          {/* Air-Gapped Field Library Tier */}
                          <div className="p-3 rounded-xl bg-paper-white border border-border-subtle hover:border-moss-green/40 transition-all space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-moss-green uppercase tracking-wider">
                                Tier {geminiList.length + groqList.length + 2} • Air-Gapped
                              </span>
                              <CheckCircle2 className="w-3 h-3 text-moss-green" />
                            </div>
                            <div className="font-mono text-xs font-bold text-forest-deep">
                              Curated Field Logs
                            </div>
                            <p className="text-[10px] text-text-muted">
                              100% Offline Resilience Archive
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 5. Live Telemetry & Handshake Bar */}
                    <div className="p-3 rounded-xl bg-forest-deep/5 border border-forest-deep/10 flex items-center justify-between flex-wrap gap-2 z-10 relative">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-moss-green shrink-0" />
                        <span className="text-[11px] font-mono text-forest-deep leading-relaxed">
                          {currentStatus?.message || `Ready: Connected via ${effectiveCloudService === 'groq' ? 'Groq Cloud' : 'Google Gemini'} (${primaryModel})`}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-text-muted font-mono whitespace-nowrap">
                        15 quests/min rate limit
                      </span>
                    </div>
                  </div>
                );
              })()}

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
            <div className="relative overflow-hidden rounded-2xl border border-forest-deep/15 bg-gradient-to-b from-paper-white via-parchment-warm/25 to-paper-white p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in">
              {/* Ambient botanical aura glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-moss-green/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

              {/* 1. Header: Container Runtime Identity & Status */}
              <div className="flex items-center justify-between flex-wrap gap-2.5 relative z-10 pb-3 border-b border-border-subtle/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-forest-deep text-leaf-accent flex items-center justify-center shadow-xs ring-1 ring-forest-deep/20 shrink-0">
                    <Server className="w-5 h-5 text-leaf-accent" />
                  </div>
                  <div>
                    <h4 className="font-editorial text-base sm:text-lg font-bold text-forest-deep leading-tight">
                      Local AI Container Engine
                    </h4>
                    <p className="text-[11px] text-text-muted">
                      100% Offline • Zero-Network Privacy • Containerized Podman / Ollama Runtime
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-bold tracking-tight">Container Ready</span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted bg-paper-white px-2 py-0.5 rounded-full border border-border-subtle">
                    Port 11434
                  </span>
                </div>
              </div>

              {/* 2. Hero Active Model Spotlight (Sleek Dark Forest Container Card) */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-forest-deep via-[#102C25] to-forest-deep p-4 text-paper-white shadow-md border border-forest-deep/40 z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-leaf-accent uppercase">
                      <Sparkles className="w-3 h-3 text-leaf-accent" />
                      <span>Tier 1 Local Inference • On-Device Runtime</span>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-base sm:text-lg font-bold tracking-wide text-paper-white">
                        {ollamaModel}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-leaf-accent/20 text-leaf-accent border border-leaf-accent/30 flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />
                        <span>100% Private &amp; Air-Gapped</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="px-3 py-1.5 rounded-lg bg-paper-white/10 backdrop-blur-xs border border-paper-white/10 text-left sm:text-right">
                      <span className="text-[9px] uppercase tracking-wider text-paper-white/70 block">Container Status</span>
                      <span className="text-xs font-bold text-leaf-accent font-mono">
                        {isCurrentModelInstalled ? 'Downloaded & Ready' : 'Download Needed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Curated Open-Weight Models Grid */}
              <div className="space-y-2 relative z-10 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-forest-deep flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-moss-green" />
                    <span>Select Open-Weight Model Fleet</span>
                  </span>
                  <span className="text-[10px] text-text-muted font-medium">
                    Zero Rate Limits
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {popularOllamaModels.map(m => {
                    const isPresetInstalled = isModelInstalled(m.id);
                    const isSelected = ollamaModel === m.id;

                    return (
                      <div
                        key={m.id}
                        onClick={() => setOllamaModel(m.id)}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'border-forest-deep bg-forest-deep text-paper-white shadow-xs'
                            : 'border-border-subtle bg-paper-white hover:border-moss-green/40 text-forest-deep'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-xs font-bold truncate">
                            {m.name}
                          </span>
                          {isPresetInstalled ? (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                              isSelected ? 'bg-leaf-accent/20 text-leaf-accent' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-leaf-accent' : 'bg-emerald-600'}`} />
                              <span>Downloaded</span>
                            </span>
                          ) : (
                            <span className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold shrink-0 ${
                              isSelected ? 'bg-paper-white/20 text-paper-white' : 'bg-amber-100 text-amber-800'
                            }`}>
                              Requires Pull
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] leading-tight ${isSelected ? 'text-paper-white/80' : 'text-text-muted'}`}>
                          {m.note}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Model Input (Subtle & Inline) */}
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
                      Custom Model Tag:
                    </label>
                    <input
                      type="text"
                      value={ollamaModel}
                      onChange={e => setOllamaModel(e.target.value)}
                      placeholder="e.g. qwen2.5:3b, deepseek-r1:1.5b"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-border-subtle bg-paper-white text-xs font-mono text-forest-deep focus:outline-none focus:border-forest-deep"
                    />
                  </div>
                </div>

                {/* Visual Instruction: If selected model requires Podman download */}
                {!isCurrentModelInstalled && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-amber-950 font-bold">
                      <Download className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Download "{ollamaModel}" into Podman container</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Run this command once in your terminal to cache the weights offline:
                    </p>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-forest-deep text-leaf-accent font-mono text-[11px] shadow-2xs">
                      <span className="overflow-x-auto scrollbar-none pr-2">
                        podman exec -it fieldquest-ai ollama pull {ollamaModel}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`podman exec -it fieldquest-ai ollama pull ${ollamaModel}`)}
                        className="p-1 hover:bg-white/10 rounded cursor-pointer text-paper-white shrink-0"
                        title="Copy pull command"
                      >
                        {copiedCommand ? <Check className="w-3.5 h-3.5 text-leaf-accent" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {installedList.length > 0 && (
                      <div className="text-[11px] text-amber-900 flex flex-wrap items-center gap-1 pt-0.5">
                        <span>Or select a currently downloaded model:</span>
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
              </div>

              {/* 4. Streamlined Container Endpoint Bar (Discreet with Edit Toggle) */}
              <div className="p-3 rounded-xl bg-forest-deep/5 border border-forest-deep/10 space-y-2 z-10 relative">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-moss-green shrink-0" />
                    <span className="text-[11px] font-mono text-forest-deep">
                      Daemon Endpoint: <span className="font-bold">{endpoint}</span>
                    </span>
                    <span className="text-[10px] text-text-muted font-sans">(Default Standard Port)</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCustomEndpoint(!showCustomEndpoint)}
                    className="text-[11px] font-bold text-forest-deep hover:text-moss-green hover:underline cursor-pointer"
                  >
                    {showCustomEndpoint ? 'Close Editor' : 'Edit Endpoint'}
                  </button>
                </div>

                {showCustomEndpoint && (
                  <div className="pt-2 border-t border-border-subtle/50 space-y-1.5 animate-in fade-in">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      Custom Ollama Daemon Host URL:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={endpoint}
                        onChange={e => setEndpoint(e.target.value)}
                        placeholder="http://localhost:11434"
                        className="flex-1 px-3 py-1.5 rounded-xl border border-border-subtle bg-paper-white text-xs font-mono text-forest-deep focus:outline-none focus:border-forest-deep"
                      />
                      <button
                        type="button"
                        onClick={() => setEndpoint('http://localhost:11434')}
                        className="px-2.5 py-1.5 rounded-xl border border-border-subtle bg-paper-white hover:bg-parchment-warm text-[11px] font-semibold text-text-muted"
                      >
                        Reset Default
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Test Connection & Save Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleTestConnection}
                  className="px-4 py-2 rounded-xl bg-forest-deep text-paper-white text-xs font-semibold hover:bg-forest-dark transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
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
                      <span className="text-emerald-700 font-bold">Preferences Saved!</span>
                    </>
                  ) : (
                    <span>Save Preference</span>
                  )}
                </button>
              </div>

              {/* 6. Test Result Feedback Box */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs space-y-1.5 border animate-in fade-in ${
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
