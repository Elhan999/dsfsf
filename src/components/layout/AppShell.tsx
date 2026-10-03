'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { FiBell, FiLogIn, FiLogOut, FiPlus } from 'react-icons/fi';
import { Avatar } from '@/components/ui/Avatar';
import { LinkButton } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useNotifications';
import { cx } from '@/lib/format';
import styles from './AppShell.module.scss';
import { ACCOUNT_NAV, isActive, MOBILE_NAV, NavItem, PRIMARY_NAV, WORKSPACE_NAV } from './nav';

function NavLink({ item, unread }: { item: NavItem; unread?: number }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link href={item.href} className={cx(styles.navLink, active && styles.active)} aria-current={active ? 'page' : undefined}>
      <Icon aria-hidden />
      <span>{item.label}</span>
      {item.badge === 'notifications' && !!unread && <span className={styles.badge}>{unread > 99 ? '99+' : unread}</span>}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, status, logout } = useAuth();
  const { data: unread = 0 } = useUnreadCount();
  const pathname = usePathname();
  const router = useRouter();
  const authed = status === 'authenticated';

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Logo />
        </div>
        {authed && (
          <LinkButton href="/projects/create" icon={<FiPlus />} block className={styles.create}>
            New project
          </LinkButton>
        )}
        <nav className={styles.nav} aria-label="Main">
          <div className={styles.group}>
            {PRIMARY_NAV.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
          {authed && (
            <>
              <div className={styles.group}>
                <p className={styles.groupLabel}>Workspace</p>
                {WORKSPACE_NAV.map((item) => (
                  <NavLink key={item.href} item={item} unread={unread} />
                ))}
              </div>
              <div className={styles.group}>
                <p className={styles.groupLabel}>Account</p>
                {ACCOUNT_NAV.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </>
          )}
        </nav>
        <div className={styles.footer}>
          {authed && user ? (
            <div className={styles.me}>
              <Link href="/profile" className={styles.meLink}>
                <Avatar name={user.name} src={user.avatar} size={34} online />
                <span>
                  <strong>{user.name}</strong>
                  <small>@{user.username}</small>
                </span>
              </Link>
              <button
                className={styles.logout}
                onClick={async () => {
                  await logout();
                  router.push('/');
                }}
                aria-label="Log out"
                title="Log out"
              >
                <FiLogOut />
              </button>
            </div>
          ) : (
            status === 'guest' && (
              <div className={styles.guest}>
                <LinkButton href={`/login?next=${encodeURIComponent(pathname)}`} variant="secondary" block icon={<FiLogIn />}>
                  Log in
                </LinkButton>
                <LinkButton href="/register" block>
                  Create account
                </LinkButton>
              </div>
            )
          )}
        </div>
      </aside>

      <header className={styles.topbar}>
        <Logo />
        <div className={styles.topActions}>
          {authed ? (
            <>
              <Link href="/projects/create" className={styles.topIcon} aria-label="New project">
                <FiPlus />
              </Link>
              <Link href="/notifications" className={styles.topIcon} aria-label={`Notifications (${unread} unread)`}>
                <FiBell />
                {!!unread && <span className={styles.dot} />}
              </Link>
            </>
          ) : (
            status === 'guest' && (
              <LinkButton href="/login" size="sm" variant="secondary">
                Log in
              </LinkButton>
            )
          )}
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <nav className={styles.bottomNav} aria-label="Mobile">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link key={item.href} href={item.href} className={cx(styles.bottomLink, active && styles.bottomActive)}>
              <Icon aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
