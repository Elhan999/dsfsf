import { api, unwrap } from '@/lib/api';
import type { AiMatchResult } from '@/types/api';

/** The AI provider key lives on the backend only; the frontend just posts the description. */
export const aiService = {
  match: (description: string) => unwrap<AiMatchResult>(api.post('/ai/match', { description })),
};
