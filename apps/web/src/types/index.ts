import { z } from 'zod';

export const EnvironmentTypeSchema = z.enum([
  'park',
  'garden',
  'urban',
  'trail',
  'balcony'
]);

export const InterestTypeSchema = z.enum([
  'plants',
  'birds',
  'insects',
  'trees',
  'sounds',
  'patterns',
  'biodiversity'
]);

export const DifficultySchema = z.enum(['easy', 'exploratory']);
export const LanguageSchema = z.literal('en').default('en');

export const AdventurePreferencesSchema = z.object({
  durationMinutes: z.union([z.literal(15), z.literal(30), z.literal(60)]),
  environment: EnvironmentTypeSchema,
  interests: z.array(InterestTypeSchema).min(1).max(5),
  difficulty: DifficultySchema,
  language: LanguageSchema.default('en'),
  accessibleMobility: z.boolean().default(false),
  customFocus: z.string().max(120).optional(),
});

export const MissionStatusSchema = z.enum([
  'pending',
  'active',
  'completed',
  'skipped'
]);

export const NatureMissionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3).max(120),
  objective: z.string().min(8).max(350),
  instructions: z.array(z.string().min(3)).min(2).max(6),
  estimatedMinutes: z.number().int().positive().max(60),
  observationCriteria: z.array(z.string().min(2)).min(1),
  completionCriteria: z.string().min(4),
  safetyGuidance: z.string().min(8),
  reflectionQuestion: z.string().min(8),
  status: MissionStatusSchema.default('pending'),
  userNotes: z.string().optional(),
  userPhotoUrl: z.string().optional(),
  completedAt: z.string().datetime().optional(),
});

export const AdventureSessionRecordSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
  durationMinutes: z.number(),
  environment: EnvironmentTypeSchema,
  difficulty: DifficultySchema,
  language: LanguageSchema,
  interests: z.array(InterestTypeSchema),
  accessibleMobility: z.boolean(),
  missions: z.array(NatureMissionSchema),
  status: z.enum(['in_progress', 'completed', 'abandoned']),
  totalMinutesSpent: z.number(),
  providerUsed: z.enum(['ollama', 'demo', 'cloud']),
  modelUsed: z.string().optional(),
  overallReflection: z.string().optional(),
});

export type EnvironmentType = z.infer<typeof EnvironmentTypeSchema>;
export type InterestType = z.infer<typeof InterestTypeSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type AdventurePreferences = z.infer<typeof AdventurePreferencesSchema>;
export type MissionStatus = z.infer<typeof MissionStatusSchema>;
export type NatureMission = z.infer<typeof NatureMissionSchema>;
export type AdventureSessionRecord = z.infer<typeof AdventureSessionRecordSchema>;

export interface AIProviderStatus {
  available: boolean;
  status: 'available' | 'unavailable';
  provider: 'ollama' | 'demo' | 'cloud';
  model: string;
  endpoint?: string;
  cloudService?: 'gemini' | 'groq';
  message: string;
  error?: string;
  installedModels?: string[];
}
