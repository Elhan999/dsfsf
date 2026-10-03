'use client';

import { KeyboardEvent, useId, useMemo, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useSkills } from '@/hooks/useUsers';
import { SkillTag } from './Badge';
import styles from './SkillPicker.module.scss';

interface SkillPickerProps {
  value: string[];
  onChange: (skills: string[]) => void;
  label?: string;
  placeholder?: string;
  max?: number;
  /** Only allow skills that already exist (used for filters). */
  existingOnly?: boolean;
}

export function SkillPicker({ value, onChange, label, placeholder = 'Add a skill…', max = 15, existingOnly }: SkillPickerProps) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const { data: allSkills = [] } = useSkills();
  const listId = useId();
  const selected = useMemo(() => new Set(value.map((v) => v.toLowerCase())), [value]);

  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    return allSkills
      .filter((s) => !selected.has(s.name.toLowerCase()) && (!q || s.name.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [allSkills, input, selected]);

  const add = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || selected.has(trimmed.toLowerCase()) || value.length >= max) return;
    const canonical = allSkills.find((s) => s.name.toLowerCase() === trimmed.toLowerCase())?.name;
    if (existingOnly && !canonical) return;
    onChange([...value, canonical ?? trimmed]);
    setInput('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      // Prefer an exact match, then the typed text (new skill), then the top suggestion.
      const exact = suggestions.find((s) => s.name.toLowerCase() === input.trim().toLowerCase());
      add(exact?.name ?? (input.trim() && !existingOnly ? input : (suggestions[0]?.name ?? '')));
    } else if (e.key === 'Backspace' && !input && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const exactExists = allSkills.some((s) => s.name.toLowerCase() === input.trim().toLowerCase());

  return (
    <div className={styles.picker}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.control} onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
        {value.map((skill) => (
          <SkillTag key={skill} onRemove={() => onChange(value.filter((v) => v !== skill))}>
            {skill}
          </SkillTag>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={value.length ? '' : placeholder}
          aria-label={label ?? placeholder}
          aria-controls={listId}
          disabled={value.length >= max}
        />
      </div>
      {focused && (suggestions.length > 0 || (input.trim() && !exactExists && !existingOnly)) && (
        <ul className={styles.menu} id={listId} role="listbox">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(s.name)}>
                {s.name}
              </button>
            </li>
          ))}
          {input.trim() && !exactExists && !existingOnly && (
            <li>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(input)}>
                <FiPlus aria-hidden /> Add “{input.trim()}”
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
