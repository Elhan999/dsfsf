'use client';

import { SkillPicker } from '@/components/ui/SkillPicker';
import { useAddSkill, useRemoveSkill } from '@/hooks/useUsers';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/api';
import type { Skill } from '@/types/api';

/** Each add/remove is saved immediately through the API. */
export function SkillsEditor({ skills }: { skills: Skill[] }) {
  const add = useAddSkill();
  const remove = useRemoveSkill();
  const { error } = useToast();

  const onChange = async (next: string[]) => {
    const current = new Set(skills.map((s) => s.name));
    const added = next.filter((n) => !current.has(n));
    const removed = skills.filter((s) => !next.includes(s.name));
    try {
      await Promise.all([...added.map((n) => add.mutateAsync(n)), ...removed.map((s) => remove.mutateAsync(s.id))]);
    } catch (e) {
      error('Could not update skills', getErrorMessage(e));
    }
  };

  return (
    <SkillPicker
      value={skills.map((s) => s.name)}
      onChange={onChange}
      placeholder="Type a skill and press Enter — React, Figma, PostgreSQL…"
      max={30}
    />
  );
}
