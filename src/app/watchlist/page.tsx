import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getWatchlistByUser } from '@/lib/db/queries';
import { Header } from '@/components/layout/header';
import { EmptyState } from '@/components/ui/empty-state';
import { WatchlistClient } from './watchlist-client';

export default async function WatchlistPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  const watchlist = await getWatchlistByUser(session.user.id);

  return (
    <>
      <Header title="Watchlist" subtitle="Videos you want to watch later" showViewToggle={false} />
      <div className="p-6">
        {watchlist.length === 0 ? (
          <EmptyState
            title="No videos in watchlist"
            description="Click any video and choose 'Add to Watchlist' to save it here."
          />
        ) : (
          <WatchlistClient items={watchlist} />
        )}
      </div>
    </>
  );
}
