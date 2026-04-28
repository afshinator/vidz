import { describe, it, expect } from 'vitest';
import { groupByTag } from '../video-grouping';
import type { UnwatchedVideoWithTags } from '@/lib/db/queries';

// Mock video factory
function makeVideo(overrides: Partial<UnwatchedVideoWithTags> = {}): UnwatchedVideoWithTags {
  return {
    id: 'vid1',
    channelId: 'chan1',
    title: 'Test Video',
    description: null,
    thumbnail: null,
    publishedAt: new Date('2024-01-01'),
    duration: null,
    viewCount: null,
    categoryId: null,
    fetchedAt: null,
    channelTitle: 'Test Channel',
    tags: [],
    ...overrides,
  };
}

describe('groupByTag', () => {
  it('should return ALL videos without artificial limit', () => {
    // Create 20 videos with the same tag
    const videos = Array.from({ length: 20 }, (_, i) =>
      makeVideo({
        id: `vid${i}`,
        title: `Video ${i}`,
        tags: [{ id: 'tag1', name: 'Programming', color: '#3b82f6' }],
      })
    );

    const result = groupByTag(videos);

    expect(result).toHaveLength(1);
    expect(result[0].videos).toHaveLength(20); // No limit!
  });

  it('should handle uncategorized videos without limit', () => {
    const videos = Array.from({ length: 15 }, (_, i) =>
      makeVideo({
        id: `vid${i}`,
        title: `Video ${i}`,
        tags: [],
      })
    );

    const result = groupByTag(videos);

    const uncategorized = result.find(g => g.id === 'uncategorized');
    expect(uncategorized).toBeDefined();
    expect(uncategorized!.videos).toHaveLength(15); // No limit!
  });

  it('should truncate videos that appear in multiple tags (once per tag)', () => {
    const video = makeVideo({
      id: 'vid1',
      tags: [
        { id: 'tag1', name: 'JavaScript', color: '#yellow' },
        { id: 'tag2', name: 'React', color: '#blue' },
      ],
    });

    const result = groupByTag([video]);

    expect(result).toHaveLength(2);
    expect(result[0].videos).toHaveLength(1);
    expect(result[1].videos).toHaveLength(1);
  });
});
