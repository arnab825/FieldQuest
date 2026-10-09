import { AIMissionProvider, ProviderAvailability } from './mission-provider.interface.js';
import { AdventurePreferences } from '../schemas/adventure.schema.js';
import { NatureMission } from '../schemas/mission.schema.js';

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

const TEMPLATES: MissionTemplate[] = [
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
    applicableInterests: ['trees', 'plants', 'patterns', 'biodiversity']
  },
  {
    title: 'Urban Micro-Habitat Crack Survey',
    objective: 'Identify spontaneous pioneer flora thriving in a sidewalk seam or masonry crevice.',
    instructions: [
      'Look down at a paved pathway seam or wall base.',
      'Spot small plants that manage to root in minimal mineral soil.',
      'Notice how the plant anchors itself against footsteps or urban disturbance.'
    ],
    criteria: ['Rosette growth form', 'Tenacious root anchoring', 'Fine dust collection'],
    completion: 'Discover at least one spontaneous wild plant living in a human-built crevice.',
    safety: 'Remain aware of pedestrians, cyclists, and vehicle traffic while observing.',
    reflection: 'What adaptations allow pioneer plants to colonize hostile concrete environments?',
    applicableEnvironments: ['urban', 'balcony', 'park'],
    applicableInterests: ['plants', 'patterns', 'biodiversity']
  },
  {
    title: 'Avian Flight Path & Perch Trajectory',
    objective: 'Track the flight style and landing perches of local urban or wild birds.',
    instructions: [
      'Find an open view towards branches, power lines, or roof eaves.',
      'Notice the wingbeat pattern: continuous flapping, swooping undulations, or gliding?',
      'Check whether the bird chooses a high vantage point for surveillance or foliage for concealment.'
    ],
    criteria: ['Flight rhythm (undulating vs direct)', 'Perching elevation', 'Head scanning movement'],
    completion: 'Watch at least one bird transition from flight to a stationary landing.',
    safety: 'Never approach nesting sites, hatchlings, or attempt to bait birds with artificial food.',
    reflection: 'How does perching height correlate with this bird species\' foraging or safety strategy?',
    applicableEnvironments: ['park', 'garden', 'urban', 'trail', 'balcony'],
    applicableInterests: ['birds', 'biodiversity']
  },
  {
    title: 'Balcony Wind & Micro-Climate Sensation',
    objective: 'Observe how wind direction and sun exposure dictate moisture retention in container soil.',
    instructions: [
      'Stand still on your balcony or porch for 2 minutes.',
      'Observe which way the leaves of potted plants or nearby branches sway.',
      'Gently touch the top half-inch of soil surface in different corners to sense moisture gradients.'
    ],
    criteria: ['Wind direction and eddy patterns', 'Surface soil dry-crust vs damp soil', 'Leaf transpiration cooling'],
    completion: 'Map out the sunniest/windiest micro-pocket in your outdoor space.',
    safety: 'Never lean out over balcony railings or place unfastened heavy pots on ledges.',
    reflection: 'How do urban microclimates created by walls and buildings alter plant growth?',
    applicableEnvironments: ['balcony', 'urban', 'garden'],
    applicableInterests: ['plants', 'sounds', 'biodiversity']
  }
];

export class DemoMissionProvider implements AIMissionProvider {
  readonly providerId = 'demo' as const;
  readonly modelId = 'curated-naturalist-engine-v1';

  async checkAvailability(): Promise<ProviderAvailability> {
    return {
      available: true,
      status: 'available',
      provider: 'demo',
      model: this.modelId,
      message: 'Demo mode is active with verified deterministic nature exploration missions.'
    };
  }

  async generateMissions(preferences: AdventurePreferences): Promise<NatureMission[]> {
    // Filter templates matching either environment or interest
    let matched = TEMPLATES.filter(t => 
      t.applicableEnvironments.includes(preferences.environment) ||
      t.applicableInterests.some(i => preferences.interests.includes(i as any))
    );

    if (matched.length < 3) {
      matched = [...TEMPLATES];
    }

    // Determine count based on duration
    const targetCount = preferences.durationMinutes === 15 ? 3 : (preferences.durationMinutes === 30 ? 4 : 5);
    const selected = matched.slice(0, targetCount);

    const minutesPerMission = Math.floor(preferences.durationMinutes / selected.length);

    return selected.map((tpl, idx) => ({
      id: `demo-mission-${Date.now()}-${idx + 1}`,
      title: tpl.title,
      objective: tpl.objective,
      instructions: tpl.instructions,
      estimatedMinutes: minutesPerMission,
      observationCriteria: tpl.criteria,
      completionCriteria: tpl.completion,
      safetyGuidance: tpl.safety,
      reflectionQuestion: tpl.reflection,
      status: 'pending' as const,
    }));
  }
}
