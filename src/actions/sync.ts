'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { getSubscriptions, getChannelVideos, getVideoCategoryIds } from '@/lib/youtube/api';
import { YouTubeQuotaError } from '@/lib/error';
import { batchUpsertChannels, batchUpsertVideos, batchUpdateVideoCategoryIds, upsertSettings, getVideoIdsWithNullCategoryId } from '@/lib/db/queries';

const QUOTA_LIMIT = 10000;
const VIDEOS_PER_CHANNEL = 50;
const MAX_CHANNELS_PER_SYNC = 50;

interface SyncResult {
  success: boolean;
  channelsSynced: number;
  videosAdded: number;
  quotaUsed: number;
  message: string;
}

export async function syncNowAction(): Promise<SyncResult> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const userId: string = session.user.id;
  const accessToken = session.accessToken;
  if (!accessToken) {
    return {
      success: false,
      channelsSynced: 0,
      videosAdded: 0,
      quotaUsed: 0,
      message: 'No YouTube access token. Please reconnect your Google account.',
    };
  }

  let quotaUsed = 0;
  let channelsSynced = 0;
  let videosAdded = 0;
  const errors: string[] = [];
  const channelIds: string[] = [];

  try {
    let pageToken: string | undefined;
    do {
      const { channels, nextPageToken } = await getSubscriptions(accessToken, pageToken);
      quotaUsed += 1;

      const channelValues = channels.map((channel) => ({
        id: channel.id,
        userId,
        title: channel.title,
        thumbnail: channel.thumbnail,
        subscribedAt: channel.subscribedAt ? new Date(channel.subscribedAt) : null,
      }));

      try {
        await batchUpsertChannels(channelValues);
        channelsSynced += channelValues.length;
        channelIds.push(...channelValues.map((c) => c.id));
      } catch (err) {
        errors.push(`Failed to save channels page: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      pageToken = nextPageToken;
    } while (pageToken && quotaUsed < QUOTA_LIMIT - 100);

    if (quotaUsed >= QUOTA_LIMIT - 100) {
      return {
        success: false,
        channelsSynced,
        videosAdded,
        quotaUsed,
        message: `Quota limit reached. Synced ${channelsSynced} channels and ${videosAdded} videos.`,
      };
    }

    for (const channelId of channelIds.slice(0, MAX_CHANNELS_PER_SYNC)) {
      if (quotaUsed >= QUOTA_LIMIT - 10) break;

      try {
        let videoPageToken: string | undefined;
        let channelVideoCount = 0;
        do {
          const { videos, nextPageToken } = await getChannelVideos(accessToken, channelId, videoPageToken);
          quotaUsed += 2; // 1 for /playlistItems + 1 for /videos details batch

          const videoValues = videos.map((video) => ({
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

          try {
            await batchUpsertVideos(videoValues);
            videosAdded += videoValues.length;
            channelVideoCount += videoValues.length;
          } catch (err) {
            errors.push(`Failed to save videos for channel ${channelId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }

          videoPageToken = nextPageToken;
        } while (videoPageToken && channelVideoCount < VIDEOS_PER_CHANNEL);
      } catch (err) {
        if (err instanceof YouTubeQuotaError) {
          break;
        }
        errors.push(`Failed to fetch videos for channel ${channelId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    await upsertSettings(userId, { lastSyncAt: new Date() });

    revalidatePath('/');
    revalidatePath('/channels');
    revalidatePath('/topics');

    const message = errors.length > 0
      ? `Synced ${channelsSynced} channels and ${videosAdded} videos. ${errors.length} error${errors.length > 1 ? 's' : ''} occurred: ${errors.slice(0, 3).join('; ')}`
      : `Successfully synced ${channelsSynced} channels and ${videosAdded} videos.`;

    return {
      success: true,
      channelsSynced,
      videosAdded,
      quotaUsed,
      message,
    };
  } catch (err) {
    if (err instanceof YouTubeQuotaError) {
      const quotaErr = err as YouTubeQuotaError;
      return {
        success: false,
        channelsSynced,
        videosAdded,
        quotaUsed: Math.max(quotaUsed, quotaErr.unitsUsed),
        message: `YouTube API quota exceeded. Synced ${channelsSynced} channels and ${videosAdded} videos.`,

      };
    }

    return {
      success: false,
      channelsSynced,
      videosAdded,
      quotaUsed,
      message: `Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

interface BackfillResult {
  success: boolean;
  updated: number;
  skipped: number;
  quotaUsed: number;
  message: string;
}

export async function backfillCategoryIdsAction(): Promise<BackfillResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const accessToken = session.accessToken;
  if (!accessToken) {
    return { success: false, updated: 0, skipped: 0, quotaUsed: 0, message: 'No YouTube access token. Please reconnect your Google account.' };
  }

  const videoIds = await getVideoIdsWithNullCategoryId();
  if (videoIds.length === 0) {
    return { success: true, updated: 0, skipped: 0, quotaUsed: 0, message: 'All videos already have category data.' };
  }

  let updated = 0;
  let skipped = 0;
  let quotaUsed = 0;

  // Process in batches of 50 (YouTube API limit per request)
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const categoryMap = await getVideoCategoryIds(accessToken, batch);
    quotaUsed += 1;

    const updates: { videoId: string; categoryId: string }[] = [];
    for (const videoId of batch) {
      const categoryId = categoryMap.get(videoId);
      if (categoryId) {
        updates.push({ videoId, categoryId });
      } else {
        skipped++;
      }
    }
    if (updates.length > 0) {
      await batchUpdateVideoCategoryIds(updates);
      updated += updates.length;
    }
  }

  revalidatePath('/unwatched');

  return {
    success: true,
    updated,
    skipped,
    quotaUsed,
    message: `Updated ${updated} video${updated !== 1 ? 's' : ''} with category data.${skipped > 0 ? ` ${skipped} video${skipped !== 1 ? 's' : ''} had no category available.` : ''}`,
  };
}