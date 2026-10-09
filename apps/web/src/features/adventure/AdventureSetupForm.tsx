import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Compass,
  Clock,
  MapPin,
  Sparkles,
  TreePine,
  Trees,
  Sprout,
  Building2,
  Mountain,
  Home,
  SlidersHorizontal,
  Gauge,
  Volume2,
  Flower2,
  Bug,
  Bird,
  Layers,
  Accessibility,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  AdventurePreferences,
  EnvironmentType,
  InterestType,
  Difficulty,
  AIProviderStatus,
} from '../../types/index.js';
import { requestGenerateMissions, fetchAIStatus } from '../../services/api.js';
import { useAdventureSessionStore } from '../../store/adventure-session.store.js';

interface AdventureSetupFormProps {
  onOpenSettings?: () => void;
}

export const AdventureSetupForm: React.FC<AdventureSetupFormProps> = ({ onOpenSettings }) => {
  const navigate = useNavigate();
  const startSession = useAdventureSessionStore(s => s.startSession);

  // Form State with sensible defaults
  const [duration, setDuration] = useState<15 | 30 | 60>(15);
  const [environment, setEnvironment] = useState<EnvironmentType>('park');
  const [interests, setInterests] = useState<InterestType[]>(['plants', 'sounds']);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [accessibleMobility, setAccessibleMobility] = useState<boolean>(false);
  const [customFocus, setCustomFocus] = useState<string>('');
  const [forcedDemoMode, setForcedDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('fieldquest_ai_mode') === 'demo';
  });

  // Query AI Status
  const { data: aiStatus, refetch: refetchAIStatus } = useQuery<AIProviderStatus>({
    queryKey: ['aiStatus', forcedDemoMode ? 'demo' : 'active'],
    queryFn: () => {
      const mode = forcedDemoMode ? 'demo' : (localStorage.getItem('fieldquest_ai_mode') as 'cloud' | 'ollama' | 'demo') || 'cloud';
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
    staleTime: 15000,
  });

  // Mutation for mission generation
  const generateMutation = useMutation({
    mutationFn: (prefs: AdventurePreferences) => {
      const savedMode = (localStorage.getItem('fieldquest_ai_mode') as 'cloud' | 'ollama' | 'demo') || 'cloud';
      const activeMode = forcedDemoMode ? 'demo' : savedMode;
      const cloudService = (localStorage.getItem('fieldquest_cloud_service') as 'gemini' | 'groq') || 'gemini';
      const cloudApiKey = cloudService === 'groq'
        ? localStorage.getItem('fieldquest_groq_api_key') || undefined
        : localStorage.getItem('fieldquest_gemini_api_key') || undefined;
      const cloudModel = cloudService === 'groq'
        ? (localStorage.getItem('fieldquest_groq_model') || 'llama-3.3-70b-versatile')
        : (localStorage.getItem('fieldquest_gemini_model') || 'gemini-1.5-flash');

      const model = activeMode === 'cloud' ? cloudModel : (localStorage.getItem('fieldquest_ollama_model') || 'qwen2.5:3b');
      const endpoint = localStorage.getItem('fieldquest_ollama_endpoint') || 'http://localhost:11434';
      return requestGenerateMissions(prefs, activeMode, model, endpoint, cloudService, cloudApiKey);
    },
    onSuccess: async (data) => {
      await startSession({
        id: data.sessionId,
        createdAt: data.generatedAt,
        durationMinutes: data.preferences.durationMinutes,
        environment: data.preferences.environment,
        difficulty: data.preferences.difficulty,
        language: 'en',
        interests: data.preferences.interests,
        accessibleMobility: data.preferences.accessibleMobility,
        missions: data.missions,
        status: 'in_progress',
        totalMinutesSpent: 0,
        providerUsed: data.provider,
        modelUsed: data.model,
      });

      navigate('/adventure');
    },
  });

  const toggleInterest = (interest: InterestType) => {
    if (interests.includes(interest)) {
      if (interests.length > 1) {
        setInterests(interests.filter(i => i !== interest));
      }
    } else {
      if (interests.length < 5) {
        setInterests([...interests, interest]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prefs: AdventurePreferences = {
      durationMinutes: duration,
      environment,
      interests,
      difficulty,
      language: 'en',
      accessibleMobility,
      customFocus: customFocus.trim() || undefined,
    };
    generateMutation.mutate(prefs);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-deep/10 text-forest-deep text-xs font-semibold mb-3">
          <Compass className="w-3.5 h-3.5 text-moss-green" />
          <span>Adventure Configuration</span>
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-forest-deep mb-2">
          Plan Your Nature Quest
        </h1>
        <p className="text-sm text-text-muted">
          Select your time, setting, and interests. AI generates safe observational quests tailored to your surroundings.
        </p>
      </div>

      {/* AI Provider Status Banner */}
      {aiStatus && aiStatus.status === 'unavailable' && !forcedDemoMode && (
        <div className="mb-8 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">
                Local AI (Ollama) is currently unreachable
              </p>
              <p className="text-amber-800 text-xs mt-0.5">
                You can explore with our instant curated naturalist engine (Demo Mode).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setForcedDemoMode(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-800 text-amber-50 font-medium hover:bg-amber-900 transition-colors text-xs whitespace-nowrap self-end sm:self-auto cursor-pointer"
          >
            Switch to Demo Mode
          </button>
        </div>
      )}

      {forcedDemoMode && (
        <div className="mb-8 p-3 rounded-xl border border-moss-green/30 bg-forest-deep/5 text-forest-deep text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-moss-green" />
            <span>
              Demo Mode Active: Deterministic curated naturalist missions.
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              setForcedDemoMode(false);
              refetchAIStatus();
            }}
            className="text-xs text-forest-deep font-semibold underline hover:text-forest-dark cursor-pointer"
          >
            Retry Ollama
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Duration Selection */}
        <section className="bg-paper-white rounded-2xl border border-border-subtle p-4 sm:p-6 shadow-xs">
          <label className="flex items-center gap-2 text-sm font-bold text-forest-deep mb-3 font-editorial">
            <Clock className="w-4 h-4 text-moss-green" />
            <span>1. Available Time</span>
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { mins: 15, label: '15 min', sub: 'Sensory Walk' },
              { mins: 30, label: '30 min', sub: 'Field Observation' },
              { mins: 60, label: '60 min', sub: 'Deep Expedition' },
            ].map(item => (
              <button
                key={item.mins}
                type="button"
                onClick={() => setDuration(item.mins as 15 | 30 | 60)}
                className={`p-2.5 sm:p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                  duration === item.mins
                    ? 'border-forest-deep bg-forest-deep text-paper-white shadow-xs'
                    : 'border-border-subtle bg-paper-white text-forest-deep hover:bg-parchment-warm'
                }`}
              >
                <div className="font-editorial text-base sm:text-lg font-bold">
                  {item.label}
                </div>
                <div className={`text-[10px] sm:text-[11px] leading-tight ${duration === item.mins ? 'text-leaf-accent' : 'text-text-muted'}`}>
                  {item.sub}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Environment Selection */}
        <section className="bg-paper-white rounded-2xl border border-border-subtle p-4 sm:p-6 shadow-xs">
          <label className="flex items-center gap-2 text-sm font-bold text-forest-deep mb-3 font-editorial">
            <MapPin className="w-4 h-4 text-moss-green" />
            <span>2. Your Immediate Environment</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-2.5">
            {[
              { id: 'park', name: 'City Park', icon: Trees },
              { id: 'garden', name: 'Garden', icon: Sprout },
              { id: 'urban', name: 'Urban Street', icon: Building2 },
              { id: 'trail', name: 'Nature Trail', icon: Mountain },
              { id: 'balcony', name: 'Balcony / Porch', icon: Home },
            ].map(env => {
              const Icon = env.icon;
              const isSelected = environment === env.id;
              return (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => setEnvironment(env.id as EnvironmentType)}
                  className={`p-2.5 sm:p-3 rounded-xl border text-xs font-medium transition-all text-center flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                    env.id === 'balcony' ? 'col-span-2 sm:col-span-1 md:col-span-1' : ''
                  } ${
                    isSelected
                      ? 'border-forest-deep bg-forest-deep text-paper-white shadow-xs'
                      : 'border-border-subtle bg-paper-white text-forest-deep hover:bg-parchment-warm'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-leaf-accent' : 'text-moss-green'}`} />
                  <span>{env.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Interests Selection */}
        <section className="bg-paper-white rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-sm font-bold text-forest-deep font-editorial">
              <Flower2 className="w-4 h-4 text-moss-green" />
              <span>3. What do you want to observe?</span>
            </label>
            <span className="text-xs text-text-muted">
              {interests.length}/5 selected
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'plants', icon: Flower2, name: 'Plants & Leaves' },
              { id: 'birds', icon: Bird, name: 'Birds & Calls' },
              { id: 'insects', icon: Bug, name: 'Insects & Spiders' },
              { id: 'trees', icon: TreePine, name: 'Trees & Bark' },
              { id: 'sounds', icon: Volume2, name: 'Sounds & Wind' },
              { id: 'patterns', icon: Layers, name: 'Textures & Patterns' },
              { id: 'biodiversity', icon: Sparkles, name: 'Micro-Habitats' },
            ].map(item => {
              const Icon = item.icon;
              const isSelected = interests.includes(item.id as InterestType);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleInterest(item.id as InterestType)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-forest-deep text-paper-white border-forest-deep'
                      : 'bg-paper-white text-forest-deep border-border-subtle hover:bg-parchment-warm'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-leaf-accent' : 'text-moss-green'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Difficulty & Accessibility Options */}
        <section className="bg-paper-white rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-xs space-y-4">
          <label className="flex items-center gap-2 text-sm font-bold text-forest-deep font-editorial">
            <SlidersHorizontal className="w-4 h-4 text-moss-green" />
            <span>4. Depth & Mobility Options</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Difficulty Toggle */}
            <div className="flex items-center gap-2 p-3 rounded-xl border border-border-subtle bg-parchment-warm/40">
              <span className="text-xs font-semibold text-forest-deep flex items-center gap-1.5 w-24 shrink-0">
                <Gauge className="w-3.5 h-3.5 text-moss-green" />
                <span>Difficulty:</span>
              </span>
              <div className="flex gap-1.5 flex-1">
                {(['easy', 'exploratory'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      difficulty === d
                        ? 'bg-forest-deep text-paper-white'
                        : 'bg-paper-white text-forest-deep hover:bg-parchment-warm border border-border-subtle'
                    }`}
                  >
                    {d === 'easy' ? 'Easy' : 'Exploratory'}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobility Toggle */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-parchment-warm/40 cursor-pointer">
              <div className="flex items-center gap-2 min-w-0">
                <Accessibility className="w-4 h-4 text-moss-green shrink-0" />
                <span className="text-xs font-medium text-forest-deep truncate">
                  Stationary / Seated observation only
                </span>
              </div>
              <input
                type="checkbox"
                checked={accessibleMobility}
                onChange={e => setAccessibleMobility(e.target.checked)}
                className="w-4 h-4 rounded text-forest-deep accent-forest-deep cursor-pointer shrink-0 ml-2"
              />
            </label>
          </div>

          {/* Optional Custom Focus */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-forest-deep">
                <Sparkles className="w-3.5 h-3.5 text-moss-green" />
                <span>Custom observation focus (tailor missions to a specific topic):</span>
              </label>
              {customFocus && (
                <button
                  type="button"
                  onClick={() => setCustomFocus('')}
                  className="text-[11px] text-text-muted hover:text-red-700 cursor-pointer"
                >
                  Clear focus
                </button>
              )}
            </div>
            <input
              type="text"
              value={customFocus}
              onChange={e => setCustomFocus(e.target.value)}
              placeholder="e.g. Look for bilateral leaf symmetry, moss on brick walls, or audio sound layering"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border-subtle bg-paper-white focus:outline-none focus:border-forest-deep focus:ring-2 focus:ring-forest-deep/10 font-medium"
              maxLength={120}
            />

            {/* Quick customization chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-text-muted font-medium mr-1">Quick focus suggestions:</span>
              {[
                { label: '🌿 Leaf Venation & Symmetry', value: 'Bilateral leaf symmetry and venation patterns' },
                { label: '🍃 Margins & Surface', value: 'Leaf margin serration, cuticle waxiness, and trichomes' },
                { label: '👂 3D Audio Soundscape', value: 'Canopy bioacoustics and layered environmental sounds' },
                { label: '🌲 Tree Bark & Lichen', value: 'Corticolous lichens and furrowed tree bark textures' },
                { label: '🧱 Urban Pavement Flora', value: 'Pioneer vegetation in sidewalk cracks and brick mortar' },
                { label: '🐦 Avian Behavior', value: 'Bird perch selection, flight paths, and territorial calls' },
              ].map(chip => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setCustomFocus(chip.value)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    customFocus === chip.value
                      ? 'bg-forest-deep text-paper-white border-forest-deep shadow-xs font-semibold'
                      : 'bg-parchment-warm/70 hover:bg-forest-deep/10 text-forest-deep border-border-subtle'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Error Notice */}
        {generateMutation.isError && (
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-950 text-xs sm:text-sm space-y-2.5">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>
                {(generateMutation.error as any)?.code === 'RATE_LIMIT_EXCEEDED' ||
                (generateMutation.error as any)?.message?.toLowerCase().includes('rate limit')
                  ? 'Production Rate Limit Reached'
                  : 'Mission Generation Notice'}
              </span>
            </div>
            <p className="text-amber-900 leading-relaxed">
              {(generateMutation.error as any)?.message || 'Service temporarily busy.'}
            </p>
            <div className="p-2.5 rounded-lg bg-amber-100/70 text-amber-950 text-xs flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>AI Recommendation:</strong>{' '}
                {(generateMutation.error as any)?.suggestion ||
                  'For zero rate limits, lower latency, and 100% private offline exploration, use Local AI (Ollama with qwen2.5:3b).'}
              </span>
            </div>
            <div className="pt-1 flex flex-wrap gap-2">
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="px-3 py-1.5 rounded-lg bg-forest-deep text-paper-white font-medium hover:bg-forest-dark transition-colors text-xs cursor-pointer"
                >
                  Configure Local AI
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setForcedDemoMode(true);
                  handleSubmit(new Event('submit') as any);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-800 text-white font-medium hover:bg-amber-900 transition-colors text-xs cursor-pointer"
              >
                Run in Demo Mode Instead
              </button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={generateMutation.isPending}
            className="w-full py-4 rounded-xl bg-forest-deep text-paper-white font-medium text-base shadow-md hover:bg-forest-dark transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-leaf-accent" />
                <span>Generating Nature Quests...</span>
              </>
            ) : (
              <>
                <Compass className="w-5 h-5 text-leaf-accent" />
                <span>Begin {duration}-Minute Adventure</span>
              </>
            )}
          </button>
        </div>

        {/* Subtle AI Recommendation Footnote */}
        <div className="pt-2 text-center space-y-1">
          <p className="text-[11px] text-text-muted">
            ✨ Powered by Production Cloud AI with failover & rate-limit protection.
          </p>
          {onOpenSettings && (
            <p className="text-[11px] text-text-muted">
              Want lower latency & unlimited generations?{' '}
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-forest-deep font-semibold underline hover:text-moss-green cursor-pointer inline-flex items-center gap-0.5"
              >
                <span>Switch to Local AI (Ollama)</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
