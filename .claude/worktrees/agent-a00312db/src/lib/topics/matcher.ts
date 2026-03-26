import type { Video } from '@/lib/db/schema';

export function matchesKeyword(video: Video, keyword: string): boolean {
  const lowerKeyword = keyword.toLowerCase();
  return (
    video.title.toLowerCase().includes(lowerKeyword) ||
    video.description?.toLowerCase().includes(lowerKeyword) ||
    false
  );
}

export function matchesTopic(video: Video, keywords: string[]): boolean {
  if (!keywords.length) return true;
  return keywords.some((kw) => matchesKeyword(video, kw));
}

export function filterByTopicKeywords(videos: Video[], keywords: string[]): Video[] {
  return videos.filter((video) => matchesTopic(video, keywords));
}