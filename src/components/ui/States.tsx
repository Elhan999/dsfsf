import { ReactNode } from 'react';
import { FiAlertTriangle, FiInbox } from 'react-icons/fi';
import { getErrorMessage } from '@/lib/api';
import { Button } from './Button';
import styles from './States.module.scss';

export function EmptyState({
  icon = <FiInbox />,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.state}>
      <div className={styles.icon}>{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong.' }: { error?: unknown; onRetry?: () => void; title?: string }) {
  return (
    <div className={styles.state} role="alert">
      <div className={`${styles.icon} ${styles.danger}`}>
        <FiAlertTriangle />
      </div>
      <h3>{title}</h3>
      <p>{error ? getErrorMessage(error, 'Try again.') : 'Try again.'}</p>
      {onRetry && (
        <div className={styles.action}>
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

export function LoadingLabel({ children }: { children: ReactNode }) {
  return (
    <p className={styles.loading} role="status">
      {children}
    </p>
  );
}
