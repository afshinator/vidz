import type { YouTubeChannel, YouTubeVideo } from '@/lib/youtube/api';

export function mapChannelValues(
  channels: YouTubeChannel[],
  userId: string,
): Array<{ id: string; userId: string; title: string; thumbnail: string | null; subscribedAt: Date | null }> {
  return channels.map((channel) => ({
    id: channel.id,
    userId,
    title: channel.title,
    thumbnail: channel.thumbnail || null,
    subscribedAt: channel.subscribedAt ? new Date(channel.subscribedAt) : null,
  }));
}

export function mapVideoValues(
  videos: YouTubeVideo[],
): Array<{
  id: string;
  channelId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: Date;
  duration: string;
  viewCount: number;
  categoryId: string | null;
}> {
  return videos.map((video) => ({
    id: video.id,
    channelId: video.channelId,
    title: video.title,
    description: video.description,
    thumbnail: video.thumbnail,
    publishedAt: new Date(video.publishedAt),
    duration: video.duration,
    viewCount: video.viewCount,
    categoryId: video.categoryId ?? null,
  }));
}

export function buildCategoryUpdates(
  videoIds: string[],
  categoryMap: Map<string, string>,
): { updates: { videoId: string; categoryId: string }[]; skipped: number } {
  const updates: { videoId: string; categoryId: string }[] = [];
  let skipped = 0;

  for (const videoId of videoIds) {
    const categoryId = categoryMap.get(videoId);
    if (categoryId) {
      updates.push({ videoId, categoryId });
    } else {
      skipped++;
    }
  }

  return { updates, skipped };
}

export function buildSyncResultMessage(
  channelsSynced: number,
  videosAdded: number,
  errors: string[],
): string {
  if (errors.length > 0) {
    const shown = errors.slice(0, 3);
    return `Synced ${channelsSynced} channels and ${videosAdded} videos. ${errors.length} error${errors.length > 1 ? 's' : ''} occurred: ${shown.join('; ')}`;
  }
  return `Successfully synced ${channelsSynced} channels and ${videosAdded} videos.`;
}

export function checkQuota(quotaUsed: number, channelsSynced: number, videosAdded: number): { exceeded: boolean; message: string } {
  if (quotaUsed >= 10000 - 100) {
    return {
      exceeded: true,
      message: `Quota limit reached. Synced ${channelsSynced} channels and ${videosAdded} videos.`,
    };
  }
  return { exceeded: false, message: '' };
}
