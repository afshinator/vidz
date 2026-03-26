'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { addVideoNote, deleteVideoNote } from '@/lib/db/queries';
import type { VideoNote } from '@/lib/db/schema';

export async function addNoteAction(videoId: string, notes?: string): Promise<VideoNote> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }
  const note = await addVideoNote({ userId: session.user.id, videoId, notes });
  revalidatePath('/notes');
  return note;
}

export async function deleteNoteAction(noteId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }
  await deleteVideoNote(noteId, session.user.id);
  revalidatePath('/notes');
}
