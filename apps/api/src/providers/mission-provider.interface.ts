import { AdventurePreferences } from '../schemas/adventure.schema.js';
import { NatureMission } from '../schemas/mission.schema.js';

export interface ProviderAvailability {
  available: boolean;
  status: 'available' | 'unavailable';
  provider: 'ollama' | 'demo';
  model: string;
  endpoint?: string;
  message: string;
  error?: string;
}

export interface AIMissionProvider {
  readonly providerId: 'ollama' | 'demo';
  readonly modelId: string;
  checkAvailability(): Promise<ProviderAvailability>;
  generateMissions(preferences: AdventurePreferences): Promise<NatureMission[]>;
}
