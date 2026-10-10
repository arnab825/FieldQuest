import { AdventurePreferences } from '../schemas/adventure.schema.js';
import { NatureMission } from '../schemas/mission.schema.js';

export interface ProviderAvailability {
  available: boolean;
  status: 'available' | 'unavailable';
  provider: 'ollama' | 'demo' | 'cloud';
  model: string;
  endpoint?: string;
  cloudService?: 'gemini' | 'groq';
  message: string;
  suggestion?: string;
  rateLimit?: {
    missionsPerMinute: number;
    windowMs: number;
  };
  error?: string;
  installedModels?: string[];
  fallbackModels?: string[];
  configuredModels?: string[];
  geminiModels?: string[];
  groqModels?: string[];
  geminiAvailable?: boolean;
  groqAvailable?: boolean;
}

export interface AIMissionProvider {
  readonly providerId: 'ollama' | 'demo' | 'cloud';
  readonly modelId: string;
  checkAvailability(options?: any): Promise<ProviderAvailability>;
  generateMissions(preferences: AdventurePreferences, options?: any): Promise<NatureMission[]>;
}
