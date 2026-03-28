'use server';

import { auth } from '@/auth';
import { markVideoWatched, markVideoUnwatched, getVideoById, addToWatchlist, removeFromWatchlist } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';

async function verifyVideoOwnership(videoId: string, userId: string) {
  const video = await getVideoById(videoId, userId);
  if (!video) {
    throw new Error('Video not found');
  }
}

export async function toggleWatched(videoId: string, currentlyWatched: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  await verifyVideoOwnership(videoId, session.user.id);
  
  if (currentlyWatched) {
    await markVideoUnwatched(videoId);
  } else {
    await markVideoWatched(videoId);
  }
  
  revalidatePath('/');
  revalidatePath('/tags');
  revalidatePath('/channels');
}

export async function markAsWatchedAction(videoId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  await verifyVideoOwnership(videoId, session.user.id);
  await markVideoWatched(videoId);
  revalidatePath('/');
  revalidatePath('/unwatched');
  revalidatePath('/tags');
  revalidatePath('/channels');
}

export async function markAsUnwatchedAction(videoId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  await verifyVideoOwnership(videoId, session.user.id);
  await markVideoUnwatched(videoId);
  revalidatePath('/');
  revalidatePath('/tags');
  revalidatePath('/channels');
}

export async function addToWatchlistAction(videoId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  await verifyVideoOwnership(videoId, session.user.id);
  await addToWatchlist(session.user.id, videoId);
  revalidatePath('/watchlist');
}

export async function removeFromWatchlistAction(watchlistId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  await removeFromWatchlist(watchlistId, session.user.id);
  revalidatePath('/watchlist');
}