import { z } from 'zod';

export const applySchema = z.object({
  roleId: z.string().min(1, 'Select a role.'),
  message: z.string().trim().max(1000, 'Keep it under 1000 characters.'),
});

export const aiMatchSchema = z.object({
  description: z.string().trim().min(5, 'Describe the teammate you need.').max(2000),
});

export type ApplyValues = z.infer<typeof applySchema>;
