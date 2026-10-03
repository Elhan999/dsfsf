import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Username must be at least 3 characters.')
    .max(40)
    .regex(/^[a-z0-9_.]+$/, 'Only letters, numbers, dots and underscores.'),
  email: z.email('Enter a valid email.').trim().toLowerCase().max(255),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
});

export const loginSchema = z.object({
  email: z.email('Enter a valid email.').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required.'),
});
