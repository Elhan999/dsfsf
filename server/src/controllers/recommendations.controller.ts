import { Request, Response } from 'express';
import { currentUserId } from '../middleware/auth';
import { recommendationsService } from '../services/recommendations.service';
import { ok } from '../utils/response';

export const recommendationsController = {
  async get(req: Request, res: Response) {
    const userId = currentUserId(req);
    const [projects, users] = await Promise.all([
      recommendationsService.projects(userId),
      recommendationsService.users(userId),
    ]);
    ok(res, { projects, users });
  },
};
