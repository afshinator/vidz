'use server';

import { auth } from '@/auth';
import { markVideoWatched, markVideoUnwatched } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';

export async function toggleWatched(videoId: string, currentlyWatched: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  if (currentlyWatched) {
    await markVideoUnwatched(videoId);
  } else {
    await markVideoWatched(videoId);
  }
  
  revalidatePath('/');
  revalidatePath('/topics');
  revalidatePath('/channels');
}

export async function markAsWatchedAction(videoId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  await markVideoWatched(videoId);
  revalidatePath('/');
  revalidatePath('/topics');
  revalidatePath('/channels');
}

export async function markAsUnwatchedAction(videoId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  await markVideoUnwatched(videoId);
  revalidatePath('/');
  revalidatePath('/topics');
  revalidatePath('/channels');
}