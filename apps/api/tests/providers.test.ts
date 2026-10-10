import { describe, it, expect } from 'vitest';
import { DemoMissionProvider } from '../src/providers/demo.provider.js';
import { AdventurePreferences } from '../src/schemas/adventure.schema.js';

describe('DemoMissionProvider', () => {
  const provider = new DemoMissionProvider();

  it('reports availability as true with model ID', async () => {
    const status = await provider.checkAvailability();
    expect(status.available).toBe(true);
    expect(status.provider).toBe('demo');
    expect(status.model).toBeDefined();
  });

  it('generates missions in English matching duration and environment', async () => {
    const prefs: AdventurePreferences = {
      durationMinutes: 15,
      environment: 'park',
      interests: ['plants', 'birds'],
      difficulty: 'easy',
      language: 'en',
      accessibleMobility: false,
    };

    const missions = await provider.generateMissions(prefs);
    expect(missions.length).toBeGreaterThanOrEqual(3);
    for (const mission of missions) {
      expect(mission.id).toBeDefined();
      expect(mission.title.length).toBeGreaterThan(3);
      expect(mission.safetyGuidance.length).toBeGreaterThan(5);
      expect(mission.reflectionQuestion.length).toBeGreaterThan(5);
      expect(mission.instructions.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('generates missions for urban environment with crack survey', async () => {
    const prefs: AdventurePreferences = {
      durationMinutes: 30,
      environment: 'urban',
      interests: ['patterns'],
      difficulty: 'easy',
      language: 'en',
      accessibleMobility: false,
    };

    const missions = await provider.generateMissions(prefs);
    expect(missions.length).toBeGreaterThanOrEqual(3);
    expect(missions[0].title).toBeDefined();
    expect(missions[0].instructions.length).toBeGreaterThanOrEqual(2);
  });
});

describe('CloudMissionProvider & Fallback', () => {
  it('reports status and friendly message when no API key is set', async () => {
    const { CloudMissionProvider } = await import('../src/providers/cloud.provider.js');
    const cloud = new CloudMissionProvider();
    const status = await cloud.checkAvailability();
    expect(status.provider).toBe('cloud');
    expect(status.available).toBe(false);
    expect(status.message).toContain('API key');
  });

  it('missionGeneratorService falls back to demo missions seamlessly when in cloud mode without keys', async () => {
    const { MissionGeneratorService } = await import('../src/services/mission-generator.service.js');
    const service = new MissionGeneratorService();
    const anyService = service as any;
    anyService.cloudProvider.geminiApiKey = undefined;
    anyService.cloudProvider.groqApiKey = undefined;
    anyService.ollamaProvider.checkAvailability = async () => ({
      available: false,
      status: 'unavailable',
      provider: 'ollama',
      model: 'qwen2.5:3b',
      message: 'Ollama offline for test',
    });
    const prefs: AdventurePreferences = {
      durationMinutes: 15,
      environment: 'park',
      interests: ['plants'],
      difficulty: 'easy',
      language: 'en',
      accessibleMobility: false,
    };

    const result = await service.generateAdventureMissions(prefs, 'cloud');
    expect(result.sessionId).toBeDefined();
    expect(result.missions.length).toBeGreaterThanOrEqual(3);
    expect(result.missions[0].title).toBeDefined();
  }, 15000);

  it('supports multiple fallback models configured in options', async () => {
    const { CloudMissionProvider } = await import('../src/providers/cloud.provider.js');
    const cloud = new CloudMissionProvider({
      geminiModels: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
      groqModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    });

    expect(cloud.geminiModels).toEqual(['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']);
    expect(cloud.geminiModel).toBe('gemini-2.0-flash');
    expect(cloud.groqModels).toEqual(['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']);
    expect(cloud.groqModel).toBe('llama-3.3-70b-versatile');

    // Setting single model with comma-separation parses into array
    cloud.geminiModel = 'gemini-pro, gemini-1.5-flash';
    expect(cloud.geminiModels).toEqual(['gemini-pro', 'gemini-1.5-flash']);
    expect(cloud.geminiModel).toBe('gemini-pro');
  });

  it('attempts fallback models sequentially when earlier model fails', async () => {
    const { CloudMissionProvider } = await import('../src/providers/cloud.provider.js');
    const cloud = new CloudMissionProvider({
      geminiApiKey: 'test-key',
      geminiModels: ['failing-model', 'working-model'],
    });

    const attemptedModels: string[] = [];
    (cloud as any).callGemini = async (_key: string, model: string) => {
      attemptedModels.push(model);
      if (model === 'failing-model') {
        throw new Error('Model rate limited or not found');
      }
      return JSON.stringify({
        missions: [
          {
            id: 'm1',
            title: 'Bark Texture Investigation',
            objective: 'Observe bark patterns',
            safetyGuidance: 'Do not damage the tree bark',
            reflectionQuestion: 'How does it feel?',
            instructions: ['Step 1', 'Step 2'],
            estimatedMinutes: 10,
          },
          {
            id: 'm2',
            title: 'Canopy Density Audit',
            objective: 'Observe the canopy',
            safetyGuidance: 'Watch your step while looking up',
            reflectionQuestion: 'How much light comes through?',
            instructions: ['Step 1', 'Step 2'],
            estimatedMinutes: 10,
          },
          {
            id: 'm3',
            title: 'Leaf Litter Discovery',
            objective: 'Inspect fallen leaves',
            safetyGuidance: 'Watch for insects',
            reflectionQuestion: 'What decomposers do you notice?',
            instructions: ['Step 1', 'Step 2'],
            estimatedMinutes: 10,
          },
        ],
      });
    };

    const prefs: AdventurePreferences = {
      durationMinutes: 15,
      environment: 'park',
      interests: ['plants'],
      difficulty: 'easy',
      language: 'en',
      accessibleMobility: false,
    };

    const result = await cloud.generateMissions(prefs);
    expect(attemptedModels).toEqual(['failing-model', 'working-model']);
    expect(result.length).toBe(3);
    expect(result[0].title).toBe('Bark Texture Investigation');
  });
});

