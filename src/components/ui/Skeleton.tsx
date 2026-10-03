import { CSSProperties } from 'react';
import { cx } from '@/lib/format';
import styles from './Skeleton.module.scss';

export function Skeleton({ width, height = 14, radius, className, style }: {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  style?: CSSProperties;
}) {
  return <span className={cx(styles.skeleton, className)} style={{ width, height, borderRadius: radius, ...style }} aria-hidden />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className={styles.lines}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}
