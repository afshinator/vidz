import type { Channel, Video } from '@/lib/db/schema';
import type { YouTubeChannel, YouTubeVideo } from './api';

export function toChannel(
  ytChannel: YouTubeChannel,
  userId: string
): Omit<Channel, 'createdAt'> {
  return {
    id: ytChannel.id,
    userId,
    title: ytChannel.title,
    thumbnail: ytChannel.thumbnail,
    customName: null,
    subscribedAt: ytChannel.subscribedAt ? new Date(ytChannel.subscribedAt) : new Date(),
    lastSyncedAt: new Date(),
  };
}

export function toVideo(
  ytVideo: YouTubeVideo
): Omit<Video, 'fetchedAt'> {
  return {
    id: ytVideo.id,
    channelId: ytVideo.channelId,
    title: ytVideo.title,
    description: ytVideo.description,
    thumbnail: ytVideo.thumbnail,
    publishedAt: new Date(ytVideo.publishedAt),
    duration: ytVideo.duration,
    viewCount: ytVideo.viewCount,
    categoryId: ytVideo.categoryId ?? null,
  };
}

export function parseYouTubeDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export function formatDuration(duration: string): string {
  const seconds = parseYouTubeDuration(duration);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}