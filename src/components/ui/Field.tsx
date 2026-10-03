import { forwardRef, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, useId } from 'react';
import { cx } from '@/lib/format';
import styles from './Field.module.scss';

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  children: (id: string) => ReactNode;
  className?: string;
}

export function Field({ label, hint, error, children, className }: FieldProps) {
  const id = useId();
  return (
    <div className={cx(styles.field, className)}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      {children(id)}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : (
        hint && <p className={styles.hint}>{hint}</p>
      )}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, icon, className, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(id) => (
        <div className={cx(styles.control, !!icon && styles.withIcon, error && styles.invalid)}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <input ref={ref} id={id} aria-invalid={!!error || undefined} {...rest} />
        </div>
      )}
    </Field>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string; error?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(id) => (
        <div className={cx(styles.control, styles.textarea, error && styles.invalid)}>
          <textarea ref={ref} id={id} aria-invalid={!!error || undefined} {...rest} />
        </div>
      )}
    </Field>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; hint?: string; error?: string };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, children, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(id) => (
        <div className={cx(styles.control, styles.select, error && styles.invalid)}>
          <select ref={ref} id={id} aria-invalid={!!error || undefined} {...rest}>
            {children}
          </select>
        </div>
      )}
    </Field>
  );
});
