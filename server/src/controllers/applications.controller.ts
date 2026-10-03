import { Request, Response } from 'express';
import { z } from 'zod';
import { currentUserId } from '../middleware/auth';
import { applicationsService } from '../services/applications.service';
import { ok } from '../utils/response';
import { applicationsQuery, applySchema, updateApplicationSchema } from '../validators/applications.validators';
import { idParam } from '../validators/common';

const projectApplicationsQuery = z.object({
  status: z.enum(['pending', 'accepted', 'rejected', 'cancelled']).optional(),
});

export const applicationsController = {
  async apply(req: Request, res: Response) {
    const projectId = idParam.parse(req.params.id);
    ok(res, await applicationsService.apply(projectId, currentUserId(req), applySchema.parse(req.body)), 201);
  },

  async listForProject(req: Request, res: Response) {
    const projectId = idParam.parse(req.params.id);
    const { status } = projectApplicationsQuery.parse(req.query);
    ok(res, await applicationsService.listForProject(projectId, currentUserId(req), status));
  },

  async listMine(req: Request, res: Response) {
    const { type, status } = applicationsQuery.parse(req.query);
    ok(res, await applicationsService.listMine(currentUserId(req), type, status));
  },

  async update(req: Request, res: Response) {
    const { status } = updateApplicationSchema.parse(req.body);
    ok(res, await applicationsService.updateStatus(idParam.parse(req.params.id), currentUserId(req), status));
  },
};
