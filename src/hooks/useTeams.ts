'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { queryKeys } from '@/lib/queryKeys';
import { teamsService } from '@/services/teams.service';

export function useTeamMembers(projectId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.teamMembers(projectId ?? 0),
    queryFn: () => teamsService.members(projectId!),
    enabled: !!projectId,
  });
}

export function useRemoveMember(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => teamsService.removeMember(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teamMembers(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useLeaveTeam(projectId: number) {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => teamsService.leave(projectId),
    onSuccess: () => {
      qc.removeQueries({ queryKey: queryKeys.team(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.projects });
      qc.invalidateQueries({ queryKey: queryKeys.me });
      router.push('/teams');
    },
  });
}
