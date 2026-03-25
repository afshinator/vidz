import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getTopicsByUser } from '@/lib/db/queries';
import { Header } from '@/components/layout/header';
import { TopicCard } from '@/components/topic/topic-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default async function TopicsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }
  
  const topics = await getTopicsByUser(session.user.id);
  
  return (
    <>
      <Header
        title="Topics"
        subtitle="Organize videos by topic"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Topic
          </Button>
        }
      />
      
      <div className="mt-6">
        {topics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No topics yet"
            description="Create topics to organize videos by subject matter"
            action={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Topic
              </Button>
            }
          />
        )}
      </div>
    </>
  );
}