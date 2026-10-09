import { z } from 'zod';
import { AdventurePreferencesSchema } from './adventure.schema.js';

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

export const GenerateMissionsResponseSchema = z.object({
  sessionId: z.string(),
  provider: z.enum(['ollama', 'demo', 'cloud']),
  model: z.string(),
  generatedAt: z.string(),
  preferences: AdventurePreferencesSchema,
  missions: z.array(NatureMissionSchema).min(1).max(6),
});

export type MissionStatus = z.infer<typeof MissionStatusSchema>;
export type NatureMission = z.infer<typeof NatureMissionSchema>;
export type GenerateMissionsResponse = z.infer<typeof GenerateMissionsResponseSchema>;
