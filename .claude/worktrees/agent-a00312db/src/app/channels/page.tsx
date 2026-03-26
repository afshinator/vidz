import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getChannelsByUser } from '@/lib/db/queries';
import { Header } from '@/components/layout/header';
import { ChannelCard } from '@/components/channel/channel-card';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';

export default async function ChannelsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }
  
  const channels = await getChannelsByUser(session.user.id);
  
  return (
    <>
      <Header
        title="Channels"
        subtitle={`${channels.length} subscription${channels.length !== 1 ? 's' : ''}`}
      />
      
      <div className="mt-6">
        {channels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((channel) => (
              <Link key={channel.id} href={`/channels/${channel.id}`}>
                <ChannelCard channel={channel} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No subscriptions"
            description="Sync your YouTube subscriptions to see your channels here"
          />
        )}
      </div>
    </>
  );
}