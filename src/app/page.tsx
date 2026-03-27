import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getUnwatchedVideosWithChannelTags, getNotedVideoIds } from '@/lib/db/queries';
import { Header } from '@/components/layout/header';
import { VideoGrid } from '@/components/video/video-grid';
import { EmptyState } from '@/components/ui/empty-state';
import { SyncButton } from '@/components/sync-button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { UnwatchedVideoWithTags } from '@/lib/db/queries';

const TAG_LIMIT = 8;

interface TagGroup {
  id: string;
  name: string;
  color: string;
  videos: UnwatchedVideoWithTags[];
}

function groupByTag(videos: UnwatchedVideoWithTags[]): TagGroup[] {
  const map = new Map<string, TagGroup>();
  const uncategorized: UnwatchedVideoWithTags[] = [];

  for (const video of videos) {
    if (video.tags.length === 0) {
      if (uncategorized.length < TAG_LIMIT) uncategorized.push(video);
    } else {
      for (const tag of video.tags) {
        if (!map.has(tag.id)) {
          map.set(tag.id, { id: tag.id, name: tag.name, color: tag.color, videos: [] });
        }
        const group = map.get(tag.id)!;
        if (group.videos.length < TAG_LIMIT) group.videos.push(video);
      }
    }
  }

  const groups = Array.from(map.values())
    .filter((g) => g.videos.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (uncategorized.length > 0) {
    groups.push({ id: 'uncategorized', name: 'Uncategorized', color: '#6b7280', videos: uncategorized });
  }

  return groups;
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  const [allUnwatched, notedVideoIds] = await Promise.all([
    getUnwatchedVideosWithChannelTags(session.user.id),
    getNotedVideoIds(session.user.id),
  ]);
  const notedIds = new Set(notedVideoIds);
  const tagGroups = groupByTag(allUnwatched);
  const totalUnwatched = allUnwatched.length;

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={`Welcome back${session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''}`}
        actions={<SyncButton />}
      />

      <div className="space-y-8">
        {tagGroups.length > 0 ? (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Unwatched <span className="text-muted-foreground font-normal text-base">({totalUnwatched})</span>
              </h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/unwatched">
                  View All <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <Accordion
              type="multiple"
              defaultValue={tagGroups[0] ? [tagGroups[0].id] : []}
              className="space-y-2"
            >
              {tagGroups.map((group) => (
                <AccordionItem
                  key={group.id}
                  value={group.id}
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
                  <AccordionContent className="pb-4 pt-2">
                    <VideoGrid
                      videos={group.videos.map((v) => ({
                        ...v,
                        isWatched: false,
                        hasNote: notedIds.has(v.id),
                      }))}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ) : (
          <EmptyState
            title="All caught up!"
            description="No unwatched videos. Sync your subscriptions to check for new content."
            action={<SyncButton />}
          />
        )}
      </div>
    </>
  );
}
