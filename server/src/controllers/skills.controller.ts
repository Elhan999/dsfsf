import { Request, Response } from 'express';
import { z } from 'zod';
import { skillsService } from '../services/skills.service';
import { ok } from '../utils/response';

const skillsQuery = z.object({ search: z.string().trim().max(60).optional() });

export const skillsController = {
  async list(req: Request, res: Response) {
    ok(res, await skillsService.list(skillsQuery.parse(req.query).search));
  },
};
