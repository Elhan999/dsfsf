import { query } from '../db/pool';
import { projectsService } from './projects.service';
import { usersService } from './users.service';

export const recommendationsService = {
  /** Recruiting projects whose open roles need the viewer's skills, excluding their own teams. */
  async projects(userId: number, limit = 6) {
    const rows = await query<{ id: number }>(
      `SELECT p.id
       FROM projects p
       LEFT JOIN project_roles r ON r.project_id = p.id
       LEFT JOIN role_skills rs ON rs.role_id = r.id
       LEFT JOIN user_skills us ON us.skill_id = rs.skill_id AND us.user_id = $1
       WHERE p.status = 'recruiting'
         AND NOT EXISTS (SELECT 1 FROM project_members m WHERE m.project_id = p.id AND m.user_id = $1)
       GROUP BY p.id
       ORDER BY COUNT(DISTINCT us.skill_id) DESC, p.created_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    return Promise.all(rows.map((r) => projectsService.getCard(r.id)));
  },

  /** People whose skills fill open roles in the viewer's projects; falls back to shared skills. */
  async users(userId: number, limit = 6) {
    const rows = await query<{ id: number }>(
      `WITH needed AS (
         SELECT DISTINCT rs.skill_id FROM projects p
         JOIN project_roles r ON r.project_id = p.id
         JOIN role_skills rs ON rs.role_id = r.id
         WHERE p.owner_id = $1
       ), mine AS (
         SELECT skill_id FROM user_skills WHERE user_id = $1
       )
       SELECT u.id
       FROM users u
       LEFT JOIN user_skills us ON us.user_id = u.id
       WHERE u.id <> $1
       GROUP BY u.id
       ORDER BY COUNT(*) FILTER (WHERE us.skill_id IN (SELECT skill_id FROM needed)) DESC,
                COUNT(*) FILTER (WHERE us.skill_id IN (SELECT skill_id FROM mine)) DESC,
                u.created_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    const cards = await usersService.getCardsByIds(rows.map((r) => r.id));
    const byId = new Map(cards.map((c) => [c.id, c]));
    return rows.map((r) => byId.get(r.id)!);
  },
};
