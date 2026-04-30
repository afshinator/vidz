import { describe, it, expect } from 'vitest';

interface YouTubeChannel {
  id: string;
  title: string;
  thumbnail: string;
  subscribedAt?: string;
}

interface YouTubeVideo {
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

describe('buildCategoryUpdates', () => {
  it('separates videos with and without category data', async () => {
    const { buildCategoryUpdates } = await import('@/lib/sync-utils');
    const videoIds = ['v1', 'v2', 'v3', 'v4'];
    const categoryMap = new Map([
      ['v1', '10'],
      ['v3', '22'],
    ]);

    const { updates, skipped } = buildCategoryUpdates(videoIds, categoryMap);
    expect(updates).toEqual([
      { videoId: 'v1', categoryId: '10' },
      { videoId: 'v3', categoryId: '22' },
    ]);
    expect(skipped).toBe(2);
  });

  it('handles empty input', async () => {
    const { buildCategoryUpdates } = await import('@/lib/sync-utils');
    const { updates, skipped } = buildCategoryUpdates([], new Map());
    expect(updates).toEqual([]);
    expect(skipped).toBe(0);
  });

  it('handles all matched', async () => {
    const { buildCategoryUpdates } = await import('@/lib/sync-utils');
    const videoIds = ['v1', 'v2'];
    const categoryMap = new Map([['v1', '10'], ['v2', '15']]);
    const { updates, skipped } = buildCategoryUpdates(videoIds, categoryMap);
    expect(updates).toHaveLength(2);
    expect(skipped).toBe(0);
  });
});

describe('mapChannelValues', () => {
  it('transforms YouTube channels to DB format', async () => {
    const { mapChannelValues } = await import('@/lib/sync-utils');
    const channels: YouTubeChannel[] = [
      { id: 'uc_1', title: 'Channel One', thumbnail: 'https://example.com/thumb.jpg' },
      { id: 'uc_2', title: 'Channel Two', thumbnail: '', subscribedAt: '2024-01-01T00:00:00Z' },
    ];

    const result = mapChannelValues(channels, 'user_1');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'uc_1',
      userId: 'user_1',
      title: 'Channel One',
      thumbnail: 'https://example.com/thumb.jpg',
      subscribedAt: null,
    });
    expect(result[1].subscribedAt).toBeInstanceOf(Date);
  });

  it('handles empty array', async () => {
    const { mapChannelValues } = await import('@/lib/sync-utils');
    expect(mapChannelValues([], 'user_1')).toEqual([]);
  });
});

describe('mapVideoValues', () => {
  it('transforms YouTube videos to DB format', async () => {
    const { mapVideoValues } = await import('@/lib/sync-utils');
    const videos: YouTubeVideo[] = [
      {
        id: 'uv_1',
        channelId: 'uc_1',
        title: 'Video One',
        description: 'A test video',
        thumbnail: 'https://example.com/vid.jpg',
        publishedAt: '2024-06-01T12:00:00Z',
        duration: 'PT5M',
        viewCount: 1000,
        categoryId: '22',
      },
    ];

    const result = mapVideoValues(videos);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('uv_1');
    expect(result[0].publishedAt).toBeInstanceOf(Date);
    expect(result[0].viewCount).toBe(1000);
    expect(result[0].categoryId).toBe('22');
  });

  it('handles empty array', async () => {
    const { mapVideoValues } = await import('@/lib/sync-utils');
    expect(mapVideoValues([])).toEqual([]);
  });

  it('defaults null categoryId when missing', async () => {
    const { mapVideoValues } = await import('@/lib/sync-utils');
    const videos: YouTubeVideo[] = [
      {
        id: 'uv_2', channelId: 'uc_1', title: 'No Cat', description: '', thumbnail: '',
        publishedAt: '2024-06-01T00:00:00Z', duration: 'PT1M', viewCount: 0,
      },
    ];

    const result = mapVideoValues(videos);
    expect(result[0].categoryId).toBeNull();
  });
});

describe('buildSyncResultMessage', () => {
  it('builds a success message with no errors', async () => {
    const { buildSyncResultMessage } = await import('@/lib/sync-utils');
    const msg = buildSyncResultMessage(5, 100, []);
    expect(msg).toBe('Successfully synced 5 channels and 100 videos.');
  });

  it('includes errors when present (max 3 shown)', async () => {
    const { buildSyncResultMessage } = await import('@/lib/sync-utils');
    const errors = ['err1', 'err2', 'err3', 'err4'];
    const msg = buildSyncResultMessage(2, 10, errors);
    expect(msg).toContain('Synced 2 channels and 10 videos');
    expect(msg).toContain('4 errors occurred');
    expect(msg).toContain('err1; err2; err3');
    expect(msg).not.toContain('err4');
  });

  it('handles single error', async () => {
    const { buildSyncResultMessage } = await import('@/lib/sync-utils');
    const msg = buildSyncResultMessage(1, 5, ['Channel failed']);
    expect(msg).toContain('1 error occurred');
  });
});
