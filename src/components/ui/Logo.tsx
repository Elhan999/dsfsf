import Link from 'next/link';
import styles from './Logo.module.scss';

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className={styles.logo} aria-label="Team Finder home">
      <span className={styles.mark} aria-hidden>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <circle cx="8" cy="9" r="3.2" fill="currentColor" />
          <circle cx="16" cy="9" r="3.2" fill="currentColor" opacity="0.6" />
          <path d="M3 19c.8-3 3-4.6 5-4.6s4.2 1.6 5 4.6M11 19c.8-3 3-4.6 5-4.6s4.2 1.6 5 4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      Team Finder
    </Link>
  );
}
