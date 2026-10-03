import styles from './Progress.module.scss';

export function Progress({ value, label }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={styles.wrap}>
      {label && (
        <div className={styles.meta}>
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className={styles.track} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        <div className={styles.bar} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
