import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { applicationsController } from '../controllers/applications.controller';
import { authController } from '../controllers/auth.controller';
import { invitationsController } from '../controllers/invitations.controller';
import { messagesController } from '../controllers/messages.controller';
import { notificationsController } from '../controllers/notifications.controller';
import { projectsController } from '../controllers/projects.controller';
import { recommendationsController } from '../controllers/recommendations.controller';
import { skillsController } from '../controllers/skills.controller';
import { teamController } from '../controllers/team.controller';
import { usersController } from '../controllers/users.controller';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { aiLimiter, authLimiter } from '../middleware/rateLimit';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

// Auth
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/logout', authController.logout);
router.post('/auth/refresh', authController.refresh);
router.get('/auth/me', requireAuth, authController.me);

// Users & skills
router.get('/users', optionalAuth, usersController.list);
router.get('/users/me', requireAuth, usersController.me);
router.patch('/users/me', requireAuth, usersController.updateMe);
router.post('/users/me/skills', requireAuth, usersController.addSkill);
router.delete('/users/me/skills/:skillId', requireAuth, usersController.removeSkill);
router.get('/users/:id', usersController.getById);
router.get('/skills', skillsController.list);

// Projects
router.get('/projects', projectsController.list);
router.get('/projects/categories', projectsController.categories);
router.get('/projects/:id', optionalAuth, projectsController.getById);
router.post('/projects', requireAuth, projectsController.create);
router.patch('/projects/:id', requireAuth, projectsController.update);
router.delete('/projects/:id', requireAuth, projectsController.remove);

// Applications
router.post('/projects/:id/applications', requireAuth, applicationsController.apply);
router.get('/projects/:id/applications', requireAuth, applicationsController.listForProject);
router.get('/applications/me', requireAuth, applicationsController.listMine);
router.patch('/applications/:id', requireAuth, applicationsController.update);

// Invitations
router.post('/projects/:id/invitations', requireAuth, invitationsController.create);
router.get('/invitations', requireAuth, invitationsController.list);
router.patch('/invitations/:id', requireAuth, invitationsController.respond);

// Team
router.get('/projects/:id/members', teamController.members);
router.delete('/projects/:id/members/:userId', requireAuth, teamController.removeMember);
router.post('/projects/:id/leave', requireAuth, teamController.leave);

// Chat
router.get('/projects/:id/messages', requireAuth, messagesController.history);
router.post('/projects/:id/messages', requireAuth, messagesController.send);

// Notifications
router.get('/notifications', requireAuth, notificationsController.list);
router.get('/notifications/unread-count', requireAuth, notificationsController.unreadCount);
router.patch('/notifications/read-all', requireAuth, notificationsController.markAllRead);
router.patch('/notifications/:id/read', requireAuth, notificationsController.markRead);

// Discovery
router.get('/recommendations', requireAuth, recommendationsController.get);
router.post('/ai/match', requireAuth, aiLimiter, aiController.match);
