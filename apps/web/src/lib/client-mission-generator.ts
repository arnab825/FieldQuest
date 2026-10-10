import { AdventurePreferences, NatureMission } from '../types/index.js';
import { GenerateMissionsResult } from '../services/api.js';

interface MissionTemplate {
  title: string;
  objective: string;
  instructions: string[];
  criteria: string[];
  completion: string;
  safety: string;
  reflection: string;
  applicableEnvironments: string[];
  applicableInterests: string[];
}

const BOTANICAL_TEMPLATES: MissionTemplate[] = [
  {
    title: 'Bilateral Leaf Symmetry Audit',
    objective: 'Compare vein architecture and margins between two distinct living plant leaves.',
    instructions: [
      'Find two healthy plants without plucking any leaves.',
      'Gently observe the central midrib and lateral branching veins.',
      'Note whether the margins are smooth (entire), serrated, or lobed.'
    ],
    criteria: ['Vein branching pattern', 'Leaf margin smoothness', 'Surface waxiness'],
    completion: 'Identify and mentally contrast two distinct leaf venation styles.',
    safety: 'Do not touch stinging plants (e.g. nettles) or ingest wild foliage.',
    reflection: 'How does this leaf structure help the plant capture sunlight and shed heavy rain?',
    applicableEnvironments: ['park', 'garden', 'urban', 'trail', 'balcony'],
    applicableInterests: ['plants', 'trees', 'patterns', 'biodiversity']
  },
  {
    title: 'Acoustic Canopy Sound Mapping',
    objective: 'Close your eyes for 90 seconds and isolate three distinct natural sounds from artificial noise.',
    instructions: [
      'Pause in a safe spot, lower your screen, and close your eyes.',
      'Identify the farthest natural sound you can detect (e.g. wind in distant canopy).',
      'Identify the closest sound (e.g. insect rustle or a nearby bird call).'
    ],
    criteria: ['High pitch vs low pitch bird calls', 'Wind rustle through foliage', 'Rhythmic insect chirps'],
    completion: 'Distinctly isolate and log three separate sound layers.',
    safety: 'Remain stationary while eyes are closed to avoid tripping on uneven ground.',
    reflection: 'Which sound carried the farthest distance, and what living creature made it?',
    applicableEnvironments: ['park', 'garden', 'urban', 'trail', 'balcony'],
    applicableInterests: ['sounds', 'birds', 'insects']
  },
  {
    title: 'Bark Micro-Terrain & Lichen Census',
    objective: 'Inspect the north and south facing trunk of a mature tree for lichens, moss, or fissures.',
    instructions: [
      'Approach a mature tree without peeling or damaging any bark.',
      'Notice whether one side of the trunk has more moisture-loving green growth.',
      'Observe the texture: is it deeply furrowed, papery, or plated?'
    ],
    criteria: ['Crustose or foliose lichen patches', 'Deep vertical ridges', 'Micro-habitat crevice sheltering insects'],
    completion: 'Observe difference in surface moisture or texture between opposite sides of the trunk.',
    safety: 'Do not disturb insect nests or strip protective bark layers from the tree.',
    reflection: 'Why might moisture-loving organisms prefer one specific side of the tree trunk?',
    applicableEnvironments: ['park', 'garden', 'urban', 'trail'],
    applicableInterests: ['trees', 'plants', 'biodiversity', 'patterns']
  },
  {
    title: 'Invertebrate Micro-Corridor Scout',
    objective: 'Observe a 30cm square patch of soil, leaf litter, or stone edge for small animal motion.',
    instructions: [
      'Crouch quietly beside a boundary between soil and pavement or stone.',
      'Remain completely motionless for two minutes to let small creatures resume movement.',
      'Observe any ants, beetles, spiders, or pollinators navigating the terrain.'
    ],
    criteria: ['Direction of travel', 'Interaction with fallen leaves or twigs', 'Speed of locomotion'],
    completion: 'Track one specific invertebrate journey across at least 15 centimeters.',
    safety: 'Do not handle venomous insects, spiders, or reach blindly under rotting logs.',
    reflection: 'What landscape barriers (pavement, dryness, height) did the creature navigate around?',
    applicableEnvironments: ['park', 'garden', 'urban', 'trail', 'balcony'],
    applicableInterests: ['insects', 'biodiversity']
  },
  {
    title: 'Solar Angle & Ephemeral Shadow Study',
    objective: 'Track how dappled sunlight penetrates the canopy and creates micro-climates on the ground.',
    instructions: [
      'Locate an area where sunlight filters through branch structures to the ground.',
      'Notice the temperature difference between shaded ground and sunlit ground using the back of your hand.',
      'Observe whether plant growth is denser in the filtered light or full shade.'
    ],
    criteria: ['Leaf canopy density', 'Micro-climate ground temperature shift', 'Phototropic leaf orientation'],
    completion: 'Feel and identify a distinct micro-climate temperature difference on the surface.',
    safety: 'Do not stare directly into the sun through branches.',
    reflection: 'How do living understory plants adapt to changing angles of filtered sunlight throughout the day?',
    applicableEnvironments: ['park', 'garden', 'trail'],
    applicableInterests: ['patterns', 'plants', 'trees']
  },
  {
    title: 'Seed Dispersal Mechanism Observation',
    objective: 'Locate and examine one seed, pod, or fruit to identify how it travels through space.',
    instructions: [
      'Search low shrubs, trees, or ground vegetation for seeds or seed pods.',
      'Examine its aerodynamic or tactile features (wings, parachutes, hooks, or fleshy fruit).',
      'Determine whether it travels by wind (anemochory), animals (zoochory), or gravity.'
    ],
    criteria: ['Wind-borne plumes or wings', 'Velcro-like hooks or barbs', 'Protective pod casing'],
    completion: 'Identify the primary dispersal vector for one wild plant species.',
    safety: 'Never taste, bite, or consume any wild seeds or berries.',
    reflection: 'How does the shape of this seed ensure the survival of the next botanical generation?',
    applicableEnvironments: ['park', 'garden', 'trail', 'urban'],
    applicableInterests: ['plants', 'trees', 'biodiversity']
  }
];

