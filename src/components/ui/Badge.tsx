import { ReactNode } from 'react';
import { cx, STATUS_LABEL } from '@/lib/format';
import styles from './Badge.module.scss';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export function Badge({ tone = 'neutral', children, dot, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cx(styles.badge, styles[tone], className)}>
      {dot && <span className={styles.dot} aria-hidden />}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  recruiting: 'accent',
  active: 'success',
  completed: 'neutral',
  closed: 'neutral',
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={STATUS_TONE[status] ?? 'neutral'} dot>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export function SkillTag({ children, matched, onRemove }: { children: ReactNode; matched?: boolean; onRemove?: () => void }) {
  return (
    <span className={cx(styles.skill, matched && styles.matched)}>
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${children}`}>
          ×
        </button>
      )}
    </span>
  );
}

export function SkillList({ skills, max, matched }: { skills: string[]; max?: number; matched?: string[] }) {
  const shown = max ? skills.slice(0, max) : skills;
  const rest = skills.length - shown.length;
  const matchedSet = new Set(matched?.map((m) => m.toLowerCase()));
  return (
    <div className={styles.skillList}>
      {shown.map((s) => (
        <SkillTag key={s} matched={matchedSet.has(s.toLowerCase())}>
          {s}
        </SkillTag>
      ))}
      {rest > 0 && <span className={styles.more}>+{rest}</span>}
    </div>
  );
}
