import { Request, Response } from 'express';
import { currentUserId } from '../middleware/auth';
import { messagesService } from '../services/messages.service';
import { list, ok } from '../utils/response';
import { idParam } from '../validators/common';
import { messagesQuery, sendMessageSchema } from '../validators/messages.validators';

export const messagesController = {
  async history(req: Request, res: Response) {
    const projectId = idParam.parse(req.params.id);
    const result = await messagesService.history(projectId, currentUserId(req), messagesQuery.parse(req.query));
    list(res, result.data, result.pagination);
  },

  async send(req: Request, res: Response) {
    const projectId = idParam.parse(req.params.id);
    const { content } = sendMessageSchema.parse(req.body);
    ok(res, await messagesService.send(projectId, currentUserId(req), content), 201);
  },
};
