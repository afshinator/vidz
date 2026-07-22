/**
 * Integration test for getUnwatchedVideosPaginated.
 * Runs against the real Neon DB using a test-scoped userId.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import 'dotenv/config';
import {
  getUnwatchedVideosPaginated,
  batchUpsertChannels,
  batchUpsertVideos,
  markVideoWatched,
  markVideoUnwatched,
} from '@/lib/db/queries';
import { getDb } from '@/lib/db/client';
import { channels, videos, watched } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

const TEST_USER_ID = `test_listview_${Date.now()}`;

const TEST_CHANNELS = [
  { id: 'ulv_ch_z', userId: TEST_USER_ID, title: 'Zeta Channel', thumbnail: null, subscribedAt: null },
  { id: 'ulv_ch_a', userId: TEST_USER_ID, title: 'Alpha Channel', thumbnail: null, subscribedAt: null },
  { id: 'ulv_ch_m', userId: TEST_USER_ID, title: 'Middle Channel', thumbnail: null, subscribedAt: null },
];

const TEST_VIDEOS = [
  { id: 'ulv_vid_1', channelId: 'ulv_ch_a', title: 'BBB Video', description: null, thumbnail: null, publishedAt: new Date('2024-01-15'), duration: null, viewCount: null, categoryId: null },
  { id: 'ulv_vid_2', channelId: 'ulv_ch_z', title: 'AAA Video', description: null, thumbnail: null, publishedAt: new Date('2024-03-01'), duration: null, viewCount: null, categoryId: null },
  { id: 'ulv_vid_3', channelId: 'ulv_ch_m', title: 'CCC Video', description: null, thumbnail: null, publishedAt: new Date('2024-02-10'), duration: null, viewCount: null, categoryId: null },
  { id: 'ulv_vid_4', channelId: 'ulv_ch_a', title: 'DDD Video', description: null, thumbnail: null, publishedAt: new Date('2024-05-20'), duration: null, viewCount: null, categoryId: null },
  { id: 'ulv_vid_5', channelId: 'ulv_ch_z', title: 'EEE Video', description: null, thumbnail: null, publishedAt: new Date('2024-06-01'), duration: null, viewCount: null, categoryId: null },
];

beforeAll(async () => {
  await batchUpsertChannels(TEST_CHANNELS);
  await batchUpsertVideos(TEST_VIDEOS);
});

afterAll(async () => {
  const db = getDb();
  const videoIds = TEST_VIDEOS.map((v) => v.id);
  const channelIds = TEST_CHANNELS.map((c) => c.id);
  await db.delete(watched).where(inArray(watched.videoId, videoIds));
  await db.delete(videos).where(inArray(videos.id, videoIds));
  await db.delete(channels).where(inArray(channels.id, channelIds));
});

describe('getUnwatchedVideosPaginated', () => {
  it('returns all unwatched videos sorted by publishedAt DESC by default', async () => {
    const result = await getUnwatchedVideosPaginated(TEST_USER_ID, 10);
    expect(result.data).toHaveLength(5);
    expect(result.hasMore).toBe(false);
    // Most recent first
    expect(result.data[0].id).toBe('ulv_vid_5');  // 2024-06-01
    expect(result.data[4].id).toBe('ulv_vid_1');  // 2024-01-15
  });

  it('paginates with cursor', async () => {
    const page1 = await getUnwatchedVideosPaginated(TEST_USER_ID, 2);
    expect(page1.data).toHaveLength(2);
    expect(page1.hasMore).toBe(true);
    expect(page1.nextCursor).toBeTruthy();

    const page2 = await getUnwatchedVideosPaginated(TEST_USER_ID, 2, { cursor: page1.nextCursor });
    expect(page2.data).toHaveLength(2);

    const page3 = await getUnwatchedVideosPaginated(TEST_USER_ID, 2, { cursor: page2.nextCursor });
    expect(page3.data).toHaveLength(1);
    expect(page3.hasMore).toBe(false);
    expect(page3.nextCursor).toBeUndefined();
  });

  it('sorts by title ASC', async () => {
    const result = await getUnwatchedVideosPaginated(TEST_USER_ID, 10, { sortBy: 'title', sortDir: 'asc' });
    expect(result.data).toHaveLength(5);
    expect(result.data[0].title).toBe('AAA Video');
    expect(result.data[4].title).toBe('EEE Video');
  });

  it('sorts by title DESC', async () => {
    const result = await getUnwatchedVideosPaginated(TEST_USER_ID, 10, { sortBy: 'title', sortDir: 'desc' });
    expect(result.data[0].title).toBe('EEE Video');
  });

  it('sorts by channelTitle ASC', async () => {
    const result = await getUnwatchedVideosPaginated(TEST_USER_ID, 10, { sortBy: 'channelTitle', sortDir: 'asc' });
    expect(result.data[0].channelTitle).toBe('Alpha Channel');
    expect(result.data[4].channelTitle).toBe('Zeta Channel');
  });

  it('paginates correctly when sorted by title', async () => {
    const page1 = await getUnwatchedVideosPaginated(TEST_USER_ID, 2, { sortBy: 'title', sortDir: 'asc' });
    expect(page1.data).toHaveLength(2);
    expect(page1.nextCursor).toBeTruthy();

    const page2 = await getUnwatchedVideosPaginated(TEST_USER_ID, 2, { sortBy: 'title', sortDir: 'asc', cursor: page1.nextCursor });
    expect(page2.data).toHaveLength(2);

    const page3 = await getUnwatchedVideosPaginated(TEST_USER_ID, 2, { sortBy: 'title', sortDir: 'asc', cursor: page2.nextCursor });
    expect(page3.data).toHaveLength(1);
    expect(page3.hasMore).toBe(false);
  });

  it('excludes watched videos', async () => {
    await markVideoWatched('ulv_vid_5');
    const result = await getUnwatchedVideosPaginated(TEST_USER_ID, 10);
    expect(result.data).toHaveLength(4);
    const ids = result.data.map((v) => v.id);
    expect(ids).not.toContain('ulv_vid_5');
    await markVideoUnwatched('ulv_vid_5');
  });
});
