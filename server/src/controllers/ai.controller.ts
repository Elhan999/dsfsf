import { Request, Response } from 'express';
import { currentUserId } from '../middleware/auth';
import { aiService } from '../services/ai.service';
import { ok } from '../utils/response';
import { aiMatchSchema } from '../validators/ai.validators';

export const aiController = {
  async match(req: Request, res: Response) {
    const { description, limit } = aiMatchSchema.parse(req.body);
    ok(res, await aiService.match(description, currentUserId(req), limit));
  },
};
