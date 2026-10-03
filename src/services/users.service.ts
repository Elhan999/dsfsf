import { api, unwrap } from '@/lib/api';
import type { ApiList, ProfileInput, Recommendations, Skill, UserCard, UserFilters, UserProfile } from '@/types/api';

const toParams = (f: UserFilters) => ({ ...f, skills: f.skills?.length ? f.skills.join(',') : undefined });

export const usersService = {
  list: (filters: UserFilters) => api.get<ApiList<UserCard>>('/users', { params: toParams(filters) }).then((r) => r.data),
  getById: (id: number) => unwrap<UserProfile>(api.get(`/users/${id}`)),
  me: () => unwrap<UserProfile>(api.get('/users/me')),
  updateMe: (input: ProfileInput) => unwrap<UserProfile>(api.patch('/users/me', input)),
  skills: (search?: string) => unwrap<Skill[]>(api.get('/skills', { params: { search } })),
  addSkill: (name: string) => unwrap<Skill>(api.post('/users/me/skills', { name })),
  removeSkill: (skillId: number) => unwrap<{ removed: boolean }>(api.delete(`/users/me/skills/${skillId}`)),
  recommendations: () => unwrap<Recommendations>(api.get('/recommendations')),
};
