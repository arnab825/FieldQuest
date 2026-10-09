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
