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

  async generateMissionScaffold(
    missionData: {
      missionTitle: string;
      objective: string;
      observationCriteria: string[];
      environment?: string;
      customNotes?: string;
    },
    forcedMode?: 'ollama' | 'demo',
    model?: string,
    endpoint?: string
  ): Promise<{ scaffold: string; provider: string; model: string }> {
    const provider = this.getProvider(forcedMode);

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
