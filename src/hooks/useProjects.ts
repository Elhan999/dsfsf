'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { applicationsService } from '@/services/applications.service';
import { projectsService } from '@/services/projects.service';
import type { ProjectFilters, ProjectInput } from '@/types/api';

export function useProjects(filters: ProjectFilters = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.projectList(filters),
    queryFn: () => projectsService.list(filters),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useProject(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.project(id ?? 0),
    queryFn: () => projectsService.getById(id!),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories, queryFn: projectsService.categories, staleTime: 5 * 60_000 });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) => projectsService.create(input),
    onSuccess: (project) => {
      qc.setQueryData(queryKeys.project(project.id), project);
      qc.invalidateQueries({ queryKey: queryKeys.projects });
      qc.invalidateQueries({ queryKey: queryKeys.me });
      qc.invalidateQueries({ queryKey: queryKeys.recommendations });
    },
  });
}

export function useUpdateProject(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ProjectInput>) => projectsService.update(id, input),
    onSuccess: (project) => {
      qc.setQueryData(queryKeys.project(id), project);
      qc.invalidateQueries({ queryKey: queryKeys.projects });
      qc.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectsService.remove(id),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: queryKeys.project(id) });
      qc.removeQueries({ queryKey: queryKeys.team(id) });
      qc.invalidateQueries({ queryKey: queryKeys.projects });
      qc.invalidateQueries({ queryKey: queryKeys.me });
      qc.invalidateQueries({ queryKey: queryKeys.applications });
    },
  });
}

export function useApplyToProject(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { roleId: number | null; message?: string }) => applicationsService.apply(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.myApplications('sent') });
    },
  });
}
