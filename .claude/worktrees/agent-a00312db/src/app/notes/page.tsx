import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getVideoNotesByUser } from '@/lib/db/queries';
import { Header } from '@/components/layout/header';
import { EmptyState } from '@/components/ui/empty-state';
import { NotesClient } from './notes-client';

export default async function NotesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  const notes = await getVideoNotesByUser(session.user.id);

  return (
    <>
      <Header title="Notes" subtitle="Videos you've saved for later" showViewToggle={false} />
      <div className="p-6">
        {notes.length === 0 ? (
          <EmptyState
            title="No saved notes"
            description="Click any video and choose 'Save to Notes' to save it here."
          />
        ) : (
          <NotesClient notes={notes} />
        )}
      </div>
    </>
  );
}
