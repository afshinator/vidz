/**
 * Integration test for batch upsert functions.
 * Runs against the real Neon DB using a test-scoped userId that is cleaned up after.
 *
 * Requires DATABASE_URL in .env (loaded automatically by vitest via dotenv).
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import 'dotenv/config';
import { batchUpsertChannels, batchUpsertVideos, getChannelsByUser } from '@/lib/db/queries';
import { getDb } from '@/lib/db/client';
import { channels, videos } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

const TEST_USER_ID = `test_batch_${Date.now()}`;

const TEST_CHANNELS = [
  { id: 'uc_test_1', userId: TEST_USER_ID, title: 'Channel One', thumbnail: null, subscribedAt: null },
  { id: 'uc_test_2', userId: TEST_USER_ID, title: 'Channel Two', thumbnail: 'https://example.com/thumb.jpg', subscribedAt: new Date('2024-01-01') },
  { id: 'uc_test_3', userId: TEST_USER_ID, title: 'Channel Three', thumbnail: null, subscribedAt: null },
];

const TEST_VIDEOS = [
  {
    id: 'uv_test_1',
    channelId: 'uc_test_1',
    title: 'Video One',
    description: 'desc 1',
    thumbnail: null,
    publishedAt: new Date('2024-06-01'),
    duration: 'PT5M',
    viewCount: 1000,
    categoryId: '22',
  },
  {
    id: 'uv_test_2',
    channelId: 'uc_test_1',
    title: 'Video Two',
    description: null,
    thumbnail: 'https://example.com/v2.jpg',
    publishedAt: new Date('2024-06-02'),
    duration: 'PT10M',
    viewCount: 500,
    categoryId: null,
  },
  {
    id: 'uv_test_3',
    channelId: 'uc_test_2',
    title: 'Video Three',
    description: null,
    thumbnail: null,
    publishedAt: new Date('2024-06-03'),
    duration: null,
    viewCount: null,
    categoryId: null,
  },
];

afterAll(async () => {
  const db = getDb();
  const channelIds = TEST_CHANNELS.map((c) => c.id);
  await db.delete(videos).where(inArray(videos.id, TEST_VIDEOS.map((v) => v.id)));
  await db.delete(channels).where(inArray(channels.id, channelIds));
});

describe('batchUpsertChannels', () => {
  it('inserts all channels in a single call', async () => {
    await batchUpsertChannels(TEST_CHANNELS);

    const result = await getChannelsByUser(TEST_USER_ID);
    expect(result).toHaveLength(TEST_CHANNELS.length);

    const ids = result.map((c) => c.id).sort();
    expect(ids).toEqual(TEST_CHANNELS.map((c) => c.id).sort());
  });

  it('updates existing channels on conflict without duplicating', async () => {
    const updated = TEST_CHANNELS.map((c) => ({ ...c, title: c.title + ' (updated)' }));
    await batchUpsertChannels(updated);

    const result = await getChannelsByUser(TEST_USER_ID);
    // Same count — no duplicates
    expect(result).toHaveLength(TEST_CHANNELS.length);
    // Titles updated
    for (const channel of result) {
      expect(channel.title).toMatch(/\(updated\)$/);
    }
  });

  it('is idempotent — re-inserting same data leaves row count unchanged', async () => {
    await batchUpsertChannels(TEST_CHANNELS);
    await batchUpsertChannels(TEST_CHANNELS);

    const result = await getChannelsByUser(TEST_USER_ID);
    expect(result).toHaveLength(TEST_CHANNELS.length);
  });
});

describe('batchUpsertVideos', () => {
  beforeAll(async () => {
    // Ensure channels exist before inserting videos (FK constraint)
    await batchUpsertChannels(TEST_CHANNELS);
  });

  it('inserts all videos in a single call', async () => {
    await batchUpsertVideos(TEST_VIDEOS);

    const db = getDb();
    const result = await db
      .select()
      .from(videos)
      .where(inArray(videos.id, TEST_VIDEOS.map((v) => v.id)));

    expect(result).toHaveLength(TEST_VIDEOS.length);
  });

  it('updates existing videos on conflict without duplicating', async () => {
    const updated = TEST_VIDEOS.map((v) => ({ ...v, title: v.title + ' (updated)', viewCount: 9999 }));
    await batchUpsertVideos(updated);

    const db = getDb();
    const result = await db
      .select()
      .from(videos)
      .where(inArray(videos.id, TEST_VIDEOS.map((v) => v.id)));

    expect(result).toHaveLength(TEST_VIDEOS.length);
    for (const video of result) {
      expect(video.title).toMatch(/\(updated\)$/);
      expect(video.viewCount).toBe(9999);
    }
  });

  it('is idempotent — re-inserting same data leaves row count unchanged', async () => {
    await batchUpsertVideos(TEST_VIDEOS);
    await batchUpsertVideos(TEST_VIDEOS);

    const db = getDb();
    const result = await db
      .select()
      .from(videos)
      .where(inArray(videos.id, TEST_VIDEOS.map((v) => v.id)));

    expect(result).toHaveLength(TEST_VIDEOS.length);
  });
});
