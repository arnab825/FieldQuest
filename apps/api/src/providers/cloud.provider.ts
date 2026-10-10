import { AIMissionProvider, ProviderAvailability } from './mission-provider.interface.js';
import { AdventurePreferences } from '../schemas/adventure.schema.js';
import { NatureMission, NatureMissionSchema } from '../schemas/mission.schema.js';
import { buildSystemPrompt, buildUserPrompt } from '../prompts/nature-mission.prompts.js';
import { AIProviderError } from './ollama.provider.js';

export interface CloudProviderOptions {
  service?: 'gemini' | 'groq';
  apiKey?: string;
  model?: string;
  models?: string[];
  timeoutMs?: number;
}

function resolveModelList(configuredModels: string[], requestedModel?: string, requestedModels?: string[]): string[] {
  if (requestedModels && requestedModels.length > 0) {
    return requestedModels;
  }
  if (requestedModel) {
    const requested = requestedModel.split(',').map((m) => m.trim()).filter(Boolean);
    const combined = [...requested];
    for (const model of configuredModels) {
      if (!combined.includes(model)) {
        combined.push(model);
      }
    }
    return combined.length > 0 ? combined : configuredModels;
  }
  return configuredModels;
}

export class CloudMissionProvider implements AIMissionProvider {
  readonly providerId = 'cloud' as const;
  public defaultService: 'gemini' | 'groq';
  public geminiApiKey?: string;
  public groqApiKey?: string;
  public geminiModels: string[];
  public groqModels: string[];
  public timeoutMs: number;

  constructor(options?: {
    defaultService?: 'gemini' | 'groq';
    geminiApiKey?: string;
    groqApiKey?: string;
    geminiModel?: string;
    geminiModels?: string[];
    groqModel?: string;
    groqModels?: string[];
    timeoutMs?: number;
  }) {
    this.defaultService = options?.defaultService || 'gemini';
    this.geminiApiKey = options?.geminiApiKey;
    this.groqApiKey = options?.groqApiKey;

    const gModels = options?.geminiModels && options.geminiModels.length > 0
      ? options.geminiModels
      : (options?.geminiModel ? options.geminiModel.split(',').map(m => m.trim()).filter(Boolean) : ['gemini-3.8-flash']);
    this.geminiModels = gModels.length > 0 ? gModels : ['gemini-3.8-flash'];

    const grModels = options?.groqModels && options.groqModels.length > 0
      ? options.groqModels
      : (options?.groqModel ? options.groqModel.split(',').map(m => m.trim()).filter(Boolean) : ['llama-3.3-70b-versatile']);
    this.groqModels = grModels.length > 0 ? grModels : ['llama-3.3-70b-versatile'];

    this.timeoutMs = options?.timeoutMs || 25000;
  }

  get geminiModel(): string {
    return this.geminiModels[0] || 'gemini-3.8-flash';
  }

  set geminiModel(val: string) {
    const list = val.split(',').map(m => m.trim()).filter(Boolean);
    this.geminiModels = list.length > 0 ? list : [val];
  }

  get groqModel(): string {
    return this.groqModels[0] || 'llama-3.3-70b-versatile';
  }

  set groqModel(val: string) {
    const list = val.split(',').map(m => m.trim()).filter(Boolean);
    this.groqModels = list.length > 0 ? list : [val];
  }

  get modelId(): string {
    if (this.geminiApiKey && this.geminiApiKey.trim()) return this.geminiModel;
    if (this.groqApiKey && this.groqApiKey.trim()) return this.groqModel;
    return this.defaultService === 'groq' ? this.groqModel : this.geminiModel;
  }

