'use client';

import { useEffect, useState } from 'react';
import { FiSend } from 'react-icons/fi';
import { Button, LinkButton } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useInviteUser } from '@/hooks/useUsers';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/api';
import type { UserSummary } from '@/types/api';

export function InviteModal({ user, open, onClose }: { user: UserSummary; open: boolean; onClose: () => void }) {
  const { user: me } = useAuth();
  const { data, isLoading } = useProjects({ ownerId: me?.id, limit: 100 }, { enabled: !!me });
  const invite = useInviteUser();
  const { success } = useToast();
  const projects = (data?.data ?? []).filter((p) => p.status === 'recruiting' || p.status === 'active');
  const [projectId, setProjectId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const project = projects.find((p) => String(p.id) === projectId);
  const openRoles = project?.roles.filter((r) => r.filledCount < r.requiredCount) ?? [];

  useEffect(() => {
    if (!projectId && projects.length) setProjectId(String(projects[0].id));
  }, [projects, projectId]);

  useEffect(() => setRoleId(''), [projectId]);

  const send = async () => {
    if (!project) return;
    setError(null);
    try {
      await invite.mutateAsync({ projectId: project.id, userId: user.id, roleId: roleId ? Number(roleId) : null });
      success(`Invitation sent to ${user.name}`, project.name);
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Invite ${user.name}`}
      description="They'll get a notification and can accept from their Applications page."
      footer={
        projects.length > 0 && (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={send} loading={invite.isPending} icon={<FiSend />} disabled={!project}>
              Send invitation
            </Button>
          </>
        )
      }
    >
      {isLoading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading your projects…</p>
      ) : projects.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
          <p style={{ color: 'var(--text-muted)' }}>You need a recruiting project before you can invite people.</p>
          <LinkButton href="/projects/create">Create a project</LinkButton>
        </div>
      ) : (
        <>
          <Select label="Project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select label="Role" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            <option value="">Any role</option>
            {openRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.requiredCount - r.filledCount} open)
              </option>
            ))}
          </Select>
          {error && (
            <p role="alert" style={{ color: '#fb7185', fontSize: 14 }}>
              {error}
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
