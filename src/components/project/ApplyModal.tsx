'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FiSend } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useApplyToProject } from '@/hooks/useProjects';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/api';
import { applySchema, ApplyValues } from '@/schemas/application';
import type { ProjectDetail } from '@/types/api';

export function ApplyModal({ project, open, onClose }: { project: ProjectDetail; open: boolean; onClose: () => void }) {
  const openRoles = project.roles.filter((r) => r.filledCount < r.requiredCount);
  const apply = useApplyToProject(project.id);
  const { success } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ApplyValues>({
    resolver: zodResolver(applySchema),
    defaultValues: { roleId: openRoles.length === 1 ? String(openRoles[0].id) : openRoles.length ? '' : 'any', message: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await apply.mutateAsync({
        roleId: values.roleId === 'any' ? null : Number(values.roleId),
        message: values.message || undefined,
      });
      success('Application sent', `${project.owner.name} will be notified.`);
      reset();
      onClose();
    } catch (error) {
      setError('root', { message: getErrorMessage(error) });
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Join ${project.name}`}
      description="Tell the owner which role you want and why you're a good fit."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={apply.isPending} icon={<FiSend />}>
            Send application
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} style={{ display: 'contents' }}>
        <Select label="Select role" error={errors.roleId?.message} {...register('roleId')}>
          {openRoles.length > 0 ? (
            <>
              <option value="" disabled>
                Choose a role…
              </option>
              {openRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.requiredCount - r.filledCount} open)
                </option>
              ))}
            </>
          ) : (
            <option value="any">Any role</option>
          )}
        </Select>
        <Textarea
          label="Message"
          placeholder="Hi! I'd love to help with… Here's what I've built before…"
          rows={5}
          error={errors.message?.message}
          {...register('message')}
        />
        {errors.root && (
          <p role="alert" style={{ color: '#fb7185', fontSize: 14 }}>
            {errors.root.message}
          </p>
        )}
      </form>
    </Modal>
  );
}
