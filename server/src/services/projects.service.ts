import { PoolClient } from 'pg';
import { query, queryOne, Queryable, pool, withTransaction } from '../db/pool';
import { badRequest, forbidden, notFound } from '../utils/errors';
import { pageParams } from '../utils/pagination';
import { hub } from '../websocket/hub';
import { iso, UserSummary, userSummaryJson } from './mappers';
import { skillsService } from './skills.service';

export interface ProjectRole {
  id: number;
  name: string;
  description: string | null;
  requiredCount: number;
  filledCount: number;
  skills: string[];
}

export interface ProjectCard {
  id: number;
  name: string;
  description: string;
  category: string;
  image: string | null;
  status: string;
  progress: number;
  owner: UserSummary;
  roles: ProjectRole[];
  skills: string[];
  membersCount: number;
  teamSize: number;
  openPositions: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  user: UserSummary & { isOnline: boolean };
  role: { id: number; name: string } | null;
  isOwner: boolean;
  joinedAt: string;
}

export interface ProjectDetail extends ProjectCard {
  members: ProjectMember[];
  viewer: {
    isOwner: boolean;
    isMember: boolean;
    application: { id: number; status: string; roleId: number | null } | null;
    invitation: { id: number; status: string; roleId: number | null } | null;
  } | null;
}

interface ProjectRow {
  id: number;
  name: string;
  description: string;
  category: string;
  image: string | null;
  status: string;
  progress: number;
  owner: UserSummary;
  roles: ProjectRole[];
  skills: string[];
  members_count: number;
  created_at: Date;
  updated_at: Date;
}

const PROJECT_CARD_SELECT = `
  SELECT p.id, p.name, p.description, p.category, p.image, p.status, p.progress, p.created_at, p.updated_at,
    ${userSummaryJson('o')} AS owner,
    COALESCE((
      SELECT json_agg(json_build_object(
        'id', r.id, 'name', r.name, 'description', r.description, 'requiredCount', r.required_count,
        'filledCount', (SELECT COUNT(*) FROM project_members m WHERE m.role_id = r.id)::int,
        'skills', COALESCE((SELECT json_agg(s.name ORDER BY s.name) FROM role_skills rs
                            JOIN skills s ON s.id = rs.skill_id WHERE rs.role_id = r.id), '[]'::json)
      ) ORDER BY r.id)
      FROM project_roles r WHERE r.project_id = p.id
    ), '[]'::json) AS roles,
    COALESCE((
      SELECT json_agg(DISTINCT s.name) FROM project_roles r
      JOIN role_skills rs ON rs.role_id = r.id JOIN skills s ON s.id = rs.skill_id
      WHERE r.project_id = p.id
    ), '[]'::json) AS skills,
    (SELECT COUNT(*) FROM project_members m WHERE m.project_id = p.id)::int AS members_count
  FROM projects p
  JOIN users o ON o.id = p.owner_id`;

function toProjectCard(row: ProjectRow): ProjectCard {
  const required = row.roles.reduce((sum, r) => sum + r.requiredCount, 0);
  const open = row.roles.reduce((sum, r) => sum + Math.max(r.requiredCount - r.filledCount, 0), 0);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    image: row.image,
    status: row.status,
    progress: row.progress,
    owner: row.owner,
    roles: row.roles,
    skills: row.skills,
    membersCount: row.members_count,
    // Owner + every seat the roles ask for; never smaller than who's already on the team.
    teamSize: Math.max(required + 1, row.members_count),
    openPositions: open,
    createdAt: iso(row.created_at)!,
    updatedAt: iso(row.updated_at)!,
  };
}

export interface ListProjectsParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  status?: string;
  skills: string[];
  role?: string;
  ownerId?: number;
  memberId?: number;
}

interface RoleInput {
  id?: number;
  name: string;
  description?: string | null;
  requiredCount: number;
  skills: string[];
}

