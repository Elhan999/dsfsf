import { Request, Response } from 'express';
import { z } from 'zod';
import { currentUserId } from '../middleware/auth';
import { notificationsService } from '../services/notifications.service';
import { list, ok } from '../utils/response';
import { idParam, paginationQuery } from '../validators/common';

const notificationsQuery = paginationQuery.extend({
  unread: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});

export const notificationsController = {
  async list(req: Request, res: Response) {
    const result = await notificationsService.list(currentUserId(req), notificationsQuery.parse(req.query));
    list(res, result.data, result.pagination, { unreadCount: result.unreadCount });
  },

  async unreadCount(req: Request, res: Response) {
    ok(res, { unreadCount: await notificationsService.unreadCount(currentUserId(req)) });
  },

  async markRead(req: Request, res: Response) {
    ok(res, await notificationsService.markRead(currentUserId(req), idParam.parse(req.params.id)));
  },

  async markAllRead(req: Request, res: Response) {
    ok(res, await notificationsService.markAllRead(currentUserId(req)));
  },
};
