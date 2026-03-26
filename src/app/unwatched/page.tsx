import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getUnwatchedVideos, getTopicsByUser, getChannelsByUser } from '@/lib/db/queries';
import { Header } from '@/components/layout/header';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SidebarChannelList } from '@/components/layout/sidebar-extra';
import { CategoryAccordionList } from '@/components/unwatched/category-accordion-list';
import type { CategoryGroup } from '@/components/unwatched/category-accordion-list';
import { matchesTopic } from '@/lib/topics/matcher';
import { getCategoryById } from '@/lib/topics/categorizer';
import type { Video, Topic } from '@/lib/db/schema';

type UnwatchedVideo = Video & { channelTitle: string };

function groupByCategory(videos: UnwatchedVideo[], topics: Topic[]): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();

  for (const video of videos) {
    let categoryName = 'Uncategorized';

    // Topic match first (keyword-based personal categories)
    for (const topic of topics) {
      if (topic.keywords?.length && matchesTopic(video, topic.keywords)) {
        categoryName = topic.name;
        break;
      }
    }

    // Fall back to YouTube built-in category
    if (categoryName === 'Uncategorized' && video.categoryId) {
      const ytCategory = getCategoryById(video.categoryId);
      if (ytCategory) categoryName = ytCategory.name;
    }

    const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
    let group = map.get(categoryName);
    if (!group) {
      group = { name: categoryName, slug, videos: [] };
      map.set(categoryName, group);
    }
    group.videos.push(video);
  }

  // Sort alphabetically, Uncategorized always last
  return Array.from(map.values()).sort((a, b) => {
    if (a.name === 'Uncategorized') return 1;
    if (b.name === 'Uncategorized') return -1;
    return a.name.localeCompare(b.name);
  });
}

export default async function UnwatchedPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  const [result, topics, channels] = await Promise.all([
    getUnwatchedVideos(session.user.id, 500),
    getTopicsByUser(session.user.id),
    getChannelsByUser(session.user.id),
  ]);

  const allVideos = result.data;
  const groups = groupByCategory(allVideos, topics);
  const totalCount = allVideos.length;
  const categoryCount = groups.length;

  return (
    <>
      <SidebarChannelList channels={channels} />
      <Header title="Unwatched" />

      {totalCount === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="All caught up!"
            description="No unwatched videos. Sync your subscriptions to check for new content."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Summary + category anchor links */}
          <Card>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{totalCount}</span>
                  <span className="text-sm text-muted-foreground">
                    unwatched {totalCount === 1 ? 'video' : 'videos'}
                  </span>
                </div>
                <div className="h-6 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{categoryCount}</span>
                  <span className="text-sm text-muted-foreground">
                    {categoryCount === 1 ? 'category' : 'categories'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {groups.map((group) => (
                  <a key={group.slug} href={`#${group.slug}`}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-muted-foreground/20 transition-colors">
                      {group.name}
                      <span className="ml-1.5 text-muted-foreground">{group.videos.length}</span>
                    </Badge>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          <CategoryAccordionList groups={groups} />
        </div>
      )}
    </>
  );
}
