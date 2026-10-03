import { z } from 'zod';

export const idParam = z.coerce.number().int().positive();

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** Accepts "a,b,c" or repeated query params and returns a trimmed string array. */
export const csvList = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    if (!value) return [];
    const parts = Array.isArray(value) ? value : value.split(',');
    return parts.map((s) => s.trim()).filter(Boolean);
  });

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

export const optionalUrl = z.preprocess(emptyToNull, z.url().max(500).nullable().optional());
export const optionalText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullable().optional());
