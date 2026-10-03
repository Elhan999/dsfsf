const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function timeAgo(iso: string): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return 'just now';
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
  if (abs < 86400 * 7) return rtf.format(Math.round(seconds / 86400), 'day');
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const STATUS_LABEL: Record<string, string> = {
  recruiting: 'Recruiting',
  active: 'Active',
  completed: 'Completed',
  closed: 'Closed',
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const AVAILABILITY_LABEL: Record<string, string> = {
  available: 'Available',
  part_time: 'Part-time',
  busy: 'Busy',
};

export const EXPERIENCE_LABEL: Record<string, string> = {
  junior: 'Junior',
  middle: 'Middle',
  senior: 'Senior',
  lead: 'Lead',
};

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');