async function insertRole(projectId: number, role: RoleInput, client: PoolClient) {
  const inserted = await queryOne<{ id: number }>(
    `INSERT INTO project_roles (project_id, name, description, required_count)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [projectId, role.name, role.description ?? null, role.requiredCount],
    client,
  );
  await setRoleSkills(inserted!.id, role.skills, client);
}

async function setRoleSkills(roleId: number, skillNames: string[], client: PoolClient) {
  await query('DELETE FROM role_skills WHERE role_id = $1', [roleId], client);
  const skills = await skillsService.upsertByNames(skillNames, client);
  if (skills.length) {
    await query(
      'INSERT INTO role_skills (role_id, skill_id) SELECT $1, unnest($2::int[])',
      [roleId, skills.map((s) => s.id)],
      client,
    );
  }
}

export const projectsService = {
  async list(params: ListProjectsParams) {
    const { page, limit, offset } = pageParams(params.page, params.limit);
    const where: string[] = [];
    const values: unknown[] = [];
    const add = (value: unknown) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (params.search) {
      const p = add(`%${params.search}%`);
      where.push(`(p.name ILIKE ${p} OR p.description ILIKE ${p} OR p.category ILIKE ${p}
        OR EXISTS (SELECT 1 FROM project_roles r
                   LEFT JOIN role_skills rs ON rs.role_id = r.id LEFT JOIN skills s ON s.id = rs.skill_id
                   WHERE r.project_id = p.id AND (r.name ILIKE ${p} OR s.name ILIKE ${p})))`);
    }
    if (params.category) where.push(`p.category ILIKE ${add(params.category)}`);
    if (params.status) where.push(`p.status = ${add(params.status)}`);
    if (params.skills.length) {
      where.push(`EXISTS (SELECT 1 FROM project_roles r JOIN role_skills rs ON rs.role_id = r.id
                  JOIN skills s ON s.id = rs.skill_id
                  WHERE r.project_id = p.id AND LOWER(s.name) = ANY(${add(params.skills.map((s) => s.toLowerCase()))}::text[]))`);
    }
    if (params.role) {
      where.push(`EXISTS (SELECT 1 FROM project_roles r WHERE r.project_id = p.id AND r.name ILIKE ${add(`%${params.role}%`)})`);
    }
    if (params.ownerId) where.push(`p.owner_id = ${add(params.ownerId)}`);
    if (params.memberId) {
      where.push(`EXISTS (SELECT 1 FROM project_members m WHERE m.project_id = p.id AND m.user_id = ${add(params.memberId)})`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [countRow] = await query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM projects p ${whereSql}`, values);
    const rows = await query<ProjectRow>(
      `${PROJECT_CARD_SELECT} ${whereSql} ORDER BY p.created_at DESC LIMIT ${add(limit)} OFFSET ${add(offset)}`,
      values,
    );
    return { data: rows.map(toProjectCard), pagination: { page, limit, total: countRow.total } };
  },

  async listCategories(): Promise<string[]> {
    const rows = await query<{ category: string }>('SELECT DISTINCT category FROM projects ORDER BY category');
    return rows.map((r) => r.category);
  },

  async getCard(id: number, client: Queryable = pool): Promise<ProjectCard> {
    const row = await queryOne<ProjectRow>(`${PROJECT_CARD_SELECT} WHERE p.id = $1`, [id], client);
    if (!row) throw notFound('Project not found.');
    return toProjectCard(row);
  },

  async getMembers(projectId: number): Promise<ProjectMember[]> {
    const rows = await query<{ user: UserSummary; role: ProjectMember['role']; is_owner: boolean; joined_at: Date }>(
      `SELECT ${userSummaryJson('u')} AS user,
              CASE WHEN r.id IS NULL THEN NULL ELSE json_build_object('id', r.id, 'name', r.name) END AS role,
              (p.owner_id = u.id) AS is_owner, m.joined_at
       FROM project_members m
       JOIN users u ON u.id = m.user_id
       JOIN projects p ON p.id = m.project_id
       LEFT JOIN project_roles r ON r.id = m.role_id
       WHERE m.project_id = $1
       ORDER BY (p.owner_id = u.id) DESC, m.joined_at`,
      [projectId],
    );
    return rows.map((r) => ({
      user: { ...r.user, isOnline: hub.isOnline(r.user.id) },
      role: r.role,
      isOwner: r.is_owner,
      joinedAt: iso(r.joined_at)!,
    }));
  },

  async getDetail(id: number, viewerId?: number): Promise<ProjectDetail> {
    const card = await this.getCard(id);
    const members = await this.getMembers(id);
    let viewer: ProjectDetail['viewer'] = null;
    if (viewerId) {
      const application = await queryOne<{ id: number; status: string; roleId: number | null }>(
        `SELECT id, status, role_id AS "roleId" FROM applications
         WHERE project_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1`,
        [id, viewerId],
      );
      const invitation = await queryOne<{ id: number; status: string; roleId: number | null }>(
        `SELECT id, status, role_id AS "roleId" FROM invitations
         WHERE project_id = $1 AND receiver_id = $2 AND status = 'pending' ORDER BY created_at DESC LIMIT 1`,
        [id, viewerId],
      );
      viewer = {
        isOwner: card.owner.id === viewerId,
        isMember: members.some((m) => m.user.id === viewerId),
        application,
        invitation,
      };
    }
    return { ...card, members, viewer };
  },

  async create(ownerId: number, input: {
    name: string;
    description: string;
    category: string;
    image?: string | null;
    status: string;
    roles: RoleInput[];
  }) {
    const projectId = await withTransaction(async (client) => {
      const project = await queryOne<{ id: number }>(
        `INSERT INTO projects (owner_id, name, description, category, image, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [ownerId, input.name, input.description, input.category, input.image ?? null, input.status],
        client,
      );
      // Owner automatically becomes a member.
      await query('INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)', [project!.id, ownerId], client);
      for (const role of input.roles) await insertRole(project!.id, role, client);
      return project!.id;
    });
    hub.addMembership(ownerId, projectId);
    return this.getDetail(projectId, ownerId);
  },

  async update(id: number, userId: number, input: {
    name?: string;
    description?: string;
    category?: string;
    image?: string | null;
    status?: string;
    progress?: number;
    roles?: RoleInput[];
  }) {
    await this.assertOwner(id, userId);
    await withTransaction(async (client) => {
      const fields: Record<string, unknown> = {
        name: input.name,
        description: input.description,
        category: input.category,
        image: input.image,
        status: input.status,
        progress: input.progress,
      };
      const sets: string[] = [];
      const values: unknown[] = [];
      for (const [column, value] of Object.entries(fields)) {
        if (value === undefined) continue;
        values.push(value);
        sets.push(`${column} = $${values.length}`);
      }
      values.push(id);
      await query(
        `UPDATE projects SET ${[...sets, 'updated_at = NOW()'].join(', ')} WHERE id = $${values.length}`,
        values,
        client,
      );

      if (input.roles) {
        // Roles with an id are updated in place (members keep their role); the rest are created;
        // roles missing from the payload are deleted (their members stay, with no role).
        const existing = await query<{ id: number }>('SELECT id FROM project_roles WHERE project_id = $1', [id], client);
        const existingIds = new Set(existing.map((r) => r.id));
        const keptIds = new Set<number>();
        for (const role of input.roles) {
          if (role.id && existingIds.has(role.id)) {
            keptIds.add(role.id);
            await query(
              'UPDATE project_roles SET name = $1, description = $2, required_count = $3 WHERE id = $4',
              [role.name, role.description ?? null, role.requiredCount, role.id],
              client,
            );
            await setRoleSkills(role.id, role.skills, client);
          } else if (role.id) {
            throw badRequest(`Role ${role.id} does not belong to this project.`);
          } else {
            await insertRole(id, role, client);
          }
        }
        const toDelete = [...existingIds].filter((rid) => !keptIds.has(rid));
        if (toDelete.length) await query('DELETE FROM project_roles WHERE id = ANY($1::int[])', [toDelete], client);
      }
    });
    return this.getDetail(id, userId);
  },

  async remove(id: number, userId: number) {
    await this.assertOwner(id, userId);
    const members = await query<{ user_id: number }>('SELECT user_id FROM project_members WHERE project_id = $1', [id]);
    await query('DELETE FROM projects WHERE id = $1', [id]);
    for (const m of members) hub.removeMembership(m.user_id, id);
  },

  // ---- permission helpers ----

  async getOwnerId(projectId: number, client: Queryable = pool): Promise<number> {
    const row = await queryOne<{ owner_id: number }>('SELECT owner_id FROM projects WHERE id = $1', [projectId], client);
    if (!row) throw notFound('Project not found.');
    return row.owner_id;
  },

  async assertOwner(projectId: number, userId: number, client: Queryable = pool) {
    const ownerId = await this.getOwnerId(projectId, client);
    if (ownerId !== userId) throw forbidden('Only the project owner can do this.');
  },

  async isMember(projectId: number, userId: number, client: Queryable = pool): Promise<boolean> {
    const row = await queryOne(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId],
      client,
    );
    return row !== null;
  },

  async assertMember(projectId: number, userId: number) {
    await this.getOwnerId(projectId); // 404 when the project doesn't exist
    if (!(await this.isMember(projectId, userId))) throw forbidden('Only team members can access this.');
  },

  async memberProjectIds(userId: number): Promise<number[]> {
    const rows = await query<{ project_id: number }>('SELECT project_id FROM project_members WHERE user_id = $1', [
      userId,
    ]);
    return rows.map((r) => r.project_id);
  },

  /** Throws unless the role belongs to the project and still has an open seat. */
  async assertRoleOpen(projectId: number, roleId: number, client: Queryable = pool) {
    const role = await queryOne<{ required_count: number; filled: number }>(
      `SELECT r.required_count, (SELECT COUNT(*) FROM project_members m WHERE m.role_id = r.id)::int AS filled
       FROM project_roles r WHERE r.id = $1 AND r.project_id = $2`,
      [roleId, projectId],
      client,
    );
    if (!role) throw badRequest('This role does not belong to the project.');
    if (role.filled >= role.required_count) throw badRequest('This role is already filled.');
  },
};
