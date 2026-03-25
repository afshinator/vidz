import { YouTubeQuotaError } from '@/lib/error';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const DAILY_QUOTA = 10000;

interface YouTubeApiResponse<T> {
  data: T;
  quotaUsed: number;
}

async function fetchYouTube<T>(
  endpoint: string,
  accessToken: string,
  params: Record<string, string> = {}
): Promise<YouTubeApiResponse<T>> {
  const url = new URL(`${YOUTUBE_API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.error?.code === 403) {
      throw new YouTubeQuotaError(
        'YouTube API quota exceeded',
        DAILY_QUOTA,
        0
      );
    }
    throw new Error(error.error?.message || 'YouTube API error');
  }

  return {
    data: await response.json(),
    quotaUsed: 1,
  };
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
  const { data } = await fetchYouTube<{
    items: Array<{
      id: { videoId: string };
      snippet: {
        title: string;
        description: string;
        thumbnails: { medium?: { url: string }; high?: { url: string } };
        publishedAt: string;
        channelId: string;
      };
      contentDetails?: { duration: string };
      statistics?: { viewCount: string };
    }>;
    nextPageToken?: string;
  }>('/search', accessToken, {
    channelId,
    part: 'snippet,contentDetails,statistics',
    maxResults: '50',
    order: 'date',
    type: 'video',
    ...(pageToken && { pageToken }),
  });

  return {
    videos: data.items.map((item) => ({
      id: item.id.videoId,
      channelId: item.snippet.channelId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || '',
      publishedAt: item.snippet.publishedAt,
      duration: item.contentDetails?.duration || 'PT0M0S',
      viewCount: parseInt(item.statistics?.viewCount || '0', 10),
    })),
    nextPageToken: data.nextPageToken,
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