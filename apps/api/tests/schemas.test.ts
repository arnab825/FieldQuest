import { describe, it, expect } from 'vitest';
import { AdventurePreferencesSchema } from '../src/schemas/adventure.schema.js';
import { NatureMissionSchema } from '../src/schemas/mission.schema.js';

describe('AdventurePreferencesSchema', () => {
  it('accepts valid exploration preferences', () => {
    const valid = {
      durationMinutes: 30,
      environment: 'park',
      interests: ['plants', 'birds'],
      difficulty: 'easy',
      language: 'en',
      accessibleMobility: false,
    };
    const res = AdventurePreferencesSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects invalid duration', () => {
    const invalid = {
      durationMinutes: 45, // only 15, 30, 60 allowed
      environment: 'park',
      interests: ['plants'],
      difficulty: 'easy',
    };
    const res = AdventurePreferencesSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('rejects empty interests array', () => {
    const invalid = {
      durationMinutes: 15,
      environment: 'garden',
      interests: [],
      difficulty: 'easy',
    };
    const res = AdventurePreferencesSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });
});

describe('NatureMissionSchema', () => {
  it('validates a complete and safe nature mission', () => {
    const mission = {
      id: 'm-test-1',
      title: 'Bark Texture Survey',
      objective: 'Inspect two trees for vertical bark furrow patterns.',
      instructions: [
        'Approach two mature trees.',
        'Compare furrow depth without stripping any bark.',
      ],
      estimatedMinutes: 10,
      observationCriteria: ['Furrow depth', 'Lichen coloration'],
      completionCriteria: 'Observe two distinct bark textures.',
      safetyGuidance: 'Do not pull protective bark from trees or disturb wasp nests.',
      reflectionQuestion: 'Why does bark thicken as a tree ages?',
      status: 'pending',
    };
    const res = NatureMissionSchema.safeParse(mission);
    expect(res.success).toBe(true);
  });

  it('rejects mission missing critical safety guidance', () => {
    const invalid = {
      id: 'm-test-2',
      title: 'Leaf Audit',
      objective: 'Look at leaves.',
      instructions: ['Look at leaves', 'Count them'],
      estimatedMinutes: 5,
      observationCriteria: ['Leaves'],
      completionCriteria: 'Done',
      // Missing safetyGuidance and reflectionQuestion
    };
    const res = NatureMissionSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });
});
