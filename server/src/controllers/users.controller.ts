import { Request, Response } from 'express';
import { currentUserId } from '../middleware/auth';
import { skillsService } from '../services/skills.service';
import { usersService } from '../services/users.service';
import { list, ok } from '../utils/response';
import { idParam } from '../validators/common';
import { addSkillSchema, listUsersQuery, updateProfileSchema } from '../validators/users.validators';

export const usersController = {
  async list(req: Request, res: Response) {
    const params = listUsersQuery.parse(req.query);
    const result = await usersService.list({ ...params, excludeUserId: req.user?.id });
    list(res, result.data, result.pagination);
  },

  async getById(req: Request, res: Response) {
    ok(res, await usersService.getById(idParam.parse(req.params.id)));
  },

  async me(req: Request, res: Response) {
    ok(res, await usersService.getMe(currentUserId(req)));
  },

  async updateMe(req: Request, res: Response) {
    ok(res, await usersService.updateMe(currentUserId(req), updateProfileSchema.parse(req.body)));
  },

  async addSkill(req: Request, res: Response) {
    const skill = await skillsService.addToUser(currentUserId(req), addSkillSchema.parse(req.body));
    ok(res, skill, 201);
  },

  async removeSkill(req: Request, res: Response) {
    await skillsService.removeFromUser(currentUserId(req), idParam.parse(req.params.skillId));
    ok(res, { removed: true });
  },
};
