import { z } from 'zod';

export const aiMatchSchema = z.object({
  description: z.string().trim().min(5, 'Describe the teammate you need.').max(2000),
  limit: z.number().int().min(1).max(50).default(10),
});
