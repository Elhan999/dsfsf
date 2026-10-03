import { z } from 'zod';

const optionalUrl = z.union([z.literal(''), z.url('Enter a valid URL (https://...).')]);

export const PROJECT_CATEGORIES = [
  'EdTech',
  'FinTech',
  'Health',
  'Sports',
  'Marketing',
  'Developer Tools',
  'AI / ML',
  'Social',
  'E-commerce',
  'Gaming',
  'Other',
] as const;

export const projectStepSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters.').max(120),
  description: z.string().trim().min(10, 'Tell people a bit more (10+ characters).').max(5000),
  category: z.string().min(2, 'Pick a category.'),
  image: optionalUrl,
  status: z.enum(['recruiting', 'active', 'completed', 'closed']),
});

export const roleSchema = z.object({
  id: z.number().optional(),
  name: z.string().trim().min(2, 'Role name is required.').max(80),
  description: z.string().trim().max(500),
  requiredCount: z.number({ message: 'Enter a number.' }).int().min(1, 'At least 1.').max(20, 'At most 20.'),
  skills: z.array(z.string()).max(15),
});

export const rolesStepSchema = z.object({
  roles: z.array(roleSchema).min(1, 'Add at least one role you are looking for.').max(15),
});

export const projectFormSchema = projectStepSchema.extend(rolesStepSchema.shape);

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
