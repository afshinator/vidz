import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getUnwatchedVideos, getTopicsByUser, getChannelsByUser } from '@/lib/db/queries';
import { Header } from '@/components/layout/header';
import { VideoCard } from '@/components/video/video-card';
import { TopicCard } from '@/components/topic/topic-card';
import { ChannelCard } from '@/components/channel/channel-card';
import { EmptyState } from '@/components/ui/empty-state';
import { SyncButton } from '@/components/sync-button';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }
  
  const [unwatchedVideosResult, topics, channels] = await Promise.all([
    getUnwatchedVideos(session.user.id, 8),
    getTopicsByUser(session.user.id).then(t => t.slice(0, 4)),
    getChannelsByUser(session.user.id).then(c => c.slice(0, 4)),
  ]);
  const unwatchedVideos = unwatchedVideosResult.data;
  
  return (
    <>
      <Header
        title="Dashboard"
        subtitle={`Welcome back${session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''}`}
        actions={<SyncButton />}
      />
      
      <div className="mt-6 space-y-8">
        {unwatchedVideos.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Unwatched ({unwatchedVideos.length})
              </h2>
              <Link href="/?filter=unwatched">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {unwatchedVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  channelTitle={video.channelTitle}
                  isWatched={false}
                />
              ))}
            </div>
          </section>
        )}
        
        {topics.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Topics</h2>
              <Link href="/topics">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          </section>
        )}
        
        {channels.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Channels</h2>
              <Link href="/channels">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {channels.map((channel) => (
                <Link key={channel.id} href={`/channels/${channel.id}`}>
                  <ChannelCard channel={channel} />
                </Link>
              ))}
            </div>
          </section>
        )}
        
        {unwatchedVideos.length === 0 && topics.length === 0 && channels.length === 0 && (
          <EmptyState
            title="No data yet"
            description="Sync your YouTube subscriptions to get started"
            action={<SyncButton />}
          />
        )}
      </div>
    </>
  );
}