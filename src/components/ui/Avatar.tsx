import { cx, initials } from '@/lib/format';
import styles from './Avatar.module.scss';

const GRADIENTS = [
  ['#5b6bff', '#8b5cf6'],
  ['#0ea5e9', '#6366f1'],
  ['#14b8a6', '#0ea5e9'],
  ['#f43f5e', '#8b5cf6'],
  ['#f59e0b', '#ef4444'],
  ['#22c55e', '#14b8a6'],
];

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  online?: boolean;
  className?: string;
}

export function Avatar({ name, src, size = 40, online, className }: AvatarProps) {
  const [from, to] = GRADIENTS[name.length % GRADIENTS.length];
  return (
    <span className={cx(styles.avatar, className)} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} />
      ) : (
        <span className={styles.fallback} style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} aria-hidden>
          {initials(name)}
        </span>
      )}
      {online !== undefined && (
        <span
          className={cx(styles.status, online && styles.online)}
          style={{ width: Math.max(8, size * 0.26), height: Math.max(8, size * 0.26) }}
          aria-label={online ? 'Online' : 'Offline'}
        />
      )}
    </span>
  );
}
