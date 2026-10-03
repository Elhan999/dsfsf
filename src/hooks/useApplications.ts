'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { applicationsService } from '@/services/applications.service';
import type { Application } from '@/types/api';

export function useApplications(type: 'sent' | 'received') {
  return useQuery({ queryKey: queryKeys.myApplications(type), queryFn: () => applicationsService.mine(type) });
}

export function useProjectApplications(projectId: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.projectApplications(projectId),
    queryFn: () => applicationsService.forProject(projectId),
    enabled,
  });
}

export function useInvitations(type: 'sent' | 'received') {
  return useQuery({ queryKey: queryKeys.myInvitations(type), queryFn: () => applicationsService.invitations(type) });
}

function useInvalidateAfterDecision() {
  const qc = useQueryClient();
  return (projectId: number) => {
    qc.invalidateQueries({ queryKey: queryKeys.applications });
    qc.invalidateQueries({ queryKey: queryKeys.invitations });
    qc.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    qc.invalidateQueries({ queryKey: queryKeys.teamMembers(projectId) });
    qc.invalidateQueries({ queryKey: queryKeys.projects });
    qc.invalidateQueries({ queryKey: queryKeys.me });
  };
}

export function useAcceptApplication() {
  const invalidate = useInvalidateAfterDecision();
  return useMutation({
    mutationFn: (application: Application) => applicationsService.update(application.id, 'accepted'),
    onSuccess: (application) => invalidate(application.project.id),
  });
}

export function useRejectApplication() {
  const invalidate = useInvalidateAfterDecision();
  return useMutation({
    mutationFn: (application: Application) => applicationsService.update(application.id, 'rejected'),
    onSuccess: (application) => invalidate(application.project.id),
  });
}

export function useCancelApplication() {
  const invalidate = useInvalidateAfterDecision();
  return useMutation({
    mutationFn: (applicationId: number) => applicationsService.update(applicationId, 'cancelled'),
    onSuccess: (application) => invalidate(application.project.id),
  });
}

export function useRespondToInvitation() {
  const invalidate = useInvalidateAfterDecision();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'accepted' | 'rejected' }) =>
      applicationsService.respondToInvitation(id, status),
    onSuccess: (invitation) => invalidate(invitation.project.id),
  });
}
