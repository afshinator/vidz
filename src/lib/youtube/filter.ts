import type { Video } from '@/lib/db/schema';

export function filterByKeywords(videos: Video[], keywords: string[]): Video[] {
  if (!keywords.length) return videos;
  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  return videos.filter((video) =>
    lowerKeywords.some(
      (kw) =>
        video.title.toLowerCase().includes(kw) ||
        video.description?.toLowerCase().includes(kw)
    )
  );
}

export function filterByCategory(
  videos: Video[],
  _categoryId: string
): Video[] {
  return videos;
}

export function matchVideoToTopic(
  video: Video,
  topic: { type: string; keywords: string[]; categoryId?: string | null }
): boolean {
  if (topic.type === 'keyword' && topic.keywords?.length) {
    return filterByKeywords([video], topic.keywords).length === 1;
  }
  if (topic.type === 'category' && topic.categoryId) {
    return filterByCategory([video], topic.categoryId).length === 1;
  }
  return false;
}