'use client';

import { VideoCard } from './video-card';
import { VideoListItem } from './video-list-item';
import { useViewMode } from './view-mode-context';

export interface GridVideo {
  id: string;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  publishedAt: Date;
  duration?: string | null;
  viewCount?: number | null;
  channelId?: string | null;
  channelTitle?: string;
  isWatched?: boolean;
  hasNote?: boolean;
}

export function VideoGrid({ videos }: { videos: GridVideo[] }) {
  const { viewMode } = useViewMode();

  if (viewMode === 'list') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {videos.map((video) => (
          <VideoListItem
            key={video.id}
            video={video}
            channelTitle={video.channelTitle}
            isWatched={video.isWatched ?? false}
            hasNote={video.hasNote}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          channelTitle={video.channelTitle}
          isWatched={video.isWatched ?? false}
          hasNote={video.hasNote}
        />
      ))}
    </div>
  );
}
