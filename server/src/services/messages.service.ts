import { query, queryOne } from '../db/pool';
import { pageParams } from '../utils/pagination';
import { hub } from '../websocket/hub';
import { iso, UserSummary, userSummaryJson } from './mappers';
import { notificationsService } from './notifications.service';
import { projectsService } from './projects.service';

export interface ChatMessage {
  id: number;
  projectId: number;
  sender: UserSummary;
  content: string;
  createdAt: string;
}

interface MessageRow {
  id: number;
  project_id: number;
  sender: UserSummary;
  content: string;
  created_at: Date;
}

const toMessage = (r: MessageRow): ChatMessage => ({
  id: r.id,
  projectId: r.project_id,
  sender: r.sender,
  content: r.content,
  createdAt: iso(r.created_at)!,
});

export const messagesService = {
  /** Page 1 holds the newest messages; each page is returned oldest → newest for display. */
  async history(projectId: number, userId: number, params: { page: number; limit: number }) {
    await projectsService.assertMember(projectId, userId);
    const { page, limit, offset } = pageParams(params.page, params.limit);
    const [countRow] = await query<{ total: number }>(
      'SELECT COUNT(*)::int AS total FROM messages WHERE project_id = $1',
      [projectId],
    );
    const rows = await query<MessageRow>(
      `SELECT * FROM (
         SELECT m.id, m.project_id, m.content, m.created_at, ${userSummaryJson('u')} AS sender
         FROM messages m JOIN users u ON u.id = m.sender_id
         WHERE m.project_id = $1
         ORDER BY m.created_at DESC, m.id DESC
         LIMIT $2 OFFSET $3
       ) page ORDER BY created_at, id`,
      [projectId, limit, offset],
    );
    return { data: rows.map(toMessage), pagination: { page, limit, total: countRow.total } };
  },

  /** Persists a message, broadcasts it to the room, and notifies members who aren't watching the chat. */
  async send(projectId: number, userId: number, content: string): Promise<ChatMessage> {
    await projectsService.assertMember(projectId, userId);
    const row = await queryOne<MessageRow>(
      `WITH inserted AS (
         INSERT INTO messages (project_id, sender_id, content) VALUES ($1, $2, $3)
         RETURNING id, project_id, sender_id, content, created_at
       )
       SELECT i.id, i.project_id, i.content, i.created_at, ${userSummaryJson('u')} AS sender
       FROM inserted i JOIN users u ON u.id = i.sender_id`,
      [projectId, userId, content],
    );
    const message = toMessage(row!);
    hub.broadcastToRoom(projectId, { type: 'new_message', data: message });

    const project = await queryOne<{ name: string }>('SELECT name FROM projects WHERE id = $1', [projectId]);
    notificationsService
      .notifyNewMessage(projectId, project!.name, { id: userId, name: message.sender.name }, content)
      .catch((error) => console.error('Failed to create message notifications', error));
    return message;
  },
};
