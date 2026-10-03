import { query, queryOne, Queryable, pool } from '../db/pool';
import { notFound } from '../utils/errors';
import { pageParams } from '../utils/pagination';
import { hub } from '../websocket/hub';
import { iso, UserSummary, userSummaryJson } from './mappers';

export type NotificationType =
  | 'NEW_APPLICATION'
  | 'APPLICATION_ACCEPTED'
  | 'APPLICATION_REJECTED'
  | 'NEW_INVITATION'
  | 'NEW_MESSAGE'
  | 'PROJECT_UPDATE';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string | null;
  project: { id: number; name: string } | null;
  actor: UserSummary | null;
  isRead: boolean;
  createdAt: string;
}

interface CreateInput {
  userId: number;
  type: NotificationType;
  title: string;
  message?: string | null;
  projectId?: number | null;
  actorId?: number | null;
}

const NOTIFICATION_SELECT = `
  SELECT n.id, n.type, n.title, n.message, n.is_read, n.created_at,
    CASE WHEN p.id IS NULL THEN NULL ELSE json_build_object('id', p.id, 'name', p.name) END AS project,
    CASE WHEN a.id IS NULL THEN NULL ELSE ${userSummaryJson('a')} END AS actor
  FROM notifications n
  LEFT JOIN projects p ON p.id = n.project_id
  LEFT JOIN users a ON a.id = n.actor_id`;

interface NotificationRow {
  id: number;
  type: NotificationType;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: Date;
  project: Notification['project'];
  actor: UserSummary | null;
}

const toNotification = (r: NotificationRow): Notification => ({
  id: r.id,
  type: r.type,
  title: r.title,
  message: r.message,
  project: r.project,
  actor: r.actor,
  isRead: r.is_read,
  createdAt: iso(r.created_at)!,
});

async function unreadCount(userId: number): Promise<number> {
  const row = await queryOne<{ count: number }>(
    'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND NOT is_read',
    [userId],
  );
  return row!.count;
}

export const notificationsService = {
  unreadCount,

  /**
   * Stores a notification and pushes it over WebSocket. Pass a transaction client to
   * insert atomically with the triggering change; call `push` after commit in that case.
   */
  async create(input: CreateInput, client: Queryable = pool): Promise<number> {
    const row = await queryOne<{ id: number }>(
      `INSERT INTO notifications (user_id, type, title, message, project_id, actor_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [input.userId, input.type, input.title, input.message ?? null, input.projectId ?? null, input.actorId ?? null],
      client,
    );
    if (client === pool) await this.push(input.userId, row!.id);
    return row!.id;
  },

  async push(userId: number, notificationId: number) {
    const row = await queryOne<NotificationRow>(`${NOTIFICATION_SELECT} WHERE n.id = $1`, [notificationId]);
    if (!row) return;
    hub.sendToUser(userId, {
      type: 'new_notification',
      data: toNotification(row),
      unreadCount: await unreadCount(userId),
    });
  },

  async list(userId: number, params: { page: number; limit: number; unread?: boolean }) {
    const { page, limit, offset } = pageParams(params.page, params.limit);
    const filter = params.unread ? 'AND NOT n.is_read' : '';
    const [countRow] = await query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM notifications n WHERE n.user_id = $1 ${filter}`,
      [userId],
    );
    const rows = await query<NotificationRow>(
      `${NOTIFICATION_SELECT} WHERE n.user_id = $1 ${filter} ORDER BY n.created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return {
      data: rows.map(toNotification),
      pagination: { page, limit, total: countRow.total },
      unreadCount: await unreadCount(userId),
    };
  },

  async markRead(userId: number, id: number) {
    const row = await queryOne<NotificationRow>(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId],
    );
    if (!row) throw notFound('Notification not found.');
    return { id, isRead: true, unreadCount: await unreadCount(userId) };
  },

  async markAllRead(userId: number) {
    await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND NOT is_read', [userId]);
    return { unreadCount: 0 };
  },

  /** One unread NEW_MESSAGE notification per project is enough; skip users already in the chat room. */
  async notifyNewMessage(projectId: number, projectName: string, sender: { id: number; name: string }, preview: string) {
    const recipients = await query<{ user_id: number }>(
      `SELECT m.user_id FROM project_members m
       WHERE m.project_id = $1 AND m.user_id <> $2
         AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = m.user_id AND n.project_id = $1
                         AND n.type = 'NEW_MESSAGE' AND NOT n.is_read)`,
      [projectId, sender.id],
    );
    for (const { user_id } of recipients) {
      if (hub.isInRoom(user_id, projectId)) continue;
      await this.create({
        userId: user_id,
        type: 'NEW_MESSAGE',
        title: `New message in ${projectName}`,
        message: `${sender.name}: ${preview.length > 120 ? `${preview.slice(0, 117)}...` : preview}`,
        projectId,
        actorId: sender.id,
      });
    }
  },
};
