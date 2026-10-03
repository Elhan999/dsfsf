import { Request, Response } from 'express';
import { currentUserId } from '../middleware/auth';
import { projectsService } from '../services/projects.service';
import { list, ok } from '../utils/response';
import { idParam } from '../validators/common';
import { createProjectSchema, listProjectsQuery, updateProjectSchema } from '../validators/projects.validators';

export const projectsController = {
  async list(req: Request, res: Response) {
    const result = await projectsService.list(listProjectsQuery.parse(req.query));
    list(res, result.data, result.pagination);
  },

  async categories(_req: Request, res: Response) {
    ok(res, await projectsService.listCategories());
  },

  async getById(req: Request, res: Response) {
    ok(res, await projectsService.getDetail(idParam.parse(req.params.id), req.user?.id));
  },

  async create(req: Request, res: Response) {
    ok(res, await projectsService.create(currentUserId(req), createProjectSchema.parse(req.body)), 201);
  },

  async update(req: Request, res: Response) {
    const id = idParam.parse(req.params.id);
    ok(res, await projectsService.update(id, currentUserId(req), updateProjectSchema.parse(req.body)));
  },

  async remove(req: Request, res: Response) {
    await projectsService.remove(idParam.parse(req.params.id), currentUserId(req));
    ok(res, { deleted: true });
  },
};
