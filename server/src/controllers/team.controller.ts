import { Request, Response } from 'express';
import { currentUserId } from '../middleware/auth';
import { teamService } from '../services/team.service';
import { ok } from '../utils/response';
import { idParam } from '../validators/common';

export const teamController = {
  async members(req: Request, res: Response) {
    ok(res, await teamService.getMembers(idParam.parse(req.params.id)));
  },

  async removeMember(req: Request, res: Response) {
    await teamService.removeMember(idParam.parse(req.params.id), currentUserId(req), idParam.parse(req.params.userId));
    ok(res, { removed: true });
  },

  async leave(req: Request, res: Response) {
    await teamService.leave(idParam.parse(req.params.id), currentUserId(req));
    ok(res, { left: true });
  },
};
