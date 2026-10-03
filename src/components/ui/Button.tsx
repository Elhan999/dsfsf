import Link from 'next/link';
import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cx } from '@/lib/format';
import styles from './Button.module.scss';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  block?: boolean;
  loading?: boolean;
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, iconRight, block, loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx(styles.button, styles[variant], styles[size], block && styles.block, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-hidden /> : icon}
      {children && <span>{children}</span>}
      {iconRight}
    </button>
  );
});

type LinkButtonProps = CommonProps & { href: string; children?: ReactNode; className?: string; target?: string };

export function LinkButton({ variant = 'primary', size = 'md', icon, iconRight, block, className, children, href, target }: LinkButtonProps) {
  return (
    <Link
      href={href}
      target={target}
      className={cx(styles.button, styles[variant], styles[size], block && styles.block, className)}
    >
      {icon}
      {children && <span>{children}</span>}
      {iconRight}
    </Link>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button className={cx(styles.iconButton, className)} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}
