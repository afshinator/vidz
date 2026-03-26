'use client';

import { useState } from 'react';
import { formatRelativeTime } from '@/lib/utils/time';
import { formatDuration, formatViewCount } from '@/lib/youtube/transformers';
import Image from 'next/image';
import { Check, CheckCircle2, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toggleWatched } from '@/actions/videos';
import { VideoActionDialog } from './video-action-dialog';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    description?: string | null;
    thumbnail?: string | null;
    publishedAt: Date;
    duration?: string | null;
    viewCount?: number | null;
    channelId?: string | null;
  };
  channelTitle?: string;
  isWatched: boolean;
  hasNote?: boolean;
  onToggleWatched?: (videoId: string, watched: boolean) => void;
}

export function VideoCard({ video, channelTitle, isWatched, hasNote }: VideoCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWatched(video.id, isWatched);
  };

  const handleCardClick = () => {
    setDialogOpen(true);
  };

  return (
    <>
      <Card
        className={cn(
          'overflow-hidden gap-0 py-0 transition-all duration-200 group/card cursor-pointer',
          'hover:scale-[1.025] hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/40',
          isWatched && 'opacity-55',
          hasNote && 'ring-2 ring-amber-400 shadow-lg shadow-amber-400/20'
        )}
        onClick={handleCardClick}
      >
        {/* Thumbnail */}
        <div className="relative block aspect-video bg-muted overflow-hidden">
          {video.thumbnail ? (
            <Image
              src={video.thumbnail}
              alt={video.title}
              fill
              className="object-cover transition-transform duration-300 group-hover/card:scale-[1.04]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-muted-foreground/20" />
            </div>
          )}

          {/* Gradient scrim on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-200" />

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums backdrop-blur-sm">
            {video.duration ? formatDuration(video.duration) : '0:00'}
          </div>

          {/* Noted badge */}
          {hasNote && (
            <div className="absolute top-2 right-2 rounded-md bg-amber-400 p-1 shadow-sm">
              <StickyNote className="h-3.5 w-3.5 text-amber-950" />
            </div>
          )}

          {/* Watch toggle — slides in on hover */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute top-2 left-2 h-7 w-7 rounded-full backdrop-blur-sm transition-all duration-150',
              'opacity-0 group-hover/card:opacity-100',
              isWatched
                ? 'bg-green-500/80 hover:bg-green-500'
                : 'bg-black/50 hover:bg-black/70'
            )}
            onClick={handleToggle}
          >
            {isWatched ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            ) : (
              <Check className="h-3.5 w-3.5 text-white/70" />
            )}
          </Button>
        </div>

        {/* Metadata */}
        <div className="p-3 space-y-1">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug">{video.title}</h3>
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
      </Card>

      <VideoActionDialog
        video={{ id: video.id, title: video.title, thumbnail: video.thumbnail }}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
