import { query, queryOne, withTransaction } from '../db/pool';
import { badRequest, conflict, forbidden, isUniqueViolation, notFound } from '../utils/errors';
import { hub } from '../websocket/hub';
import { iso, UserSummary, userSummaryJson } from './mappers';
import { notificationsService } from './notifications.service';
import { projectsService } from './projects.service';

export interface Invitation {
  id: number;
  status: 'pending' | 'accepted' | 'rejected';
  project: { id: number; name: string; image: string | null; description: string };
  role: { id: number; name: string } | null;
  sender: UserSummary;
  receiver: UserSummary;
  createdAt: string;
}

const INVITATION_SELECT = `
  SELECT i.id, i.status, i.created_at,
    json_build_object('id', p.id, 'name', p.name, 'image', p.image, 'description', p.description) AS project,
    CASE WHEN r.id IS NULL THEN NULL ELSE json_build_object('id', r.id, 'name', r.name) END AS role,
    ${userSummaryJson('s')} AS sender,
    ${userSummaryJson('rc')} AS receiver
  FROM invitations i
  JOIN projects p ON p.id = i.project_id
  JOIN users s ON s.id = i.sender_id
  JOIN users rc ON rc.id = i.receiver_id
  LEFT JOIN project_roles r ON r.id = i.role_id`;

interface InvitationRow extends Omit<Invitation, 'createdAt'> {
  created_at: Date;
}

const toInvitation = ({ created_at, ...rest }: InvitationRow): Invitation => ({ ...rest, createdAt: iso(created_at)! });

async function getOne(id: number) {
  const row = await queryOne<InvitationRow>(`${INVITATION_SELECT} WHERE i.id = $1`, [id]);
  if (!row) throw notFound('Invitation not found.');
  return toInvitation(row);
}

export const invitationsService = {
  async create(projectId: number, senderId: number, input: { userId: number; roleId?: number | null }) {
    await projectsService.assertOwner(projectId, senderId);
    if (input.userId === senderId) throw badRequest('You cannot invite yourself.');
    const receiver = await queryOne('SELECT id FROM users WHERE id = $1', [input.userId]);
    if (!receiver) throw notFound('User not found.');
    if (await projectsService.isMember(projectId, input.userId)) throw conflict('This user is already on the team.');
    if (input.roleId) await projectsService.assertRoleOpen(projectId, input.roleId);

    let id: number;
    try {
      const row = await queryOne<{ id: number }>(
        `INSERT INTO invitations (project_id, sender_id, receiver_id, role_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [projectId, senderId, input.userId, input.roleId ?? null],
      );
      id = row!.id;
    } catch (error) {
      if (isUniqueViolation(error)) throw conflict('This user already has a pending invitation to this project.');
      throw error;
    }

    const invitation = await getOne(id);
    await notificationsService.create({
      userId: input.userId,
      type: 'NEW_INVITATION',
      title: `${invitation.sender.name} invited you to ${invitation.project.name}`,
      message: invitation.role ? `Role: ${invitation.role.name}` : null,
      projectId,
      actorId: senderId,
    });
    return invitation;
  },

  async list(userId: number, type: 'sent' | 'received') {
    const column = type === 'sent' ? 'i.sender_id' : 'i.receiver_id';
    const rows = await query<InvitationRow>(
      `${INVITATION_SELECT} WHERE ${column} = $1 ORDER BY (i.status = 'pending') DESC, i.created_at DESC`,
      [userId],
    );
    return rows.map(toInvitation);
  },

  async respond(id: number, userId: number, status: 'accepted' | 'rejected') {
    const invitation = await getOne(id);
    if (invitation.receiver.id !== userId) throw forbidden('Only the invited user can respond.');
    if (invitation.status !== 'pending') throw badRequest(`This invitation is already ${invitation.status}.`);
    const projectId = invitation.project.id;

    const notificationId = await withTransaction(async (client) => {
      await query('SELECT id FROM projects WHERE id = $1 FOR UPDATE', [projectId], client);
      await query('UPDATE invitations SET status = $1 WHERE id = $2', [status, id], client);
      if (status === 'accepted') {
        if (invitation.role) await projectsService.assertRoleOpen(projectId, invitation.role.id, client);
        await query(
          `INSERT INTO project_members (project_id, user_id, role_id) VALUES ($1, $2, $3)
           ON CONFLICT (project_id, user_id) DO NOTHING`,
          [projectId, userId, invitation.role?.id ?? null],
          client,
        );
        // An invite supersedes the user's own pending application.
        await query(
          `UPDATE applications SET status = 'cancelled', updated_at = NOW()
           WHERE project_id = $1 AND user_id = $2 AND status = 'pending'`,
          [projectId, userId],
          client,
        );
      }
      return notificationsService.create(
        {
          userId: invitation.sender.id,
          type: 'PROJECT_UPDATE',
          title: `${invitation.receiver.name} ${status === 'accepted' ? 'joined' : 'declined your invitation to'} ${invitation.project.name}`,
          projectId,
          actorId: userId,
        },
        client,
      );
    });

    if (status === 'accepted') hub.addMembership(userId, projectId);
    await notificationsService.push(invitation.sender.id, notificationId);
    return getOne(id);
  },
};
