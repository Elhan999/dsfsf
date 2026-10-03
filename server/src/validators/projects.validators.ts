import { z } from 'zod';
import { csvList, optionalUrl, paginationQuery } from './common';

export const PROJECT_STATUS = ['recruiting', 'active', 'completed', 'closed'] as const;

export const listProjectsQuery = paginationQuery.extend({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  status: z.enum(PROJECT_STATUS).optional(),
  skills: csvList,
  role: z.string().trim().max(80).optional(),
  ownerId: z.coerce.number().int().positive().optional(),
  memberId: z.coerce.number().int().positive().optional(),
});

export const roleInput = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(2, 'Role name is required.').max(80),
  description: z.string().trim().max(500).optional().nullable(),
  requiredCount: z.number().int().min(1).max(20).default(1),
  skills: z.array(z.string().trim().min(1).max(60)).max(15).default([]),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters.').max(120),
  description: z.string().trim().min(10, 'Description must be at least 10 characters.').max(5000),
  category: z.string().trim().min(2).max(60),
  image: optionalUrl,
  status: z.enum(PROJECT_STATUS).default('recruiting'),
  roles: z.array(roleInput).max(15).default([]),
});

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(3).max(120),
    description: z.string().trim().min(10).max(5000),
    category: z.string().trim().min(2).max(60),
    image: optionalUrl,
    status: z.enum(PROJECT_STATUS),
    progress: z.number().int().min(0).max(100),
    roles: z.array(roleInput).max(15),
  })
  .partial();
