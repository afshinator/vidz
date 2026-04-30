import { formatDistanceToNow } from 'date-fns';

const DEFAULT_TIMEZONE = 'America/Los_Angeles';

export function formatRelativeTime(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}


export const TIMEZONES = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', abbr: 'PST/PDT' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', abbr: 'MST/MDT' },
  { value: 'America/Chicago', label: 'Central Time (CT)', abbr: 'CST/CDT' },
  { value: 'America/New_York', label: 'Eastern Time (ET)', abbr: 'EST/EDT' },
  { value: 'Europe/London', label: 'London (GMT/BST)', abbr: 'GMT/BST' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', abbr: 'CET/CEST' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', abbr: 'JST' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', abbr: 'CST' },
] as const;