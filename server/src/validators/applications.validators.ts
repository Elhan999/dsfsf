import { z } from 'zod';

export const applySchema = z.object({
  roleId: z.number().int().positive().nullable().optional(),
  message: z.string().trim().max(1000).optional().nullable(),
});

export const updateApplicationSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'cancelled']),
});

export const inviteSchema = z.object({
  userId: z.number().int().positive(),
  roleId: z.number().int().positive().nullable().optional(),
});

export const updateInvitationSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});

export const applicationsQuery = z.object({
  type: z.enum(['sent', 'received']).default('sent'),
  status: z.enum(['pending', 'accepted', 'rejected', 'cancelled']).optional(),
});

export const invitationsQuery = z.object({
  type: z.enum(['sent', 'received']).default('received'),
});
