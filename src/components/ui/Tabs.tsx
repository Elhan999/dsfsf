'use client';

import { ReactNode } from 'react';
import { cx } from '@/lib/format';
import styles from './Tabs.module.scss';

interface Tab<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  count?: number;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: Tab<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cx(styles.tabs, className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          type="button"
          aria-selected={tab.value === value}
          className={cx(styles.tab, tab.value === value && styles.active)}
          onClick={() => onChange(tab.value)}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && <span className={styles.count}>{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}
