'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { applicationsService } from '@/services/applications.service';
import { usersService } from '@/services/users.service';
import type { ProfileInput, UserFilters, UserProfile } from '@/types/api';
import { useAuth } from './useAuth';

export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: queryKeys.userList(filters),
    queryFn: () => usersService.list(filters),
    placeholderData: keepPreviousData,
  });
}

/** Own profile when no id is given; another user's public profile otherwise. */
export function useProfile(id?: number) {
  const { status } = useAuth();
  return useQuery<UserProfile>({
    queryKey: id ? queryKeys.user(id) : queryKeys.me,
    queryFn: () => (id ? usersService.getById(id) : usersService.me()),
    enabled: id ? true : status === 'authenticated',
  });
}

export function useRecommendations() {
  return useQuery({ queryKey: queryKeys.recommendations, queryFn: usersService.recommendations });
}

export function useSkills(search?: string) {
  return useQuery({
    queryKey: queryKeys.skills(search),
    queryFn: () => usersService.skills(search),
    staleTime: 5 * 60_000,
  });
}

function useInvalidateMe() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.me });
    qc.invalidateQueries({ queryKey: queryKeys.users });
    qc.invalidateQueries({ queryKey: queryKeys.recommendations });
  };
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const invalidate = useInvalidateMe();
  return useMutation({
    mutationFn: (input: ProfileInput) => usersService.updateMe(input),
    onSuccess: (profile) => {
      qc.setQueryData(queryKeys.me, profile);
      invalidate();
    },
  });
}

export function useAddSkill() {
  const invalidate = useInvalidateMe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => usersService.addSkill(name),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

export function useRemoveSkill() {
  const invalidate = useInvalidateMe();
  return useMutation({ mutationFn: (skillId: number) => usersService.removeSkill(skillId), onSuccess: invalidate });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, userId, roleId }: { projectId: number; userId: number; roleId: number | null }) =>
      applicationsService.invite(projectId, { userId, roleId }),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.invitations });
      qc.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
  });
}
