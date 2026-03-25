'use client';

import { formatRelativeTime } from '@/lib/utils/time';

interface TimeAgoProps {
  date: Date | string;
  className?: string;
}

export function TimeAgo({ date, className }: TimeAgoProps) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return (
    <span className={className} title={d.toLocaleString()}>
      {formatRelativeTime(d)}
    </span>
  );
}