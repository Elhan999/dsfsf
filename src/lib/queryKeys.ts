import type { ProjectFilters, UserFilters } from '@/types/api';

export const queryKeys = {
  me: ['me'] as const,
  recommendations: ['recommendations'] as const,
  skills: (search?: string) => ['skills', search ?? ''] as const,

  projects: ['projects'] as const,
  projectList: (filters: ProjectFilters) => ['projects', 'list', filters] as const,
  project: (id: number) => ['projects', 'detail', id] as const,
  categories: ['projects', 'categories'] as const,

  users: ['users'] as const,
  userList: (filters: UserFilters) => ['users', 'list', filters] as const,
  user: (id: number) => ['users', 'detail', id] as const,

  applications: ['applications'] as const,
  myApplications: (type: 'sent' | 'received') => ['applications', 'me', type] as const,
  projectApplications: (projectId: number) => ['applications', 'project', projectId] as const,
  invitations: ['invitations'] as const,
  myInvitations: (type: 'sent' | 'received') => ['invitations', type] as const,

  notifications: ['notifications'] as const,
  unreadCount: ['notifications', 'unread'] as const,

  team: (projectId: number) => ['team', projectId] as const,
  teamMembers: (projectId: number) => ['team', projectId, 'members'] as const,
  teamMessages: (projectId: number) => ['team', projectId, 'messages'] as const,
};
