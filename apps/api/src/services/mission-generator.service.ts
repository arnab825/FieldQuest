import { AIMissionProvider, ProviderAvailability } from '../providers/mission-provider.interface.js';
import { OllamaMissionProvider, AIProviderError } from '../providers/ollama.provider.js';
import { DemoMissionProvider } from '../providers/demo.provider.js';
import { CloudMissionProvider, CloudProviderOptions } from '../providers/cloud.provider.js';
import { AdventurePreferences, AdventurePreferencesSchema } from '../schemas/adventure.schema.js';
import { GenerateMissionsResponse, NatureMission } from '../schemas/mission.schema.js';
import { config } from '../config/index.js';
import crypto from 'crypto';

export class MissionGeneratorService {
  private ollamaProvider: OllamaMissionProvider;
  private demoProvider: DemoMissionProvider;
  private cloudProvider: CloudMissionProvider;

  constructor() {
    this.ollamaProvider = new OllamaMissionProvider(
      config.ollamaBaseUrl,
      config.ollamaModel,
      config.ollamaTimeoutMs
    );
    this.demoProvider = new DemoMissionProvider();
    this.cloudProvider = new CloudMissionProvider({
      defaultService: config.cloudProvider,
      geminiApiKey: config.geminiApiKey,
      geminiModel: config.geminiModel,
      geminiModels: config.geminiModels,
      groqApiKey: config.groqApiKey,
      groqModel: config.groqModel,
      groqModels: config.groqModels,
    });
  }

  getProvider(forcedMode?: 'ollama' | 'demo' | 'cloud'): AIMissionProvider {
    const selectedMode = forcedMode || config.aiProvider;
    if (selectedMode === 'ollama') {
      return this.ollamaProvider;
    }
    if (selectedMode === 'cloud') {
      return this.cloudProvider;
    }
    return this.demoProvider;
  }

  updateOllamaConfig(baseUrl?: string, model?: string) {
    if (baseUrl) this.ollamaProvider.baseUrl = baseUrl;
    if (model) this.ollamaProvider.modelId = model;
  }

  updateCloudConfig(service?: 'gemini' | 'groq', apiKey?: string, model?: string) {
    if (service) this.cloudProvider.defaultService = service;
    if (apiKey) {
      if (service === 'groq') {
        this.cloudProvider.groqApiKey = apiKey;
      } else {
        this.cloudProvider.geminiApiKey = apiKey;
      }
    }
    if (model) {
      if (service === 'groq') {
        this.cloudProvider.groqModel = model;
      } else {
        this.cloudProvider.geminiModel = model;
      }
    }
  }

  async checkAIStatus(
    forcedMode?: 'ollama' | 'demo' | 'cloud',
    model?: string,
    endpoint?: string,
    cloudOptions?: CloudProviderOptions
  ): Promise<ProviderAvailability> {
    const provider = this.getProvider(forcedMode);
    let result: ProviderAvailability;
    if (provider.providerId === 'ollama') {
      result = await this.ollamaProvider.checkAvailability(model, endpoint);
    } else if (provider.providerId === 'cloud') {
      result = await this.cloudProvider.checkAvailability(cloudOptions);
    } else {
      result = await provider.checkAvailability();
    }

    // Attach production rate limit information
    result.rateLimit = {
      missionsPerMinute: config.rateLimitMissionMax,
      windowMs: config.rateLimitMissionWindowMs,
    };

    // Attach contextual recommendation
    if (result.provider === 'cloud') {
      result.suggestion = 'Pro Tip: For lower latency, zero rate limits, and 100% private offline exploration, consider running Local AI (Ollama with qwen2.5:3b).';
    } else if (result.provider === 'ollama') {
      result.suggestion = '🌿 Running with Local Open-Weight AI: Zero rate limits, sovereign privacy, and offline freedom!';
    } else {
      result.suggestion = '⚡ Instant Curated Library active. For dynamic personalized AI, enable Cloud Engine or run Local AI.';
    }

    return result;
  }

