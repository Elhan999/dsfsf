import { query, queryOne, withTransaction } from '../db/pool';
import { badRequest, conflict, forbidden, isUniqueViolation, notFound } from '../utils/errors';
import { hub } from '../websocket/hub';
import { iso, UserSummary, userSummaryJson, userSkillsJson } from './mappers';
import { notificationsService } from './notifications.service';
import { projectsService } from './projects.service';
import { Skill } from './skills.service';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface Application {
  id: number;
  status: ApplicationStatus;
  message: string | null;
  project: { id: number; name: string; image: string | null; ownerId: number };
  role: { id: number; name: string } | null;
  user: UserSummary & { skills: Skill[] };
  createdAt: string;
  updatedAt: string;
}

const APPLICATION_SELECT = `
  SELECT a.id, a.status, a.message, a.created_at, a.updated_at,
    json_build_object('id', p.id, 'name', p.name, 'image', p.image, 'ownerId', p.owner_id) AS project,
    CASE WHEN r.id IS NULL THEN NULL ELSE json_build_object('id', r.id, 'name', r.name) END AS role,
    (${userSummaryJson('u')}::jsonb || jsonb_build_object('skills', ${userSkillsJson('u')})) AS user
  FROM applications a
  JOIN projects p ON p.id = a.project_id
  JOIN users u ON u.id = a.user_id
  LEFT JOIN project_roles r ON r.id = a.role_id`;

interface ApplicationRow {
  id: number;
  status: ApplicationStatus;
  message: string | null;
  created_at: Date;
  updated_at: Date;
  project: Application['project'];
  role: Application['role'];
  user: Application['user'];
}

const toApplication = (r: ApplicationRow): Application => ({
  id: r.id,
  status: r.status,
  message: r.message,
  project: r.project,
  role: r.role,
  user: r.user,
  createdAt: iso(r.created_at)!,
  updatedAt: iso(r.updated_at)!,
});

async function getOne(id: number): Promise<Application> {
  const row = await queryOne<ApplicationRow>(`${APPLICATION_SELECT} WHERE a.id = $1`, [id]);
  if (!row) throw notFound('Application not found.');
  return toApplication(row);
}

export const applicationsService = {
  async apply(projectId: number, userId: number, input: { roleId?: number | null; message?: string | null }) {
    const project = await queryOne<{ owner_id: number; status: string; name: string }>(
      'SELECT owner_id, status, name FROM projects WHERE id = $1',
      [projectId],
    );
    if (!project) throw notFound('Project not found.');
    if (project.owner_id === userId) throw badRequest('You own this project.');
    if (project.status !== 'recruiting') throw badRequest('This project is not recruiting right now.');
    if (await projectsService.isMember(projectId, userId)) throw conflict('You are already a member of this team.');
    if (input.roleId) await projectsService.assertRoleOpen(projectId, input.roleId);

    let id: number;
    try {
      const row = await queryOne<{ id: number }>(
        `INSERT INTO applications (project_id, user_id, role_id, message)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [projectId, userId, input.roleId ?? null, input.message ?? null],
      );
      id = row!.id;
    } catch (error) {
      if (isUniqueViolation(error)) throw conflict('You already applied to this project.');
      throw error;
    }

    const application = await getOne(id);
    await notificationsService.create({
      userId: project.owner_id,
      type: 'NEW_APPLICATION',
      title: `New application to ${project.name}`,
      message: `${application.user.name} applied${application.role ? ` as ${application.role.name}` : ''}.`,
      projectId,
      actorId: userId,
    });
    return application;
  },

  async listForProject(projectId: number, viewerId: number, status?: ApplicationStatus) {
    await projectsService.assertOwner(projectId, viewerId);
    const rows = await query<ApplicationRow>(
      `${APPLICATION_SELECT} WHERE a.project_id = $1 ${status ? 'AND a.status = $2' : ''} ORDER BY a.created_at DESC`,
      status ? [projectId, status] : [projectId],
    );
    return rows.map(toApplication);
  },

  /** sent = my applications; received = applications to projects I own. */
  async listMine(userId: number, type: 'sent' | 'received', status?: ApplicationStatus) {
    const condition = type === 'sent' ? 'a.user_id = $1' : 'p.owner_id = $1';
    const rows = await query<ApplicationRow>(
      `${APPLICATION_SELECT} WHERE ${condition} ${status ? 'AND a.status = $2' : ''} ORDER BY a.created_at DESC`,
      status ? [userId, status] : [userId],
    );
    return rows.map(toApplication);
  },

  async updateStatus(id: number, actorId: number, status: 'accepted' | 'rejected' | 'cancelled') {
    const application = await getOne(id);
    if (application.status !== 'pending') throw badRequest(`This application is already ${application.status}.`);

    if (status === 'cancelled') {
      if (application.user.id !== actorId) throw forbidden('Only the applicant can cancel an application.');
      await query(`UPDATE applications SET status = 'cancelled', updated_at = NOW() WHERE id = $1`, [id]);
      return getOne(id);
    }

    if (application.project.ownerId !== actorId) {
      throw forbidden('Only the project owner can accept or reject applications.');
    }

    const projectId = application.project.id;
    const notificationId = await withTransaction(async (client) => {
      // Lock the project row so two concurrent accepts cannot overfill a role.
      await query('SELECT id FROM projects WHERE id = $1 FOR UPDATE', [projectId], client);
      await query('UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2', [status, id], client);

      if (status === 'accepted') {
        if (application.role) await projectsService.assertRoleOpen(projectId, application.role.id, client);
        await query(
          `INSERT INTO project_members (project_id, user_id, role_id) VALUES ($1, $2, $3)
           ON CONFLICT (project_id, user_id) DO NOTHING`,
          [projectId, application.user.id, application.role?.id ?? null],
          client,
        );
        // Any pending invitation to the same project is now moot.
        await query(
          `UPDATE invitations SET status = 'accepted' WHERE project_id = $1 AND receiver_id = $2 AND status = 'pending'`,
          [projectId, application.user.id],
          client,
        );
      }

      return notificationsService.create(
        {
          userId: application.user.id,
          type: status === 'accepted' ? 'APPLICATION_ACCEPTED' : 'APPLICATION_REJECTED',
          title:
            status === 'accepted'
              ? `You joined ${application.project.name}`
              : `Your application to ${application.project.name} was declined`,
          message:
            status === 'accepted'
              ? `Welcome to the team${application.role ? ` as ${application.role.name}` : ''}! Open the team workspace to say hi.`
              : 'Keep going — there are plenty of other projects looking for people like you.',
          projectId,
          actorId,
        },
        client,
      );
    });

    if (status === 'accepted') hub.addMembership(application.user.id, projectId);
    await notificationsService.push(application.user.id, notificationId);
    return getOne(id);
  },
};
