'use client';

import { useState } from 'react';
import { formatRelativeTime } from '@/lib/utils/time';
import { formatDuration, formatViewCount } from '@/lib/youtube/transformers';
import Image from 'next/image';
import { BookmarkCheck, Check, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toggleWatched } from '@/actions/videos';
import { VideoActionDialog } from './video-action-dialog';

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
  hasNote?: boolean;
}

export function VideoListItem({ video, channelTitle, isWatched, hasNote }: VideoListItemProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWatched(video.id, isWatched);
  };

  const handleClick = () => {
    setDialogOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          'group/item flex gap-3 rounded-xl border bg-card p-2.5 cursor-pointer',
          'transition-all duration-150 hover:shadow-sm',
          isWatched && 'opacity-55',
          hasNote
            ? 'border-l-[3px] border-l-primary border-border/60 hover:border-border/80 shadow-sm shadow-primary/10'
            : 'border-border/60 hover:border-border'
        )}
        onClick={handleClick}
      >
        {/* Thumbnail */}
        <div
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
        </div>

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
          {hasNote && (
            <span className="inline-flex items-center gap-1 mt-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary tracking-wide w-fit">
              <BookmarkCheck className="h-3 w-3" />
              NOTED
            </span>
          )}
        </div>
      </div>

      <VideoActionDialog
        video={{ id: video.id, title: video.title, thumbnail: video.thumbnail }}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
