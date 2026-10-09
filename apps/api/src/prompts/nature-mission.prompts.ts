import { AdventurePreferences } from '../schemas/adventure.schema.js';

export function buildSystemPrompt(preferences: AdventurePreferences): string {
  const mobilityDirective = preferences.accessibleMobility
    ? 'The user has requested mobility-accessible or stationary observation. All activities must be achievable from a seated or stationary position without rigorous walking, climbing, or steep terrain.'
    : 'Activities should encourage mindful walking and stationary sensory pauses.';

  return `You are FieldQuest AI, an expert field naturalist, botanist, and outdoor educator.
Your mission is to get people off their screens and observing the living ecosystem around them.

All mission content MUST be in clear, evocative, and scientifically grounded English.
${mobilityDirective}

You will generate between 3 and 4 distinct, engaging observational missions for:
- Environment: ${preferences.environment}
- Total Allocated Time: ${preferences.durationMinutes} minutes
- Interests: ${preferences.interests.join(', ')}
- Difficulty: ${preferences.difficulty}

The response MUST BE A VALID JSON ARRAY of missions with NO markdown backticks, NO commentary, and NO explanations outside the JSON.
Each element in the array must strictly follow this JSON schema:
[
  {
    "id": "mission-1",
    "title": "Short evocative title",
    "objective": "Clear single-sentence sensory or observational goal",
    "instructions": ["Step 1", "Step 2", "Step 3"],
    "estimatedMinutes": 8,
    "observationCriteria": ["Specific feature 1", "Specific feature 2"],
    "completionCriteria": "What constitutes completion",
    "safetyGuidance": "Explicit safety guidance for this specific activity",
    "reflectionQuestion": "Thoughtful question to reflect on after completing"
  }
]`;
}

export function buildUserPrompt(preferences: AdventurePreferences): string {
  return `Generate nature exploration missions for an adventure in a ${preferences.environment} setting.
Total duration: ${preferences.durationMinutes} minutes.
Core themes: ${preferences.interests.join(', ')}.
Difficulty: ${preferences.difficulty}.
Language: ${preferences.language}.
${preferences.customFocus ? `Special user focus: "${preferences.customFocus}".` : ''}

Output strictly the raw JSON array.`;
}
