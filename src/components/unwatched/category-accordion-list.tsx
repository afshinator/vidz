'use client';

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { VideoCard } from '@/components/video/video-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Video } from '@/lib/db/schema';

type UnwatchedVideo = Video & { channelTitle: string };

export interface CategoryGroup {
  name: string;
  slug: string;
  videos: UnwatchedVideo[];
}

export function CategoryAccordionList({ groups }: { groups: CategoryGroup[] }) {
  const allSlugs = groups.map((g) => g.slug);
  const [openItems, setOpenItems] = useState<string[]>(allSlugs);

  const allOpen = openItems.length === groups.length;

  return (
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
                <span className="text-base font-semibold">{group.name}</span>
                <Badge variant="secondary">{group.videos.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="[&_a]:no-underline pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {group.videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    channelTitle={video.channelTitle}
                    isWatched={false}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
