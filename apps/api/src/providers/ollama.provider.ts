import { AIMissionProvider, ProviderAvailability } from './mission-provider.interface.js';
import { AdventurePreferences } from '../schemas/adventure.schema.js';
import { NatureMission, NatureMissionSchema } from '../schemas/mission.schema.js';
import { buildSystemPrompt, buildUserPrompt } from '../prompts/nature-mission.prompts.js';
import { z } from 'zod';

export class AIProviderError extends Error {
  constructor(public code: string, message: string, public details?: any) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export class OllamaMissionProvider implements AIMissionProvider {
  readonly providerId = 'ollama' as const;
  public baseUrl: string;
  public modelId: string;
  public timeoutMs: number;

  constructor(
    baseUrl: string = 'http://localhost:11434',
    modelId: string = 'qwen2.5:3b',
    timeoutMs: number = 45000
  ) {
    this.baseUrl = baseUrl;
    this.modelId = modelId;
    this.timeoutMs = timeoutMs;
  }

  async checkAvailability(requestedModel?: string, customEndpoint?: string): Promise<ProviderAvailability> {
    const targetEndpoint = customEndpoint || this.baseUrl;
    const targetModel = (requestedModel && requestedModel.trim()) || this.modelId;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${targetEndpoint}/api/tags`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timer);

      if (!res.ok) {
        return {
          available: false,
          status: 'unavailable',
          provider: 'ollama',
          model: targetModel,
          endpoint: targetEndpoint,
          message: `Ollama returned HTTP ${res.status}`,
          error: `HTTP ${res.status}`
        };
      }

      const data = await res.json() as { models?: Array<{ name: string }> };
      const models = data.models || [];
      const installedNames = models.map(m => m.name);

      // 1. Check if target model matches installed model (exact or prefix, e.g. "qwen2.5:3b" matches "qwen2.5:3b:latest" or "qwen2.5:3b")
      const matched = models.find(m =>
        m.name === targetModel ||
        m.name.startsWith(targetModel.split(':')[0]) ||
        targetModel.startsWith(m.name.split(':')[0])
      );

      if (matched) {
        this.modelId = matched.name;
        this.baseUrl = targetEndpoint;
        return {
          available: true,
          status: 'available',
          provider: 'ollama',
          model: matched.name,
          endpoint: targetEndpoint,
          installedModels: installedNames,
          message: `Ollama is ready and synchronized with model "${matched.name}".`
        };
      }

      // 2. If the user has any installed models in Ollama, automatically sync to the first installed model!
      if (models.length > 0) {
        const autoSyncedModel = models[0].name;
        this.modelId = autoSyncedModel;
        this.baseUrl = targetEndpoint;
        return {
          available: true,
          status: 'available',
          provider: 'ollama',
          model: autoSyncedModel,
          endpoint: targetEndpoint,
          installedModels: installedNames,
          message: `Ollama is ready! Synchronized with installed model "${autoSyncedModel}".`
        };
      }

      return {
        available: true,
        status: 'available',
        provider: 'ollama',
        model: targetModel,
        endpoint: targetEndpoint,
        installedModels: [],
        message: `Ollama is reachable, but model "${targetModel}" may need to be pulled (run "ollama pull ${targetModel}").`
      };
    } catch (err: any) {
      return {
        available: false,
        status: 'unavailable',
        provider: 'ollama',
        model: targetModel,
        endpoint: targetEndpoint,
        message: `Local Ollama is unreachable at ${targetEndpoint}. Switch to Demo Mode or launch Ollama.`,
        error: err.message || 'Connection failed'
      };
    }
  }

  async generateMissions(
    preferences: AdventurePreferences,
    overrideModel?: string,
    overrideEndpoint?: string
  ): Promise<NatureMission[]> {
    const activeModel = overrideModel || this.modelId;
    const activeEndpoint = overrideEndpoint || this.baseUrl;

    const systemPrompt = buildSystemPrompt(preferences);
    const userPrompt = buildUserPrompt(preferences);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let rawResponseText = '';
    try {
      const response = await fetch(`${activeEndpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: activeModel,
          system: systemPrompt,
          prompt: userPrompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.5,
            top_p: 0.9,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new AIProviderError(
          'AI_PROVIDER_ERROR',
          `Ollama returned HTTP error ${response.status}`,
          errorText
        );
      }

      const jsonPayload = await response.json() as { response?: string };
      rawResponseText = jsonPayload.response || '';
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new AIProviderError(
          'AI_GENERATION_TIMEOUT',
          `Model inference exceeded ${this.timeoutMs / 1000}s timeout. Try a shorter duration or switch to demo mode.`,
          err.message
        );
      }
      if (err instanceof AIProviderError) throw err;
      throw new AIProviderError(
        'AI_PROVIDER_UNAVAILABLE',
        `Unable to communicate with Ollama at ${this.baseUrl}: ${err.message}`,
        err
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!rawResponseText.trim()) {
      throw new AIProviderError(
        'AI_EMPTY_RESPONSE',
        'Model returned an empty response.'
      );
    }

    // Parse and sanitize JSON output
    let parsed: any;
    try {
      // If the model wrapped the JSON in markdown code fences despite instructions, strip them
      let cleaned = rawResponseText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
      }
      parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed) && parsed.missions && Array.isArray(parsed.missions)) {
        parsed = parsed.missions;
      }
    } catch (parseError: any) {
      throw new AIProviderError(
        'AI_MALFORMED_OUTPUT',
        'Model output could not be parsed as JSON',
        { rawOutput: rawResponseText, parseError: parseError.message }
      );
    }

    // Validate using Zod schema
    const validationResult = z.array(NatureMissionSchema).safeParse(parsed);
    if (!validationResult.success) {
      throw new AIProviderError(
        'AI_SCHEMA_VALIDATION_FAILED',
        'Model response did not meet required NatureMission structure',
        validationResult.error.format()
      );
    }

    // Ensure missions have IDs and pending status
    return validationResult.data.map((m, idx) => ({
      ...m,
      id: m.id || `mission-${Date.now()}-${idx + 1}`,
      status: 'pending' as const,
    }));
  }
}
