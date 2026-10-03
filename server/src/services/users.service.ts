import { query, queryOne } from '../db/pool';
import { conflict, isUniqueViolation, notFound } from '../utils/errors';
import { pageParams } from '../utils/pagination';
import { hub } from '../websocket/hub';
import { iso, userSkillsJson } from './mappers';
import { Skill } from './skills.service';

export interface UserCard {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
  jobTitle: string | null;
  bio: string | null;
  skills: Skill[];
  projectsCount: number;
  githubUrl: string | null;
  telegramUrl: string | null;
  linkedinUrl: string | null;
  experience: string | null;
  availability: string;
  isOnline: boolean;
  createdAt: string;
}

export interface UserTeam {
  id: number;
  name: string;
  image: string | null;
  status: string;
  isOwner: boolean;
  role: { id: number; name: string } | null;
}

export interface UserProfile extends UserCard {
  email?: string;
  teams: UserTeam[];
}

interface UserRow {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  job_title: string | null;
  bio: string | null;
  skills: Skill[];
  projects_count: number;
  github_url: string | null;
  telegram_url: string | null;
  linkedin_url: string | null;
  experience: string | null;
  availability: string;
  created_at: Date;
}

const USER_CARD_SELECT = `
  SELECT u.id, u.name, u.username, u.email, u.avatar, u.job_title, u.bio,
         u.github_url, u.telegram_url, u.linkedin_url, u.experience, u.availability, u.created_at,
         ${userSkillsJson('u')} AS skills,
         (SELECT COUNT(*) FROM project_members pm WHERE pm.user_id = u.id)::int AS projects_count
  FROM users u`;

export function toUserCard(row: UserRow): UserCard {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    avatar: row.avatar,
    jobTitle: row.job_title,
    bio: row.bio,
    skills: row.skills,
    projectsCount: row.projects_count,
    githubUrl: row.github_url,
    telegramUrl: row.telegram_url,
    linkedinUrl: row.linkedin_url,
    experience: row.experience,
    availability: row.availability,
    isOnline: hub.isOnline(row.id),
    createdAt: iso(row.created_at)!,
  };
}

export interface ListUsersParams {
  page: number;
  limit: number;
  search?: string;
  skills: string[];
  role?: string;
  experience?: string;
  availability?: string;
  excludeUserId?: number;
}

const PROFILE_FIELDS: Record<string, string> = {
  name: 'name',
  username: 'username',
  avatar: 'avatar',
  bio: 'bio',
  jobTitle: 'job_title',
  githubUrl: 'github_url',
  telegramUrl: 'telegram_url',
  linkedinUrl: 'linkedin_url',
  experience: 'experience',
  availability: 'availability',
};

async function loadTeams(userId: number): Promise<UserTeam[]> {
  return query<UserTeam>(
    `SELECT p.id, p.name, p.image, p.status, (p.owner_id = pm.user_id) AS "isOwner",
            CASE WHEN r.id IS NULL THEN NULL ELSE json_build_object('id', r.id, 'name', r.name) END AS role
     FROM project_members pm
     JOIN projects p ON p.id = pm.project_id
     LEFT JOIN project_roles r ON r.id = pm.role_id
     WHERE pm.user_id = $1
     ORDER BY pm.joined_at DESC`,
    [userId],
  );
}

export const usersService = {
  async list(params: ListUsersParams) {
    const { page, limit, offset } = pageParams(params.page, params.limit);
    const where: string[] = [];
    const values: unknown[] = [];
    const add = (value: unknown) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (params.search) {
      const p = add(`%${params.search}%`);
      where.push(`(u.name ILIKE ${p} OR u.username ILIKE ${p} OR u.job_title ILIKE ${p} OR u.bio ILIKE ${p}
        OR EXISTS (SELECT 1 FROM user_skills us JOIN skills s ON s.id = us.skill_id
                   WHERE us.user_id = u.id AND s.name ILIKE ${p}))`);
    }
    let skillsParam: string | null = null;
    if (params.skills.length) {
      skillsParam = add(params.skills.map((s) => s.toLowerCase()));
      where.push(`EXISTS (SELECT 1 FROM user_skills us JOIN skills s ON s.id = us.skill_id
                  WHERE us.user_id = u.id AND LOWER(s.name) = ANY(${skillsParam}::text[]))`);
    }
    if (params.role) where.push(`u.job_title ILIKE ${add(`%${params.role}%`)}`);
    if (params.experience) where.push(`u.experience = ${add(params.experience)}`);
    if (params.availability) where.push(`u.availability = ${add(params.availability)}`);
    if (params.excludeUserId) where.push(`u.id <> ${add(params.excludeUserId)}`);

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    // With a skills filter, users matching more of the requested skills come first.
    const orderSql = skillsParam
      ? `ORDER BY (SELECT COUNT(*) FROM user_skills us JOIN skills s ON s.id = us.skill_id
                   WHERE us.user_id = u.id AND LOWER(s.name) = ANY(${skillsParam}::text[])) DESC, u.created_at DESC`
      : 'ORDER BY u.created_at DESC';

    const [countRow] = await query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM users u ${whereSql}`, values);
    const rows = await query<UserRow>(
      `${USER_CARD_SELECT} ${whereSql} ${orderSql} LIMIT ${add(limit)} OFFSET ${add(offset)}`,
      values,
    );
    return { data: rows.map(toUserCard), pagination: { page, limit, total: countRow.total } };
  },

  async getCardsByIds(ids: number[]): Promise<UserCard[]> {
    if (ids.length === 0) return [];
    const rows = await query<UserRow>(`${USER_CARD_SELECT} WHERE u.id = ANY($1::int[])`, [ids]);
    return rows.map(toUserCard);
  },

  async getById(id: number): Promise<UserProfile> {
    const row = await queryOne<UserRow>(`${USER_CARD_SELECT} WHERE u.id = $1`, [id]);
    if (!row) throw notFound('User not found.');
    return { ...toUserCard(row), teams: await loadTeams(id) };
  },

  async getMe(id: number): Promise<UserProfile> {
    const row = await queryOne<UserRow>(`${USER_CARD_SELECT} WHERE u.id = $1`, [id]);
    if (!row) throw notFound('User not found.');
    return { ...toUserCard(row), email: row.email, teams: await loadTeams(id) };
  },

  async updateMe(id: number, input: Record<string, unknown>) {
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const [key, column] of Object.entries(PROFILE_FIELDS)) {
      if (input[key] === undefined) continue;
      values.push(input[key]);
      sets.push(`${column} = $${values.length}`);
    }
    if (sets.length) {
      values.push(id);
      try {
        await query(`UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${values.length}`, values);
      } catch (error) {
        if (isUniqueViolation(error)) throw conflict('This username is taken.');
        throw error;
      }
    }
    return this.getMe(id);
  },
};
