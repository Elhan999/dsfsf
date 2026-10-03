import { Request, Response } from 'express';
import { currentUserId } from '../middleware/auth';
import { invitationsService } from '../services/invitations.service';
import { ok } from '../utils/response';
import { invitationsQuery, inviteSchema, updateInvitationSchema } from '../validators/applications.validators';
import { idParam } from '../validators/common';

export const invitationsController = {
  async create(req: Request, res: Response) {
    const projectId = idParam.parse(req.params.id);
    ok(res, await invitationsService.create(projectId, currentUserId(req), inviteSchema.parse(req.body)), 201);
  },

  async list(req: Request, res: Response) {
    const { type } = invitationsQuery.parse(req.query);
    ok(res, await invitationsService.list(currentUserId(req), type));
  },

  async respond(req: Request, res: Response) {
    const { status } = updateInvitationSchema.parse(req.body);
    ok(res, await invitationsService.respond(idParam.parse(req.params.id), currentUserId(req), status));
  },
};
