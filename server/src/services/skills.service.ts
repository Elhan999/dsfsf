import { PoolClient } from 'pg';
import { query, queryOne, Queryable, pool } from '../db/pool';
import { notFound } from '../utils/errors';

export interface Skill {
  id: number;
  name: string;
}

export const skillsService = {
  async list(search?: string): Promise<Skill[]> {
    if (search) {
      return query<Skill>('SELECT id, name FROM skills WHERE name ILIKE $1 ORDER BY name LIMIT 50', [`%${search}%`]);
    }
    return query<Skill>('SELECT id, name FROM skills ORDER BY name');
  },

  /** Finds skills by name (case-insensitive), creating missing ones. Returns them in input order. */
  async upsertByNames(names: string[], client: Queryable | PoolClient = pool): Promise<Skill[]> {
    const unique = [...new Map(names.map((n) => [n.trim().toLowerCase(), n.trim()])).values()].filter(Boolean);
    if (unique.length === 0) return [];
    await query(
      `INSERT INTO skills (name) SELECT unnest($1::text[]) ON CONFLICT (LOWER(name)) DO NOTHING`,
      [unique],
      client,
    );
    return query<Skill>(
      'SELECT id, name FROM skills WHERE LOWER(name) = ANY($1::text[]) ORDER BY name',
      [unique.map((n) => n.toLowerCase())],
      client,
    );
  },

  async addToUser(userId: number, input: { skillId?: number; name?: string }): Promise<Skill> {
    let skill: Skill | null;
    if (input.skillId) {
      skill = await queryOne<Skill>('SELECT id, name FROM skills WHERE id = $1', [input.skillId]);
      if (!skill) throw notFound('Skill not found.');
    } else {
      [skill] = await this.upsertByNames([input.name!]);
    }
    await query('INSERT INTO user_skills (user_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
      userId,
      skill!.id,
    ]);
    await query('UPDATE users SET updated_at = NOW() WHERE id = $1', [userId]);
    return skill!;
  },

  async removeFromUser(userId: number, skillId: number) {
    const rows = await query('DELETE FROM user_skills WHERE user_id = $1 AND skill_id = $2 RETURNING skill_id', [
      userId,
      skillId,
    ]);
    if (rows.length === 0) throw notFound('Skill is not on your profile.');
  },
};
