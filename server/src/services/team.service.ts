import { query, queryOne } from '../db/pool';
import { badRequest, notFound } from '../utils/errors';
import { hub } from '../websocket/hub';
import { notificationsService } from './notifications.service';
import { projectsService } from './projects.service';

export const teamService = {
  getMembers: (projectId: number) => projectsService.getOwnerId(projectId).then(() => projectsService.getMembers(projectId)),

  async removeMember(projectId: number, ownerId: number, userId: number) {
    await projectsService.assertOwner(projectId, ownerId);
    if (userId === ownerId) throw badRequest('The owner cannot be removed. Delete the project instead.');
    const removed = await query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING id', [
      projectId,
      userId,
    ]);
    if (removed.length === 0) throw notFound('This user is not a member of the project.');
    hub.removeMembership(userId, projectId);
    const project = await queryOne<{ name: string }>('SELECT name FROM projects WHERE id = $1', [projectId]);
    await notificationsService.create({
      userId,
      type: 'PROJECT_UPDATE',
      title: `You were removed from ${project!.name}`,
      projectId,
      actorId: ownerId,
    });
    hub.broadcastToRoom(projectId, { type: 'member_left', projectId, userId });
  },

  async leave(projectId: number, userId: number) {
    const ownerId = await projectsService.getOwnerId(projectId);
    if (ownerId === userId) throw badRequest('Owners cannot leave their own project. Delete it or keep leading.');
    const removed = await query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING id', [
      projectId,
      userId,
    ]);
    if (removed.length === 0) throw badRequest('You are not a member of this project.');
    hub.removeMembership(userId, projectId);
    const user = await queryOne<{ name: string }>('SELECT name FROM users WHERE id = $1', [userId]);
    const project = await queryOne<{ name: string }>('SELECT name FROM projects WHERE id = $1', [projectId]);
    await notificationsService.create({
      userId: ownerId,
      type: 'PROJECT_UPDATE',
      title: `${user!.name} left ${project!.name}`,
      projectId,
      actorId: userId,
    });
    hub.broadcastToRoom(projectId, { type: 'member_left', projectId, userId });
  },
};