  /**
   * Ping cloud provider to test API key validity and model readiness
   */
  async checkAvailability(options?: CloudProviderOptions): Promise<ProviderAvailability> {
    const geminiKey = options?.apiKey || this.geminiApiKey;
    const groqKey = options?.apiKey || this.groqApiKey;

    const candidateGeminiModels = resolveModelList(
      this.geminiModels,
      options?.service === 'gemini' ? options?.model : undefined,
      options?.service === 'gemini' ? options?.models : undefined
    );

    const candidateGroqModels = resolveModelList(
      this.groqModels,
      options?.service === 'groq' ? options?.model : undefined,
      options?.service === 'groq' ? options?.models : undefined
    );

    // Check Gemini first if key exists
    if (geminiKey && geminiKey.trim()) {
      for (const model of candidateGeminiModels) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 7000);
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${geminiKey.trim()}`;
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timer);

          if (res.ok) {
            return {
              available: true,
              status: 'available',
              provider: 'cloud',
              cloudService: 'gemini',
              model: model,
              fallbackModels: candidateGeminiModels.filter((m) => m !== model),
              configuredModels: candidateGeminiModels,
              message: `Cloud Naturalist Engine connected via Google Gemini (${model})${candidateGeminiModels.length > 1 ? ` with fallback models: ${candidateGeminiModels.slice(1).join(', ')}` : ''}.`,
            };
          }
        } catch (err) {
          console.warn(`[FieldQuest AI] Gemini ping failed for model '${model}':`, err);
        }
      }
    }

    // Check Groq if key exists
    if (groqKey && groqKey.trim()) {
      for (const model of candidateGroqModels) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 7000);
          const res = await fetch('https://api.groq.com/openai/v1/models', {
            signal: controller.signal,
            headers: {
              'Authorization': `Bearer ${groqKey.trim()}`,
              'Accept': 'application/json',
            },
          });
          clearTimeout(timer);

          if (res.ok) {
            return {
              available: true,
              status: 'available',
              provider: 'cloud',
              cloudService: 'groq',
              model: model,
              fallbackModels: candidateGroqModels.filter((m) => m !== model),
              configuredModels: candidateGroqModels,
              message: `Cloud Naturalist Engine connected via Groq Cloud (${model})${candidateGroqModels.length > 1 ? ` with fallback models: ${candidateGroqModels.slice(1).join(', ')}` : ''}.`,
            };
          }
        } catch (err) {
          console.warn(`[FieldQuest AI] Groq ping failed for model '${model}':`, err);
        }
      }
    }

    return {
      available: false,
      status: 'unavailable',
      provider: 'cloud',
      model: this.modelId,
      fallbackModels: this.geminiModels.slice(1),
      configuredModels: this.geminiModels,
      message: 'No cloud API key active or keys exhausted. Automatic failover to Local AI (Ollama) or curated offline library is active.',
    };
  }

  /**
   * Generate live missions using Google Gemini or Groq Cloud, with multi-cloud and multi-model failover
   */
  async generateMissions(
    preferences: AdventurePreferences,
    options?: CloudProviderOptions
  ): Promise<NatureMission[]> {
    const geminiKey = options?.apiKey || this.geminiApiKey;
    const groqKey = options?.apiKey || this.groqApiKey;

    const systemPrompt = buildSystemPrompt(preferences);
    const userPrompt = buildUserPrompt(preferences);

    const geminiList = resolveModelList(
      this.geminiModels,
      options?.service === 'gemini' ? options?.model : (!options?.service ? options?.model : undefined),
      options?.service === 'gemini' ? options?.models : (!options?.service ? options?.models : undefined)
    );

    const groqList = resolveModelList(
      this.groqModels,
      options?.service === 'groq' ? options?.model : (!options?.service ? options?.model : undefined),
      options?.service === 'groq' ? options?.models : (!options?.service ? options?.models : undefined)
    );

    // 1. Try Gemini if key is provided
    if (geminiKey && geminiKey.trim()) {
      let lastGeminiError: any = null;

      for (const model of geminiList) {
        try {
          const rawOutput = await this.callGemini(geminiKey.trim(), model, systemPrompt, userPrompt);
          return this.parseAndValidateMissions(rawOutput);
        } catch (err: any) {
          lastGeminiError = err;
          console.warn(`[FieldQuest AI] Gemini model '${model}' failed (${err.message}). Trying next fallback model...`);
        }
      }

      console.warn('[FieldQuest AI] All configured Gemini models failed.');

      // If Groq key also exists, try Groq fallback chain before declaring cloud exhausted
      if (groqKey && groqKey.trim()) {
        for (const model of groqList) {
          try {
            console.log(`[FieldQuest AI] Attempting Groq secondary cloud failover with model '${model}'...`);
            const rawOutput = await this.callGroq(groqKey.trim(), model, systemPrompt, userPrompt);
            return this.parseAndValidateMissions(rawOutput);
          } catch (groqErr: any) {
            console.warn(`[FieldQuest AI] Groq model '${model}' call failed (${groqErr.message}). Trying next fallback model...`);
          }
        }
      }
      throw new AIProviderError('CLOUD_EXHAUSTED', `Cloud AI exhausted: ${lastGeminiError?.message || 'All models failed'}`);
    }

    // 2. Try Groq if Gemini key not provided but Groq key is
    if (groqKey && groqKey.trim()) {
      let lastGroqError: any = null;
      for (const model of groqList) {
        try {
          const rawOutput = await this.callGroq(groqKey.trim(), model, systemPrompt, userPrompt);
          return this.parseAndValidateMissions(rawOutput);
        } catch (err: any) {
          lastGroqError = err;
          console.warn(`[FieldQuest AI] Groq model '${model}' call failed (${err.message}). Trying next fallback model...`);
        }
      }
      throw new AIProviderError('CLOUD_EXHAUSTED', `Groq Cloud exhausted: ${lastGroqError?.message || 'All Groq models failed'}`);
    }

    throw new AIProviderError(
      'NO_CLOUD_KEYS',
      'No cloud API key configured on server. Failing over to local AI.'
    );
  }

  /**
   * Scaffold assistance via cloud LLM
   */
  async generateMissionScaffold(
    missionData: {
      missionTitle: string;
      objective: string;
      environment?: string;
      observationCriteria?: string[];
      customNotes?: string;
    },
    options?: CloudProviderOptions
  ): Promise<string> {
    const geminiKey = options?.apiKey || this.geminiApiKey;
    const groqKey = options?.apiKey || this.groqApiKey;

    const prompt = `You are FieldQuest AI, an expert field naturalist. The explorer has made this observation:
Title: "${missionData.missionTitle}"
Objective: "${missionData.objective}"
Environment: "${missionData.environment || 'wild'}"
Observed Criteria: ${missionData.observationCriteria?.join(', ') || 'N/A'}
Notes: "${missionData.customNotes || 'None'}"

Provide 2-3 sentences of inspiring, scientifically grounded field commentary expanding their sensory observation and highlighting ecological connections. Output plain text only.`;

    const geminiList = resolveModelList(
      this.geminiModels,
      options?.service === 'gemini' ? options?.model : (!options?.service ? options?.model : undefined),
      options?.service === 'gemini' ? options?.models : (!options?.service ? options?.models : undefined)
    );

    const groqList = resolveModelList(
      this.groqModels,
      options?.service === 'groq' ? options?.model : (!options?.service ? options?.model : undefined),
      options?.service === 'groq' ? options?.models : (!options?.service ? options?.models : undefined)
    );

    if (geminiKey && geminiKey.trim()) {
      for (const model of geminiList) {
        try {
          return await this.callGemini(geminiKey.trim(), model, 'You are an expert field naturalist.', prompt);
        } catch (err: any) {
          console.warn(`[FieldQuest AI] Scaffold: Gemini model '${model}' failed (${err.message}). Trying next fallback model...`);
        }
      }
    }

    if (groqKey && groqKey.trim()) {
      for (const model of groqList) {
        try {
          return await this.callGroq(groqKey.trim(), model, 'You are an expert field naturalist.', prompt);
        } catch (err: any) {
          console.warn(`[FieldQuest AI] Scaffold: Groq model '${model}' failed (${err.message}). Trying next fallback model...`);
        }
      }
    }

    throw new AIProviderError('NO_CLOUD_KEYS', 'No cloud API key configured on server.');
  }

  private async callGemini(
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = (errJson as any)?.error?.message || `HTTP ${res.status}`;
        throw new AIProviderError('GEMINI_API_ERROR', `Google Gemini error: ${msg}`, errJson);
      }

      const data = await res.json() as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new AIProviderError('GEMINI_EMPTY_RESPONSE', 'Google Gemini returned an empty response.');
      }
      return text;
    } catch (err: any) {
      clearTimeout(timer);
      if (err instanceof AIProviderError) throw err;
      throw new AIProviderError('GEMINI_NETWORK_ERROR', `Failed to connect to Google Gemini: ${err.message}`);
    }
  }

  private async callGroq(
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = (errJson as any)?.error?.message || `HTTP ${res.status}`;
        throw new AIProviderError('GROQ_API_ERROR', `Groq Cloud error: ${msg}`, errJson);
      }

      const data = await res.json() as any;
      const text = data?.choices?.[0]?.message?.content;
      if (!text) {
        throw new AIProviderError('GROQ_EMPTY_RESPONSE', 'Groq returned an empty response.');
      }
      return text;
    } catch (err: any) {
      clearTimeout(timer);
      if (err instanceof AIProviderError) throw err;
      throw new AIProviderError('GROQ_NETWORK_ERROR', `Failed to connect to Groq: ${err.message}`);
    }
  }

  private parseAndValidateMissions(rawOutput: string): NatureMission[] {
    let cleanJson = rawOutput.trim();

    // Strip markdown code fences if present
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseErr: any) {
      const arrayMatch = cleanJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        try {
          parsed = JSON.parse(arrayMatch[0]);
        } catch {
          throw new AIProviderError('MALFORMED_JSON', 'Cloud AI did not return a parseable JSON array.');
        }
      } else {
        throw new AIProviderError('MALFORMED_JSON', 'Cloud AI response could not be parsed as JSON.');
      }
    }

    if (!Array.isArray(parsed) && Array.isArray(parsed?.missions)) {
      parsed = parsed.missions;
    }

    if (!Array.isArray(parsed)) {
      throw new AIProviderError('INVALID_SCHEMA', 'Cloud AI response is not an array of missions.');
    }

    const validatedMissions: NatureMission[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      const result = NatureMissionSchema.safeParse({
        ...item,
        id: item.id || `cloud-m-${Date.now()}-${i + 1}`,
        status: 'pending',
      });

      if (result.success) {
        validatedMissions.push(result.data);
      } else {
        validatedMissions.push({
          id: item.id || `cloud-m-${Date.now()}-${i + 1}`,
          title: item.title || 'Field Observation Activity',
          objective: item.objective || 'Observe and examine natural features in this setting.',
          instructions: Array.isArray(item.instructions) && item.instructions.length >= 2
            ? item.instructions
            : ['Find a quiet spot to observe.', 'Note details of color, texture, and pattern.', 'Record what you discovered.'],
          estimatedMinutes: typeof item.estimatedMinutes === 'number' ? item.estimatedMinutes : 10,
          observationCriteria: Array.isArray(item.observationCriteria) && item.observationCriteria.length > 0
            ? item.observationCriteria
            : ['Shape and color', 'Surface pattern'],
          completionCriteria: item.completionCriteria || 'Complete sensory observations and record your reflections.',
          safetyGuidance: item.safetyGuidance || 'Observe quietly and respect wildlife. Never consume wild plants.',
          reflectionQuestion: item.reflectionQuestion || 'What unexpected detail did you notice during this study?',
          status: 'pending',
        });
      }
    }

    if (validatedMissions.length === 0) {
      throw new AIProviderError('NO_VALID_MISSIONS', 'Cloud AI did not produce valid structured missions.');
    }

    return validatedMissions;
  }
}
