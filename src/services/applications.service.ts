import { api, unwrap } from '@/lib/api';
import type { Application, ApplicationStatus, Invitation } from '@/types/api';

export const applicationsService = {
  apply: (projectId: number, input: { roleId: number | null; message?: string }) =>
    unwrap<Application>(api.post(`/projects/${projectId}/applications`, input)),
  forProject: (projectId: number) => unwrap<Application[]>(api.get(`/projects/${projectId}/applications`)),
  mine: (type: 'sent' | 'received') => unwrap<Application[]>(api.get('/applications/me', { params: { type } })),
  update: (id: number, status: Extract<ApplicationStatus, 'accepted' | 'rejected' | 'cancelled'>) =>
    unwrap<Application>(api.patch(`/applications/${id}`, { status })),

  invite: (projectId: number, input: { userId: number; roleId: number | null }) =>
    unwrap<Invitation>(api.post(`/projects/${projectId}/invitations`, input)),
  invitations: (type: 'sent' | 'received') => unwrap<Invitation[]>(api.get('/invitations', { params: { type } })),
  respondToInvitation: (id: number, status: 'accepted' | 'rejected') =>
    unwrap<Invitation>(api.patch(`/invitations/${id}`, { status })),
};