export async function generateClientMissions(
  preferences: AdventurePreferences
): Promise<GenerateMissionsResult> {
  // 1. Check if Chrome Built-in AI (window.ai) is available on-device
  if (typeof window !== 'undefined' && (window as any).ai?.languageModel) {
    try {
      const ai = (window as any).ai.languageModel;
      const capabilities = await ai.capabilities?.();
      if (capabilities?.available !== 'no') {
        const session = await ai.create({
          systemPrompt: 'You are FieldQuest, a Victorian scientific field naturalist AI. Output JSON only with an array of sensory outdoor observation missions.'
        });
        const prompt = `Generate ${Math.min(preferences.durationMinutes <= 20 ? 3 : 5, 5)} sensory nature observation quests for an explorer in a ${preferences.environment} environment interested in ${preferences.interests.join(', ')}. Return pure JSON matching: [{"title":"","objective":"","instructions":[""],"observationCriteria":[""],"completionCriteria":"","safetyNotice":"","reflectionPrompt":""}]`;
        const rawOutput = await session.prompt(prompt);
        session.destroy?.();

        const jsonMatch = rawOutput.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const missions: NatureMission[] = parsed.map((m: any, i: number) => ({
            id: `mission-ondevice-${Date.now()}-${i}`,
            title: m.title || `Field Observation ${i + 1}`,
            objective: m.objective || 'Examine local biodiversity specimens carefully.',
            instructions: Array.isArray(m.instructions) ? m.instructions : ['Approach specimen quietly.', 'Observe details.'],
            estimatedMinutes: Math.max(5, Math.floor(preferences.durationMinutes / parsed.length)),
            observationCriteria: Array.isArray(m.observationCriteria) ? m.observationCriteria : ['Botanical Morphology'],
            completionCriteria: m.completionCriteria || 'Record specimen in journal.',
            safetyGuidance: m.safetyGuidance || m.safetyNotice || 'Stay on designated trails and avoid touching poisonous plants.',
            reflectionQuestion: m.reflectionQuestion || m.reflectionPrompt || 'What sensory patterns did you notice?',
            status: i === 0 ? 'active' : 'pending',
          }));

          return {
            sessionId: `session-nano-${Date.now()}`,
            provider: 'cloud',
            model: 'chrome-gemini-nano (on-device)',
            generatedAt: new Date().toISOString(),
            preferences,
            missions,
          };
        }
      }
    } catch {
      // Fall through to deterministic curated catalog
    }
  }

  // 2. Deterministic Curated Naturalist Botanical Engine (100% Offline, Zero-Fail)
  const targetCount = preferences.durationMinutes <= 15 ? 3 : preferences.durationMinutes <= 30 ? 4 : 5;
  const filtered = BOTANICAL_TEMPLATES.filter(t => {
    const envMatch = t.applicableEnvironments.includes(preferences.environment);
    const interestMatch = t.applicableInterests.some(i => preferences.interests.includes(i as any));
    return envMatch || interestMatch;
  });

  const pool = filtered.length >= targetCount ? filtered : BOTANICAL_TEMPLATES;
  // Deterministic rotation based on current minute and environment
  const seed = preferences.durationMinutes + preferences.interests.length;
  const selected: MissionTemplate[] = [];

  for (let i = 0; i < targetCount; i++) {
    const template = pool[(seed + i) % pool.length];
    if (!selected.includes(template)) {
      selected.push(template);
    } else {
      selected.push(BOTANICAL_TEMPLATES[(seed + i + 2) % BOTANICAL_TEMPLATES.length]);
    }
  }

  const missions: NatureMission[] = selected.map((t, index) => ({
    id: `mission-curated-${Date.now()}-${index}`,
    title: t.title,
    objective: t.objective,
    instructions: t.instructions,
    estimatedMinutes: Math.max(5, Math.floor(preferences.durationMinutes / selected.length)),
    observationCriteria: t.criteria,
    completionCriteria: t.completion,
    safetyGuidance: t.safety,
    reflectionQuestion: t.reflection,
    status: index === 0 ? 'active' : 'pending',
  }));

  return {
    sessionId: `session-curated-${Date.now()}`,
    provider: 'demo',
    model: 'curated-naturalist-engine',
    generatedAt: new Date().toISOString(),
    preferences,
    missions,
  };
}
