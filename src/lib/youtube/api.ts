import { YouTubeQuotaError } from '@/lib/error';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const DAILY_QUOTA = 10000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Status codes that should not be retried
const NON_RETRYABLE_STATUS = new Set([400, 401, 403]);

interface YouTubeApiResponse<T> {
  data: T;
  quotaUsed: number;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchYouTube<T>(
  endpoint: string,
  accessToken: string,
  params: Record<string, string> = {}
): Promise<YouTubeApiResponse<T>> {
  const url = new URL(`${YOUTUBE_API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();

        // Don't retry certain status codes
        if (NON_RETRYABLE_STATUS.has(response.status)) {
          if (response.status === 403) {
            const reason = error.error?.errors?.[0]?.reason;
            if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
              throw new YouTubeQuotaError('YouTube API quota exceeded', DAILY_QUOTA, 0);
            }
            throw new Error(error.error?.message || 'YouTube API access forbidden. Check OAuth scopes and credentials.');
          }
          throw new Error(error.error?.message || 'YouTube API error');
        }

        // Retry on 500, 502, 503, 504, etc.
        lastError = new Error(error.error?.message || `HTTP ${response.status}`);
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * (attempt + 1)); // Linear backoff
          continue;
        }
        throw lastError;
      }

      return {
        data: await response.json(),
        quotaUsed: 1,
      };
    } catch (err) {
      // Network errors (fetch throws TypeError)
      if (err instanceof TypeError) {
        lastError = err;
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
      }
      throw err;
    }
  }

  throw lastError || new Error('Unknown error in fetchYouTube');
}

export interface YouTubeChannel {
  id: string;
  title: string;
  thumbnail: string;
  subscribedAt?: string;
}

export interface YouTubeVideo {
  id: string;
  channelId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  viewCount: number;
  categoryId?: string;
}

export async function getSubscriptions(
  accessToken: string,
  pageToken?: string
): Promise<{ channels: YouTubeChannel[]; nextPageToken?: string }> {
  const { data } = await fetchYouTube<{
    items: Array<{
      snippet: { title: string; thumbnails: { medium?: { url: string } }; resourceId: { channelId: string } };
    }>;
    nextPageToken?: string;
  }>('/subscriptions', accessToken, {
    mine: 'true',
    part: 'snippet',
    maxResults: '50',
    ...(pageToken && { pageToken }),
  });

  return {
    channels: data.items.map((item) => ({
      id: item.snippet.resourceId.channelId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium?.url || '',
    })),
    nextPageToken: data.nextPageToken,
  };
}

export async function getChannelDetails(
  accessToken: string,
  channelId: string
): Promise<YouTubeChannel | null> {
  const { data } = await fetchYouTube<{
    items: Array<{
      id: string;
      snippet: { title: string; thumbnails: { medium?: { url: string } } };
    }>;
  }>('/channels', accessToken, {
    id: channelId,
    part: 'snippet',
  });

  if (!data.items?.length) return null;
  const item = data.items[0];
  return {
    id: item.id,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.medium?.url || '',
  };
}

export async function getChannelVideos(
  accessToken: string,
  channelId: string,
  pageToken?: string
): Promise<{ videos: YouTubeVideo[]; nextPageToken?: string }> {
  // Derive uploads playlist ID from channel ID: UC... -> UU...
  // This avoids the /search endpoint which costs 100 quota units per call.
  const uploadsPlaylistId = 'UU' + channelId.slice(2);

  const { data: playlistData } = await fetchYouTube<{
    items: Array<{
      snippet: {
        title: string;
        description: string;
        thumbnails: { medium?: { url: string }; high?: { url: string } };
        publishedAt: string;
        channelId: string;
        resourceId: { videoId: string };
      };
    }>;
    nextPageToken?: string;
  }>('/playlistItems', accessToken, {
    playlistId: uploadsPlaylistId,
    part: 'snippet',
    maxResults: '50',
    ...(pageToken && { pageToken }),
  });

  if (!playlistData.items?.length) {
    return { videos: [], nextPageToken: undefined };
  }

  const videoIds = playlistData.items.map((item) => item.snippet.resourceId.videoId);

  // Batch fetch snippet (categoryId) + contentDetails + statistics for this page of videos (1 unit for up to 50)
  const { data: videoData } = await fetchYouTube<{
    items: Array<{
      id: string;
      snippet: { categoryId: string };
      contentDetails: { duration: string };
      statistics: { viewCount: string };
    }>;
  }>('/videos', accessToken, {
    id: videoIds.join(','),
    part: 'snippet,contentDetails,statistics',
  });

  const detailsMap = new Map(videoData.items.map((item) => [item.id, item]));

  return {
    videos: playlistData.items.map((item) => {
      const videoId = item.snippet.resourceId.videoId;
      const details = detailsMap.get(videoId);
      return {
        id: videoId,
        channelId: item.snippet.channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || '',
        publishedAt: item.snippet.publishedAt,
        duration: details?.contentDetails.duration || 'PT0M0S',
        viewCount: parseInt(details?.statistics.viewCount || '0', 10),
        categoryId: details?.snippet.categoryId,
      };
    }),
    nextPageToken: playlistData.nextPageToken,
  };
}

export async function getWatchHistory(
  accessToken: string,
  pageToken?: string
): Promise<{ videoIds: string[]; nextPageToken?: string }> {
  const { data } = await fetchYouTube<{
    items: Array<{
      contentDetails: { videoId: string };
    }>;
    nextPageToken?: string;
  }>('/activities', accessToken, {
    mine: 'true',
    part: 'contentDetails',
    maxResults: '50',
    ...(pageToken && { pageToken }),
  });

  return {
    videoIds: data.items.map((item) => item.contentDetails.videoId),
    nextPageToken: data.nextPageToken,
  };
}

export async function getVideoCategoryIds(
  accessToken: string,
  videoIds: string[]
): Promise<Map<string, string>> {
  const { data } = await fetchYouTube<{
    items: Array<{ id: string; snippet: { categoryId: string } }>;
  }>('/videos', accessToken, {
    id: videoIds.join(','),
    part: 'snippet',
  });

  return new Map(data.items.map((item) => [item.id, item.snippet.categoryId]));
}
