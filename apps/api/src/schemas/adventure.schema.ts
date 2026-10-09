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
  durationMinutes: z.union([
    z.literal(15),
    z.literal(30),
    z.literal(60)
  ]),
  environment: EnvironmentTypeSchema,
  interests: z.array(InterestTypeSchema).min(1, 'Please select at least one nature interest').max(5),
  difficulty: DifficultySchema,
  language: LanguageSchema.default('en'),
  accessibleMobility: z.boolean().default(false),
  customFocus: z.string().max(120).optional(),
});

export type EnvironmentType = z.infer<typeof EnvironmentTypeSchema>;
export type InterestType = z.infer<typeof InterestTypeSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type AdventurePreferences = z.infer<typeof AdventurePreferencesSchema>;
