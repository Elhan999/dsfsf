import { z } from 'zod';

const optionalUrl = z.union([z.literal(''), z.url('Enter a valid URL (https://...).')]);

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  username: z
    .string()
    .trim()
    .min(3, 'At least 3 characters.')
    .max(40)
    .regex(/^[a-zA-Z0-9_.]+$/, 'Only letters, numbers, dots and underscores.'),
  jobTitle: z.string().trim().max(120),
  bio: z.string().trim().max(1000, 'Keep it under 1000 characters.'),
  avatar: optionalUrl,
  githubUrl: optionalUrl,
  telegramUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  experience: z.enum(['', 'junior', 'middle', 'senior', 'lead']),
  availability: z.enum(['available', 'part_time', 'busy']),
});

export type ProfileValues = z.infer<typeof profileSchema>;
