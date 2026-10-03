import { IconType } from 'react-icons';
import {
  FiBell,
  FiCompass,
  FiCpu,
  FiFolder,
  FiHome,
  FiInbox,
  FiMessageSquare,
  FiSettings,
  FiUser,
  FiUsers,
} from 'react-icons/fi';

export interface NavItem {
  href: string;
  label: string;
  icon: IconType;
  badge?: 'notifications';
}

export const PRIMARY_NAV: NavItem[] = [
  { href: '/', label: 'Home', icon: FiHome },
  { href: '/discover', label: 'Discover', icon: FiCompass },
  { href: '/projects', label: 'Projects', icon: FiFolder },
  { href: '/teammates', label: 'Teammates', icon: FiUsers },
  { href: '/ai-match', label: 'AI Matching', icon: FiCpu },
];

export const WORKSPACE_NAV: NavItem[] = [
  { href: '/teams', label: 'My teams', icon: FiUsers },
  { href: '/messages', label: 'Messages', icon: FiMessageSquare },
  { href: '/applications', label: 'Applications', icon: FiInbox },
  { href: '/notifications', label: 'Notifications', icon: FiBell, badge: 'notifications' },
];

export const ACCOUNT_NAV: NavItem[] = [
  { href: '/profile', label: 'Profile', icon: FiUser },
  { href: '/settings', label: 'Settings', icon: FiSettings },
];

export const MOBILE_NAV: NavItem[] = [
  { href: '/', label: 'Home', icon: FiHome },
  { href: '/discover', label: 'Discover', icon: FiCompass },
  { href: '/teams', label: 'Teams', icon: FiUsers },
  { href: '/messages', label: 'Messages', icon: FiMessageSquare },
  { href: '/profile', label: 'Profile', icon: FiUser },
];

export function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
