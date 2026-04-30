'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { getSubscriptions, getChannelVideos, getVideoCategoryIds } from '@/lib/youtube/api';
import { YouTubeQuotaError } from '@/lib/error';
import { batchUpsertChannels, batchUpsertVideos, batchUpdateVideoCategoryIds, upsertSettings, upsertSyncState, getVideoIdsWithNullCategoryId } from '@/lib/db/queries';
import { buildCategoryUpdates, buildSyncResultMessage, checkQuota, mapChannelValues, mapVideoValues } from '@/lib/sync-utils';

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

async function syncSubscriptions(
  accessToken: string,
  userId: string,
  quotaUsed: { current: number },
): Promise<{ channelIds: string[]; channelsSynced: number; errors: string[] }> {
  const channelIds: string[] = [];
  let channelsSynced = 0;
  const errors: string[] = [];
  let pageToken: string | undefined;

  do {
    const { channels, nextPageToken } = await getSubscriptions(accessToken, pageToken);
    quotaUsed.current += 1;

    const channelValues = mapChannelValues(channels, userId);

    try {
      await batchUpsertChannels(channelValues);
      channelsSynced += channelValues.length;
      channelIds.push(...channelValues.map((c) => c.id));
    } catch (err) {
      errors.push(`Failed to save channels page: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    pageToken = nextPageToken;
  } while (pageToken && quotaUsed.current < QUOTA_LIMIT - 100);

  return { channelIds, channelsSynced, errors };
}

async function syncChannelVideos(
  accessToken: string,
  channelIds: string[],
  quotaUsed: { current: number },
): Promise<{ videosAdded: number; errors: string[] }> {
  let videosAdded = 0;
  const errors: string[] = [];

  for (const channelId of channelIds.slice(0, MAX_CHANNELS_PER_SYNC)) {
    if (quotaUsed.current >= QUOTA_LIMIT - 10) break;

    try {
      let videoPageToken: string | undefined;
      let channelVideoCount = 0;
      let latestVideoId: string | undefined;
      do {
        const { videos, nextPageToken } = await getChannelVideos(accessToken, channelId, videoPageToken);
        quotaUsed.current += 2;

        const videoValues = mapVideoValues(videos);

        if (latestVideoId === undefined && videoValues.length > 0) {
          latestVideoId = videoValues[0].id;
        }

        try {
          await batchUpsertVideos(videoValues);
          videosAdded += videoValues.length;
          channelVideoCount += videoValues.length;
        } catch (err) {
          errors.push(`Failed to save videos for channel ${channelId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }

        videoPageToken = nextPageToken;
      } while (videoPageToken && channelVideoCount < VIDEOS_PER_CHANNEL);

      await upsertSyncState({ channelId, lastSyncedAt: new Date(), lastVideoId: latestVideoId });
    } catch (err) {
      if (err instanceof YouTubeQuotaError) break;
      errors.push(`Failed to fetch videos for channel ${channelId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return { videosAdded, errors };
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

  const quotaUsed = { current: 0 };
  let channelsSynced = 0;
  let videosAdded = 0;
  const errors: string[] = [];

  try {
    const subResult = await syncSubscriptions(accessToken, userId, quotaUsed);
    channelsSynced = subResult.channelsSynced;
    errors.push(...subResult.errors);

    const quotaCheck = checkQuota(quotaUsed.current, channelsSynced, videosAdded);
    if (quotaCheck.exceeded) {
      return { success: false, channelsSynced, videosAdded, quotaUsed: quotaUsed.current, message: quotaCheck.message };
    }

    const videoResult = await syncChannelVideos(accessToken, subResult.channelIds, quotaUsed);
    videosAdded = videoResult.videosAdded;
    errors.push(...videoResult.errors);

    await upsertSettings(userId, { lastSyncAt: new Date() });

    revalidatePath('/');
    revalidatePath('/channels');
    revalidatePath('/topics');

    return {
      success: true,
      channelsSynced,
      videosAdded,
      quotaUsed: quotaUsed.current,
      message: buildSyncResultMessage(channelsSynced, videosAdded, errors),
    };
  } catch (err) {
    if (err instanceof YouTubeQuotaError) {
      return {
        success: false,
        channelsSynced,
        videosAdded,
        quotaUsed: Math.max(quotaUsed.current, err.unitsUsed),
        message: `YouTube API quota exceeded. Synced ${channelsSynced} channels and ${videosAdded} videos.`,
      };
    }

    return {
      success: false,
      channelsSynced,
      videosAdded,
      quotaUsed: quotaUsed.current,
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

    const { updates, skipped: batchSkipped } = buildCategoryUpdates(batch, categoryMap);
    skipped += batchSkipped;
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