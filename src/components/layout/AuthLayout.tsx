import { ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';
import styles from './AuthLayout.module.scss';

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.glow} aria-hidden />
      <div className={styles.card}>
        <Logo />
        <div className={styles.head}>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
        <p className={styles.footer}>{footer}</p>
      </div>
    </div>
  );
}
