import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getUnwatchedVideos } from '@/lib/db/queries';
import { Header } from '@/components/layout/header';
import { VideoCard } from '@/components/video/video-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Video } from '@/lib/db/schema';

type UnwatchedVideo = Video & { channelTitle: string };

interface ChannelGroup {
  channelId: string;
  channelTitle: string;
  videos: UnwatchedVideo[];
}

function groupByChannel(videos: UnwatchedVideo[]): ChannelGroup[] {
  const map = new Map<string, ChannelGroup>();

  for (const video of videos) {
    const key = video.channelId ?? '__unknown__';
    let group = map.get(key);
    if (!group) {
      group = { channelId: key, channelTitle: video.channelTitle, videos: [] };
      map.set(key, group);
    }
    group.videos.push(video);
  }

  // Sort videos within each group by publishedAt descending
  for (const group of map.values()) {
    group.videos.sort((a, b) => {
      const aTime = a.publishedAt?.getTime() ?? 0;
      const bTime = b.publishedAt?.getTime() ?? 0;
      return bTime - aTime;
    });
  }

  // Sort groups by video count descending
  return Array.from(map.values()).sort((a, b) => b.videos.length - a.videos.length);
}

export default async function UnwatchedPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  const result = await getUnwatchedVideos(session.user.id, 200);
  const allVideos = result.data;
  const groups = groupByChannel(allVideos);
  const totalCount = allVideos.length;
  const channelCount = groups.length;

  const summaryText =
    totalCount === 0
      ? 'All caught up!'
      : `${totalCount} unwatched ${totalCount === 1 ? 'video' : 'videos'} across ${channelCount} ${channelCount === 1 ? 'channel' : 'channels'}`;

  return (
    <>
      <Header title="Unwatched" subtitle={summaryText} />

      <div className="mt-6 space-y-2">
        {totalCount > 0 && (
          <Card className="mb-6">
            <CardContent className="flex flex-wrap items-center gap-4 py-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{totalCount}</span>
                <span className="text-sm text-muted-foreground">
                  unwatched {totalCount === 1 ? 'video' : 'videos'}
                </span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{channelCount}</span>
                <span className="text-sm text-muted-foreground">
                  {channelCount === 1 ? 'channel' : 'channels'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {totalCount === 0 ? (
          <EmptyState
            title="All caught up!"
            description="No unwatched videos. Sync your subscriptions to check for new content."
          />
        ) : (
          <div className="space-y-10">
            {groups.map((group) => (
              <section key={group.channelId}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-semibold">{group.channelTitle}</h2>
                  <Badge variant="secondary">{group.videos.length}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {group.videos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      channelTitle={group.channelTitle}
                      isWatched={false}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