  async generateAdventureMissions(
    rawPreferences: unknown,
    forcedMode?: 'ollama' | 'demo' | 'cloud',
    model?: string,
    endpoint?: string,
    cloudOptions?: CloudProviderOptions
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

    let missions: NatureMission[] = [];
    try {
      if (provider.providerId === 'ollama') {
        missions = await this.ollamaProvider.generateMissions(preferences, model, endpoint);
      } else if (provider.providerId === 'cloud') {
        missions = await this.cloudProvider.generateMissions(preferences, {
          ...cloudOptions,
          model: model || cloudOptions?.model,
        });
      } else {
        missions = await provider.generateMissions(preferences);
      }
    } catch (err: any) {
      if (provider.providerId === 'cloud') {
        console.warn(`[FieldQuest AI] Cloud AI exhausted or unavailable (${err.message}). Attempting automatic failover to Local AI (Ollama)...`);
        let failedOverToLocal = false;
        try {
          const ollamaStatus = await this.ollamaProvider.checkAvailability();
          if (ollamaStatus.available) {
            missions = await this.ollamaProvider.generateMissions(preferences);
            provider = this.ollamaProvider;
            failedOverToLocal = true;
            console.log(`[FieldQuest AI] Successfully failed over to Local AI (${provider.modelId}).`);
          }
        } catch (ollamaErr: any) {
          console.warn(`[FieldQuest AI] Local AI failover unavailable (${ollamaErr.message}).`);
        }

        if (!failedOverToLocal) {
          console.log('[FieldQuest AI] Serving curated naturalist library (100% offline fallback).');
          provider = this.demoProvider;
          missions = await this.demoProvider.generateMissions(preferences);
        }
      } else if (provider.providerId === 'ollama') {
        console.warn(`[FieldQuest AI] Ollama provider unavailable (${err.message}). Gracefully serving naturalist curated demo missions.`);
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

  async generateMissionScaffold(
    missionData: {
      missionTitle: string;
      objective: string;
      observationCriteria: string[];
      environment?: string;
      customNotes?: string;
    },
    forcedMode?: 'ollama' | 'demo' | 'cloud',
    model?: string,
    endpoint?: string,
    cloudOptions?: CloudProviderOptions
  ): Promise<{ scaffold: string; provider: string; model: string }> {
    const provider = this.getProvider(forcedMode);

    if (provider.providerId === 'cloud') {
      try {
        const scaffold = await this.cloudProvider.generateMissionScaffold(missionData, {
          ...cloudOptions,
          model: model || cloudOptions?.model,
        });
        return {
          scaffold,
          provider: 'cloud',
          model: this.cloudProvider.modelId,
        };
      } catch (err) {
        console.warn('[FieldQuest AI] Cloud scaffold generation error, falling back to curated scaffold:', err);
      }
    }

    if (provider.providerId === 'ollama') {
      try {
        const activeEndpoint = endpoint || config.ollamaBaseUrl;
        const activeModel = model || config.ollamaModel;

        const systemPrompt = `You are an expert field naturalist and botanical mentor.
Generate an insightful, concise, and structured field observation scaffold for an explorer.
Format with clean bullet points and diagnostic prompts guiding what to observe in the field.
Keep the output under 150 words. Do NOT include markdown code blocks or conversational text.`;

        const userPrompt = `Mission: ${missionData.missionTitle}
Objective: ${missionData.objective}
Environment: ${missionData.environment || 'outdoors'}
Criteria to observe: ${(missionData.observationCriteria || []).join(', ')}
${missionData.customNotes ? `Explorer notes: "${missionData.customNotes}"` : ''}

Generate a structured naturalist observation guide with diagnostic cues for each criterion.`;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20000);

        const res = await fetch(`${activeEndpoint}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: activeModel,
            system: systemPrompt,
            prompt: userPrompt,
            stream: false,
            options: { temperature: 0.3 }
          }),
          signal: controller.signal
        });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json() as { response?: string };
          if (data?.response && data.response.trim().length > 20) {
            return {
              scaffold: data.response.trim(),
              provider: 'ollama',
              model: activeModel
            };
          }
        }
      } catch (err) {
        console.warn('[FieldQuest AI] Ollama scaffold generation error, falling back to curated scaffold:', err);
      }
    }

    // High quality deterministic naturalist fallback scaffold:
    const criteriaItems = (missionData.observationCriteria || []).map(c => `• ${c}: `).join('\n');
    const fallbackScaffold = `[Field Observation Guide • ${missionData.missionTitle}]\n${criteriaItems}\n• Micro-habitat & Setting: \n• Key Diagnostic Features: \n• Naturalist Reflection: `;

    return {
      scaffold: fallbackScaffold,
      provider: 'demo',
      model: 'curated-naturalist-engine-v1'
    };
  }
}

export const missionGeneratorService = new MissionGeneratorService();
