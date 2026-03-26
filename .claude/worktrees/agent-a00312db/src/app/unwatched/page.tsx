import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getUnwatchedVideosWithChannelTags, getNotedVideoIds, getChannelsByUser } from '@/lib/db/queries';
import { Header } from '@/components/layout/header';
import { EmptyState } from '@/components/ui/empty-state';
import { SidebarChannelList } from '@/components/layout/sidebar-extra';
import { UnwatchedClient } from './unwatched-client';

export default async function UnwatchedPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  const [videos, channels, notedVideoIds] = await Promise.all([
    getUnwatchedVideosWithChannelTags(session.user.id),
    getChannelsByUser(session.user.id),
    getNotedVideoIds(session.user.id),
  ]);

  return (
    <>
      <SidebarChannelList channels={channels} />
      <Header title="Unwatched" />

      {videos.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="All caught up!"
            description="No unwatched videos. Sync your subscriptions to check for new content."
          />
        </div>
      ) : (
        <UnwatchedClient videos={videos} notedVideoIds={notedVideoIds} />
      )}
    </>
  );
}
