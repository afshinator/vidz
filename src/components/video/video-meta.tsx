'use client';

import { StickyNote } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/time';
import { formatViewCount } from '@/lib/youtube/transformers';

interface VideoMetaProps {
  title: string;
  channelTitle?: string;
  publishedAt: Date;
  viewCount?: number | null;
  hasNote?: boolean;
  className?: string;
}

export function VideoMeta({ title, channelTitle, publishedAt, viewCount, hasNote, className }: VideoMetaProps) {
  return (
    <div className={className}>
      <h3 className="line-clamp-2 text-sm font-medium leading-snug mb-1">{title}</h3>
      <p className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
        {channelTitle && (
          <span className="text-primary/90 font-medium">{channelTitle}</span>
        )}
        {channelTitle && <span className="opacity-30">·</span>}
        <span>{formatRelativeTime(publishedAt)}</span>
        {viewCount != null && viewCount !== undefined && (
          <>
            <span className="opacity-30">·</span>
            <span>{formatViewCount(viewCount)} views</span>
          </>
        )}
      </p>
      {hasNote && (
        <span className="inline-flex items-center gap-1 mt-1 rounded bg-amber-400/15 px-1.5 py-0.5 w-fit">
          <StickyNote className="h-3 w-3 text-amber-500" />
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 tracking-wide">NOTED</span>
        </span>
      )}
    </div>
  );
}
