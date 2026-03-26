import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { getChannelById, getVideosByChannel } from '@/lib/db/queries';
import { Header } from '@/components/layout/header';
import { VideoCard } from '@/components/video/video-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChannelPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  const { id } = await params;
  const [channel, videosResult] = await Promise.all([
    getChannelById(id, session.user.id),
    getVideosByChannel(id, session.user.id, 50),
  ]);

  if (!channel) notFound();

  const videos = videosResult.data;

  return (
    <>
      <Header
        title={channel.title}
        subtitle={`${videos.length} video${videos.length !== 1 ? 's' : ''}`}
        actions={
          <Avatar className="h-10 w-10">
            <AvatarImage src={channel.thumbnail || undefined} alt={channel.title} />
            <AvatarFallback>{channel.title.charAt(0)}</AvatarFallback>
          </Avatar>
        }
      />

      <div className="mt-6">
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                channelTitle={channel.title}
                isWatched={false}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No videos"
            description="No videos have been synced for this channel yet"
          />
        )}
      </div>
    </>
  );
}
