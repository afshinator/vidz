'use client';

import { formatRelativeTime } from '@/lib/utils/time';
import { formatDuration, formatViewCount } from '@/lib/youtube/transformers';
import Image from 'next/image';
import { ExternalLink, Check, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toggleWatched } from '@/actions/videos';

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
  onToggleWatched?: (videoId: string, watched: boolean) => void;
}

export function VideoCard({ video, channelTitle, isWatched }: VideoCardProps) {
  const handleToggle = async () => {
    await toggleWatched(video.id, isWatched);
  };
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="relative aspect-video bg-muted">
        {video.thumbnail && (
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
        <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
          {video.duration ? formatDuration(video.duration) : '0:00'}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
          onClick={handleToggle}
        >
          {isWatched ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-white" />
          )}
        </Button>
      </div>
      <CardHeader className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-tight">{video.title}</h3>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-xs text-muted-foreground">
          {channelTitle && <span className="font-medium">{channelTitle}</span>}
          {channelTitle && ' • '}
          {formatRelativeTime(video.publishedAt)}
          {video.viewCount !== null && video.viewCount !== undefined && (
            <> • {formatViewCount(video.viewCount)} views</>
          )}
        </p>
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <Button variant="ghost" size="sm" className="w-full" asChild>
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open on YouTube
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}