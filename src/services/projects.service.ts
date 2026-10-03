import { api, unwrap } from '@/lib/api';
import type { ApiList, Project, ProjectDetail, ProjectFilters, ProjectInput } from '@/types/api';

const toParams = (f: ProjectFilters) => ({ ...f, skills: f.skills?.length ? f.skills.join(',') : undefined });

export const projectsService = {
  list: (filters: ProjectFilters) =>
    api.get<ApiList<Project>>('/projects', { params: toParams(filters) }).then((r) => r.data),
  categories: () => unwrap<string[]>(api.get('/projects/categories')),
  getById: (id: number) => unwrap<ProjectDetail>(api.get(`/projects/${id}`)),
  create: (input: ProjectInput) => unwrap<ProjectDetail>(api.post('/projects', input)),
  update: (id: number, input: Partial<ProjectInput>) => unwrap<ProjectDetail>(api.patch(`/projects/${id}`, input)),
  remove: (id: number) => unwrap<{ deleted: boolean }>(api.delete(`/projects/${id}`)),
};
