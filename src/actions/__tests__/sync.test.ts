import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
