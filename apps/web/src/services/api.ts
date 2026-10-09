import { AdventurePreferences, AIProviderStatus, NatureMission } from '../types/index.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface GenerateMissionsResult {
  sessionId: string;
  provider: 'ollama' | 'demo';
  model: string;
  generatedAt: string;
  preferences: AdventurePreferences;
  missions: NatureMission[];
}

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchAIStatus(
  mode?: 'demo' | 'ollama',
  model?: string,
  endpoint?: string
): Promise<AIProviderStatus> {
  const params = new URLSearchParams();
  if (mode) params.set('mode', mode);
  if (model) params.set('model', model);
  if (endpoint) params.set('endpoint', endpoint);
  const query = params.toString() ? `?${params.toString()}` : '';

  const res = await fetch(`${API_BASE_URL}/api/v1/ai/status${query}`);
  if (!res.ok) {
    return {
      available: false,
      status: 'unavailable',
      provider: mode || 'ollama',
      model: model || 'unknown',
      message: 'Failed to contact backend API service.',
    };
  }
  return res.json();
}

export async function saveAIConfig(data: {
  mode?: 'demo' | 'ollama';
  model?: string;
  endpoint?: string;
}): Promise<{ success: boolean; status: AIProviderStatus }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ai/configure`, {
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
  forcedMode?: 'ollama' | 'demo',
  model?: string,
  endpoint?: string
): Promise<GenerateMissionsResult> {
  const res = await fetch(`${API_BASE_URL}/api/v1/missions/generate`, {
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
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const err = new Error(
      errorJson?.error?.message || `Generation failed with status ${res.status}`
    );
    (err as any).code = errorJson?.error?.code;
    (err as any).details = errorJson?.error?.details;
    throw err;
  }

  return res.json();
}

export interface MissionScaffoldResult {
  scaffold: string;
  provider: 'ollama' | 'demo';
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
  forcedMode?: 'ollama' | 'demo',
  model?: string,
  endpoint?: string
): Promise<MissionScaffoldResult> {
  const res = await fetch(`${API_BASE_URL}/api/v1/missions/scaffold`, {
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
    }),
  });

  if (!res.ok) {
    throw new Error(`Scaffold request failed with status ${res.status}`);
  }

  return res.json();
}

