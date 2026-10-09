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

  constructor(
    private readonly baseUrl: string = 'http://localhost:11434',
    readonly modelId: string = 'qwen3:4b',
    private readonly timeoutMs: number = 45000
  ) {}

  async checkAvailability(): Promise<ProviderAvailability> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timer);

      if (!res.ok) {
        return {
          available: false,
          status: 'unavailable',
          provider: 'ollama',
          model: this.modelId,
          endpoint: this.baseUrl,
          message: `Ollama returned HTTP ${res.status}`,
          error: `HTTP ${res.status}`
        };
      }

      const data = await res.json() as { models?: Array<{ name: string }> };
      const models = data.models || [];
      const hasConfiguredModel = models.some(m => m.name === this.modelId || m.name.startsWith(this.modelId.split(':')[0]));

      return {
        available: true,
        status: 'available',
        provider: 'ollama',
        model: this.modelId,
        endpoint: this.baseUrl,
        message: hasConfiguredModel
          ? `Ollama is ready with model ${this.modelId}`
          : `Ollama is reachable, but model "${this.modelId}" may need to be pulled (run "ollama pull ${this.modelId}").`
      };
    } catch (err: any) {
      return {
        available: false,
        status: 'unavailable',
        provider: 'ollama',
        model: this.modelId,
        endpoint: this.baseUrl,
        message: `Local Ollama is unreachable at ${this.baseUrl}. Switch to Demo Mode or launch Ollama.`,
        error: err.message || 'Connection failed'
      };
    }
  }

  async generateMissions(preferences: AdventurePreferences): Promise<NatureMission[]> {
    const systemPrompt = buildSystemPrompt(preferences);
    const userPrompt = buildUserPrompt(preferences);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let rawResponseText = '';
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.modelId,
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
