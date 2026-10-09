import { AIMissionProvider, ProviderAvailability } from '../providers/mission-provider.interface.js';
import { OllamaMissionProvider, AIProviderError } from '../providers/ollama.provider.js';
import { DemoMissionProvider } from '../providers/demo.provider.js';
import { AdventurePreferences, AdventurePreferencesSchema } from '../schemas/adventure.schema.js';
import { GenerateMissionsResponse, NatureMission } from '../schemas/mission.schema.js';
import { config } from '../config/index.js';
import crypto from 'crypto';

export class MissionGeneratorService {
  private ollamaProvider: OllamaMissionProvider;
  private demoProvider: DemoMissionProvider;

  constructor() {
    this.ollamaProvider = new OllamaMissionProvider(
      config.ollamaBaseUrl,
      config.ollamaModel,
      config.ollamaTimeoutMs
    );
    this.demoProvider = new DemoMissionProvider();
  }

  getProvider(forcedMode?: 'ollama' | 'demo'): AIMissionProvider {
    const selectedMode = forcedMode || config.aiProvider;
    if (selectedMode === 'ollama') {
      return this.ollamaProvider;
    }
    return this.demoProvider;
  }

  updateOllamaConfig(baseUrl?: string, model?: string) {
    if (baseUrl) this.ollamaProvider.baseUrl = baseUrl;
    if (model) this.ollamaProvider.modelId = model;
  }

  async checkAIStatus(
    forcedMode?: 'ollama' | 'demo',
    model?: string,
    endpoint?: string
  ): Promise<ProviderAvailability> {
    const provider = this.getProvider(forcedMode);
    if (provider.providerId === 'ollama') {
      return await this.ollamaProvider.checkAvailability(model, endpoint);
    }
    return await provider.checkAvailability();
  }

  async generateAdventureMissions(
    rawPreferences: unknown,
    forcedMode?: 'ollama' | 'demo',
    model?: string,
    endpoint?: string
  ): Promise<GenerateMissionsResponse> {
    // Validate request preferences using Zod
    const preferencesResult = AdventurePreferencesSchema.safeParse(rawPreferences);
    if (!preferencesResult.success) {
      throw new AIProviderError(
        'INVALID_PREFERENCES',
        'Adventure preferences failed schema validation',
        preferencesResult.error.format()
      );
    }

    const preferences: AdventurePreferences = preferencesResult.data;
    let provider = this.getProvider(forcedMode);

    let missions: NatureMission[];
    try {
      if (provider.providerId === 'ollama') {
        missions = await this.ollamaProvider.generateMissions(preferences, model, endpoint);
      } else {
        missions = await provider.generateMissions(preferences);
      }
    } catch (err: any) {
      // If configured for Ollama but model is not yet pulled or container is warming up, gracefully fallback
      if (provider.providerId === 'ollama') {
        console.warn(`[FieldQuest AI] Ollama provider unavailable or model pending (${err.message}). Gracefully serving naturalist curated demo missions.`);
        provider = this.demoProvider;
        missions = await this.demoProvider.generateMissions(preferences);
      } else {
        if (err instanceof AIProviderError) {
          throw err;
        }
        throw new AIProviderError(
          'AI_GENERATION_FAILED',
          `Unexpected error during mission generation: ${err.message}`,
          err
        );
      }
    }

    // Defensive check: ensure every mission has essential safety text
    const sanitizedMissions = missions.map((m, idx) => ({
      ...m,
      id: m.id || `m-${Date.now()}-${idx + 1}`,
      safetyGuidance: m.safetyGuidance || 'Observe quietly and respect wildlife. Never consume wild plants or fungi.',
      reflectionQuestion: m.reflectionQuestion || 'What surprised you most during this observation?',
      status: 'pending' as const,
    }));

    return {
      sessionId: crypto.randomUUID(),
      provider: provider.providerId,
      model: provider.modelId,
      generatedAt: new Date().toISOString(),
      preferences,
      missions: sanitizedMissions,
    };
  }
}

export const missionGeneratorService = new MissionGeneratorService();
