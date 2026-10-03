import { z } from 'zod';
import { csvList, optionalText, optionalUrl, paginationQuery } from './common';

export const EXPERIENCE = ['junior', 'middle', 'senior', 'lead'] as const;
export const AVAILABILITY = ['available', 'part_time', 'busy'] as const;

export const listUsersQuery = paginationQuery.extend({
  search: z.string().trim().max(100).optional(),
  skills: csvList,
  role: z.string().trim().max(100).optional(),
  experience: z.enum(EXPERIENCE).optional(),
  availability: z.enum(AVAILABILITY).optional(),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(40)
      .regex(/^[a-z0-9_.]+$/, 'Only letters, numbers, dots and underscores.'),
    avatar: optionalUrl,
    bio: optionalText(1000),
    jobTitle: optionalText(120),
    githubUrl: optionalUrl,
    telegramUrl: optionalUrl,
    linkedinUrl: optionalUrl,
    experience: z.enum(EXPERIENCE).nullable(),
    availability: z.enum(AVAILABILITY),
  })
  .partial();

export const addSkillSchema = z
  .object({
    skillId: z.number().int().positive().optional(),
    name: z.string().trim().min(1).max(60).optional(),
  })
  .refine((v) => v.skillId || v.name, 'Provide skillId or name.');
