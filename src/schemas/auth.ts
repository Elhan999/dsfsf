import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Enter a valid email.'),
  password: z.string().min(1, 'Password is required.'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  username: z
    .string()
    .trim()
    .min(3, 'At least 3 characters.')
    .max(40)
    .regex(/^[a-zA-Z0-9_.]+$/, 'Only letters, numbers, dots and underscores.'),
  email: z.email('Enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
