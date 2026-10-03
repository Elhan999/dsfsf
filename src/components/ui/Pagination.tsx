import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import type { Pagination as PaginationData } from '@/types/api';
import { IconButton } from './Button';
import styles from './Pagination.module.scss';

export function Pagination({ pagination, onChange }: { pagination: PaginationData; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  if (pages <= 1) return null;
  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <IconButton label="Previous page" disabled={pagination.page <= 1} onClick={() => onChange(pagination.page - 1)}>
        <FiChevronLeft />
      </IconButton>
      <span>
        Page <strong>{pagination.page}</strong> of {pages}
      </span>
      <IconButton label="Next page" disabled={pagination.page >= pages} onClick={() => onChange(pagination.page + 1)}>
        <FiChevronRight />
      </IconButton>
    </nav>
  );
}
