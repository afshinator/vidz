'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { getSubscriptions, getChannelVideos } from '@/lib/youtube/api';
import { YouTubeQuotaError } from '@/lib/error';
import { upsertChannel, upsertVideo, upsertSettings } from '@/lib/db/queries';

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

      for (const channel of channels) {
        try {
          await upsertChannel({
            id: channel.id,
            userId: session.user.id,
            title: channel.title,
            thumbnail: channel.thumbnail,
            subscribedAt: channel.subscribedAt ? new Date(channel.subscribedAt) : null,
          });
          channelsSynced++;
          channelIds.push(channel.id);
        } catch (err) {
          errors.push(`Failed to save channel ${channel.title}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
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
          quotaUsed += 1;

          for (const video of videos) {
            try {
              await upsertVideo({
                id: video.id,
                channelId: video.channelId,
                title: video.title,
                description: video.description,
                thumbnail: video.thumbnail,
                publishedAt: new Date(video.publishedAt),
                duration: video.duration,
                viewCount: video.viewCount,
              });
              videosAdded++;
              channelVideoCount++;
            } catch (err) {
              errors.push(`Failed to save video ${video.title}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
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

    await upsertSettings(session.user.id, { lastSyncAt: new Date() });

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