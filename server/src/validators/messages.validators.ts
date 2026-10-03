import { z } from 'zod';
import { paginationQuery } from './common';

export const messagesQuery = paginationQuery.extend({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const messageContent = z.string().trim().min(1, 'Message cannot be empty.').max(4000);

export const sendMessageSchema = z.object({ content: messageContent });
