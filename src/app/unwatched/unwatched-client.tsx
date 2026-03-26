'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryAccordionList } from '@/components/unwatched/category-accordion-list';
import type { CategoryGroup } from '@/components/unwatched/category-accordion-list';
import { ChannelsCloud } from '@/components/unwatched/channels-cloud';
import type { ChannelCount } from '@/components/unwatched/channels-cloud';
import { getCategoryById } from '@/lib/topics/categorizer';
import type { UnwatchedVideoWithTags } from '@/lib/db/queries';

type GroupMode = 'category' | 'tag';

function groupByYTCategory(videos: UnwatchedVideoWithTags[]): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();

  for (const video of videos) {
    let name = 'Uncategorized';
    if (video.categoryId) {
      const cat = getCategoryById(video.categoryId);
      if (cat) name = cat.name;
    }
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    if (!map.has(name)) map.set(name, { name, slug, videos: [] });
    map.get(name)!.videos.push(video);
  }

  const groups = Array.from(map.values()).sort((a, b) => {
    if (a.name === 'Uncategorized') return 1;
    if (b.name === 'Uncategorized') return -1;
    return a.name.localeCompare(b.name);
  });
  for (const g of groups) g.videos.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  return groups;
}

function groupByTag(videos: UnwatchedVideoWithTags[]): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();
  const uncategorized: UnwatchedVideoWithTags[] = [];

  for (const video of videos) {
    if (video.tags.length === 0) {
      uncategorized.push(video);
    } else {
      for (const tag of video.tags) {
        const slug = tag.name.toLowerCase().replace(/\s+/g, '-');
        if (!map.has(tag.id)) map.set(tag.id, { name: tag.name, slug, color: tag.color, videos: [] });
        map.get(tag.id)!.videos.push(video);
      }
    }
  }

  const byChannel = (a: UnwatchedVideoWithTags, b: UnwatchedVideoWithTags) =>
    (a.channelTitle ?? '').localeCompare(b.channelTitle ?? '') ||
    b.publishedAt.getTime() - a.publishedAt.getTime();

  const groups = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  for (const g of groups) (g.videos as UnwatchedVideoWithTags[]).sort(byChannel);

  if (uncategorized.length > 0) {
    uncategorized.sort(byChannel as (a: UnwatchedVideoWithTags, b: UnwatchedVideoWithTags) => number);
    groups.push({ name: 'Uncategorized', slug: 'uncategorized', color: '#6b7280', videos: uncategorized });
  }
  return groups;
}

function countByChannel(videos: UnwatchedVideoWithTags[]): ChannelCount[] {
  const map = new Map<string, ChannelCount>();
  for (const video of videos) {
    if (!video.channelId) continue;
    const entry = map.get(video.channelId);
    if (entry) entry.count++;
    else map.set(video.channelId, { id: video.channelId, title: video.channelTitle, count: 1 });
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function UnwatchedClient({ videos, notedVideoIds }: { videos: UnwatchedVideoWithTags[]; notedVideoIds: string[] }) {
  const [mode, setMode] = useState<GroupMode>('tag');

  const notedSet = new Set(notedVideoIds);
  const groups = mode === 'tag' ? groupByTag(videos) : groupByYTCategory(videos);
  for (const g of groups) {
    g.videos = g.videos.map((v) => ({ ...v, hasNote: notedSet.has(v.id) }));
  }
  const channelCounts = countByChannel(videos);
  const totalCount = videos.length;

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-heading">{totalCount}</span>
                <span className="text-sm text-muted-foreground">
                  unwatched {totalCount === 1 ? 'video' : 'videos'}
                </span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-heading">{groups.length}</span>
                <span className="text-sm text-muted-foreground">
                  {mode === 'tag' ? (groups.length === 1 ? 'tag' : 'tags') : (groups.length === 1 ? 'category' : 'categories')}
                </span>
              </div>
            </div>

            <div className="flex items-center border rounded-lg p-0.5">
              <Button
                variant={mode === 'category' ? 'secondary' : 'ghost'}
                size="sm"
                className="text-xs"
                onClick={() => setMode('category')}
              >
                YouTube Categories
              </Button>
              <Button
                variant={mode === 'tag' ? 'secondary' : 'ghost'}
                size="sm"
                className="text-xs"
                onClick={() => setMode('tag')}
              >
                Tags
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {groups.map((group) => (
              <a key={group.slug} href={`#${group.slug}`}>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {group.color && (
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                  )}
                  {group.name}
                  <span className="ml-1.5 font-semibold tabular-nums">{group.videos.length}</span>
                </Badge>
              </a>
            ))}
          </div>

          <ChannelsCloud channels={channelCounts} />
        </CardContent>
      </Card>

      <CategoryAccordionList groups={groups} />
    </div>
  );
}
