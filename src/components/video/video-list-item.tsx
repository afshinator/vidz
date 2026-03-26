'use client';

import { formatRelativeTime } from '@/lib/utils/time';
import { formatDuration, formatViewCount } from '@/lib/youtube/transformers';
import Image from 'next/image';
import { Check, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toggleWatched } from '@/actions/videos';

interface VideoListItemProps {
  video: {
    id: string;
    title: string;
    thumbnail?: string | null;
    publishedAt: Date;
    duration?: string | null;
    viewCount?: number | null;
    channelId?: string | null;
  };
  channelTitle?: string;
  isWatched: boolean;
}

export function VideoListItem({ video, channelTitle, isWatched }: VideoListItemProps) {
  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWatched(video.id, isWatched);
  };

  return (
    <div
      className={cn(
        'group/item flex gap-3 rounded-xl border border-border/60 bg-card p-2.5',
        'transition-all duration-150 hover:border-border hover:shadow-sm',
        isWatched && 'opacity-55'
      )}
    >
      {/* Thumbnail */}
      <a
        href={`https://www.youtube.com/watch?v=${video.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative shrink-0 overflow-hidden rounded-lg bg-muted"
        style={{ width: 128, aspectRatio: '16/9' }}
      >
        {video.thumbnail && (
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover"
            sizes="128px"
          />
        )}
        <div className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-px text-[10px] font-medium text-white tabular-nums">
          {video.duration ? formatDuration(video.duration) : '0:00'}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute top-1 left-1 h-6 w-6 rounded-full backdrop-blur-sm',
            'opacity-0 group-hover/item:opacity-100 transition-opacity duration-150',
            isWatched
              ? 'bg-green-500/80 hover:bg-green-500'
              : 'bg-black/50 hover:bg-black/70'
          )}
          onClick={handleToggle}
        >
          {isWatched ? (
            <CheckCircle2 className="h-3 w-3 text-white" />
          ) : (
            <Check className="h-3 w-3 text-white/70" />
          )}
        </Button>
      </a>

      {/* Metadata */}
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug mb-1">
          {video.title}
        </h3>
        <p className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
          {channelTitle && (
            <span className="text-primary/90 font-medium">{channelTitle}</span>
          )}
          {channelTitle && <span className="opacity-30">·</span>}
          <span>{formatRelativeTime(video.publishedAt)}</span>
          {video.viewCount != null && video.viewCount !== undefined && (
            <>
              <span className="opacity-30">·</span>
              <span>{formatViewCount(video.viewCount)} views</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
