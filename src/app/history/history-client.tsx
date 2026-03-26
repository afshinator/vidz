'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { VideoGrid } from '@/components/video/video-grid';
import type { WatchedVideoWithTags } from '@/lib/db/queries';
import type { HistoryRange } from './page';

type ViewMode = 'by-tag' | 'chronological';

interface TagGroup {
  id: string;
  name: string;
  color: string;
  slug: string;
  videos: WatchedVideoWithTags[];
}

const RANGE_LABELS: Record<HistoryRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  all: 'All time',
};

const RANGES: HistoryRange[] = ['7d', '30d', '90d', 'all'];

function groupByTag(videos: WatchedVideoWithTags[]): TagGroup[] {
  const map = new Map<string, TagGroup>();
  const uncategorized: WatchedVideoWithTags[] = [];

  for (const video of videos) {
    if (video.tags.length === 0) {
      uncategorized.push(video);
    } else {
      for (const tag of video.tags) {
        if (!map.has(tag.id)) {
          map.set(tag.id, {
            id: tag.id,
            name: tag.name,
            color: tag.color,
            slug: tag.name.toLowerCase().replace(/\s+/g, '-'),
            videos: [],
          });
        }
        map.get(tag.id)!.videos.push(video);
      }
    }
  }

  const groups = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));

  if (uncategorized.length > 0) {
    groups.push({
      id: 'uncategorized',
      name: 'Uncategorized',
      color: '#6b7280',
      slug: 'uncategorized',
      videos: uncategorized,
    });
  }

  return groups;
}

export function HistoryClient({
  videos,
  currentRange,
}: {
  videos: WatchedVideoWithTags[];
  currentRange: HistoryRange;
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('by-tag');
  const [openItems, setOpenItems] = useState<string[]>([]);

  const groups = groupByTag(videos);
  const allSlugs = groups.map((g) => g.slug);
  const allOpen = openItems.length === groups.length && groups.length > 0;

  return (
    <div className="mt-6 space-y-6">
      {/* Controls bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          {RANGES.map((r) => (
            <Button
              key={r}
              variant={currentRange === r ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => router.push(`/history?range=${r}`)}
            >
              {RANGE_LABELS[r]}
            </Button>
          ))}
        </div>

        <div className="flex items-center border rounded-lg p-0.5">
          <Button
            variant={viewMode === 'by-tag' ? 'secondary' : 'ghost'}
            size="sm"
            className="text-xs"
            onClick={() => setViewMode('by-tag')}
          >
            By Tag
          </Button>
          <Button
            variant={viewMode === 'chronological' ? 'secondary' : 'ghost'}
            size="sm"
            className="text-xs"
            onClick={() => setViewMode('chronological')}
          >
            Chronological
          </Button>
        </div>
      </div>

      {videos.length === 0 ? (
        <EmptyState
          title="No watch history"
          description={`No videos watched in the ${RANGE_LABELS[currentRange].toLowerCase()}.`}
        />
      ) : (
        <>
          {/* Summary card */}
          <Card>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold font-heading">{videos.length}</span>
                  <span className="text-sm text-muted-foreground">
                    {videos.length === 1 ? 'video' : 'videos'} watched
                  </span>
                </div>
                {viewMode === 'by-tag' && (
                  <>
                    <div className="h-6 w-px bg-border" />
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold font-heading">{groups.length}</span>
                      <span className="text-sm text-muted-foreground">
                        {groups.length === 1 ? 'tag' : 'tags'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {viewMode === 'by-tag' && (
                <div className="flex flex-wrap gap-1.5">
                  {groups.map((g) => (
                    <a key={g.slug} href={`#${g.slug}`}>
                      <Badge
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
                          style={{ backgroundColor: g.color }}
                        />
                        {g.name}
                        <span className="ml-1.5 font-semibold tabular-nums">{g.videos.length}</span>
                      </Badge>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {viewMode === 'by-tag' ? (
            <div>
              <div className="flex justify-end mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => setOpenItems(allOpen ? [] : allSlugs)}
                >
                  {allOpen ? 'Collapse all' : 'Expand all'}
                </Button>
              </div>
              <Accordion
                type="multiple"
                value={openItems}
                onValueChange={setOpenItems}
                className="space-y-2"
              >
                {groups.map((group) => (
                  <AccordionItem
                    key={group.slug}
                    value={group.slug}
                    id={group.slug}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="text-base font-semibold">{group.name}</span>
                        <Badge variant="secondary">{group.videos.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="[&_a]:no-underline pb-4 pt-2">
                      <VideoGrid videos={group.videos} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ) : (
            <VideoGrid videos={videos} />
          )}
        </>
      )}
    </div>
  );
}
