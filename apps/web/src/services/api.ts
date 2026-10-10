import { AdventurePreferences, AIProviderStatus, NatureMission } from '../types/index.js';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('fieldquest_api_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
  return envUrl ? envUrl.replace(/\/+$/, '') : '';
}

export interface GenerateMissionsResult {
  sessionId: string;
  provider: 'ollama' | 'demo' | 'cloud';
  model: string;
  generatedAt: string;
  preferences: AdventurePreferences;
  missions: NatureMission[];
}

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/v1/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchAIStatus(
  mode?: 'demo' | 'ollama' | 'cloud',
  model?: string,
  endpoint?: string,
  cloudService?: 'gemini' | 'groq',
  apiKey?: string
): Promise<AIProviderStatus> {
  const params = new URLSearchParams();
  if (mode) params.set('mode', mode);
  if (model) params.set('model', model);
  if (endpoint) params.set('endpoint', endpoint);
  if (cloudService) params.set('cloudService', cloudService);
  if (apiKey) params.set('apiKey', apiKey);
  const query = params.toString() ? `?${params.toString()}` : '';

  const base = getApiBaseUrl();
  if (base) {
    try {
      const res = await fetch(`${base}/api/v1/ai/status${query}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        return await res.json();
      }
    } catch {
      // Backend unreachable, attempt direct Ollama connection below if selected
    }
  }

  // Direct Browser -> Ollama fallback (enables checking Ollama directly from the web app)
  if (mode === 'ollama') {
    const ollamaUrl = (endpoint || 'http://localhost:11434').replace(/\/+$/, '');
    try {
      const directRes = await fetch(`${ollamaUrl}/api/tags`);
      if (directRes.ok) {
        const data = await directRes.json();
        const models = Array.isArray(data?.models) ? data.models.map((m: any) => m.name || m.model) : [];
        const targetModel = model || 'qwen2.5:3b';
        const isTargetInstalled = models.some((m: string) => m.includes(targetModel));
        return {
          available: isTargetInstalled || models.length > 0,
          status: 'available',
          provider: 'ollama',
          model: targetModel,
          installedModels: models,
          message: `Direct local Ollama connected on port ${ollamaUrl.split(':').pop() || '11434'}.`,
        };
      }
    } catch {
      return {
        available: false,
        status: 'unavailable',
        provider: 'ollama',
        model: model || 'qwen2.5:3b',
        message: `Local Ollama is offline at ${ollamaUrl}. Run 'ollama serve' to start.`,
      };
    }
  }

  return {
    available: false,
    status: 'unavailable',
    provider: mode || 'cloud',
    model: model || 'unknown',
    cloudService,
    message: 'Backend API server unreachable.',
  };
}

export async function saveAIConfig(data: {
  mode?: 'demo' | 'ollama' | 'cloud';
  model?: string;
  endpoint?: string;
  cloudService?: 'gemini' | 'groq';
  apiKey?: string;
}): Promise<{ success: boolean; status: AIProviderStatus }> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/v1/ai/configure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update backend AI configuration');
  return res.json();
}

export async function requestGenerateMissions(
  preferences: AdventurePreferences,
  forcedMode?: 'ollama' | 'demo' | 'cloud',
  model?: string,
  endpoint?: string,
  cloudService?: 'gemini' | 'groq',
  apiKey?: string
): Promise<GenerateMissionsResult> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/v1/missions/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      ...preferences,
      forcedMode,
      model,
      endpoint,
      cloudService,
      apiKey,
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const err = new Error(
      errorJson?.error?.message || `Generation failed with status ${res.status}`
    );
    (err as any).code = errorJson?.error?.code || (res.status === 429 ? 'RATE_LIMIT_EXCEEDED' : undefined);
    (err as any).suggestion = errorJson?.error?.suggestion;
    (err as any).details = errorJson?.error?.details;
    throw err;
  }

  return res.json();
}

export interface MissionScaffoldResult {
  scaffold: string;
  provider: 'ollama' | 'demo' | 'cloud';
  model: string;
}

export async function requestMissionScaffold(
  missionData: {
    missionTitle: string;
    objective: string;
    environment?: string;
    observationCriteria?: string[];
    customNotes?: string;
  },
  forcedMode?: 'ollama' | 'demo' | 'cloud',
  model?: string,
  endpoint?: string,
  cloudService?: 'gemini' | 'groq',
  apiKey?: string
): Promise<MissionScaffoldResult> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/v1/missions/scaffold`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      ...missionData,
      forcedMode,
      model,
      endpoint,
      cloudService,
      apiKey,
    }),
  });

  if (!res.ok) {
    throw new Error(`Scaffold request failed with status ${res.status}`);
  }

  return res.json();
}

