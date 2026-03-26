import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getChannelsWithTags, getTagsByUser } from '@/lib/db/queries';
import { Header } from '@/components/layout/header';
import { CreateTagDialog } from '@/components/topic/create-tag-dialog';
import { TopicsClient } from '@/components/topic/topics-client';

export default async function TopicsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  const [channels, allTags] = await Promise.all([
    getChannelsWithTags(session.user.id),
    getTagsByUser(session.user.id),
  ]);

  return (
    <>
      <Header
        title="Topics"
        subtitle="Group your channels by topic"
        actions={<CreateTagDialog />}
        showViewToggle={false}
      />
      <TopicsClient channels={channels} allTags={allTags} />
    </>
  );
}
