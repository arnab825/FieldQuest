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

export async function fetchAIStatus(mode?: 'demo' | 'ollama'): Promise<AIProviderStatus> {
  const query = mode ? `?mode=${mode}` : '';
  const res = await fetch(`${API_BASE_URL}/api/v1/ai/status${query}`);
  if (!res.ok) {
    return {
      available: false,
      status: 'unavailable',
      provider: mode || 'ollama',
      model: 'unknown',
      message: 'Failed to contact backend API service.',
    };
  }
  return res.json();
}

export async function requestGenerateMissions(
  preferences: AdventurePreferences,
  forcedMode?: 'ollama' | 'demo'
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
