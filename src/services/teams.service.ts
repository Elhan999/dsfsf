import { api, unwrap } from '@/lib/api';
import type { ApiList, ChatMessage, ProjectMember } from '@/types/api';

export const teamsService = {
  members: (projectId: number) => unwrap<ProjectMember[]>(api.get(`/projects/${projectId}/members`)),
  removeMember: (projectId: number, userId: number) =>
    unwrap<{ removed: boolean }>(api.delete(`/projects/${projectId}/members/${userId}`)),
  leave: (projectId: number) => unwrap<{ left: boolean }>(api.post(`/projects/${projectId}/leave`)),
  messages: (projectId: number, page = 1, limit = 50) =>
    api.get<ApiList<ChatMessage>>(`/projects/${projectId}/messages`, { params: { page, limit } }).then((r) => r.data),
  sendMessage: (projectId: number, content: string) =>
    unwrap<ChatMessage>(api.post(`/projects/${projectId}/messages`, { content })),
};
