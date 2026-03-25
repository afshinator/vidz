'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function syncNowAction() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  // This will be implemented with YouTube API sync
  // For now, just revalidate
  revalidatePath('/');
  revalidatePath('/channels');
  revalidatePath('/topics');
  
  return { success: true, message: 'Sync triggered' };
}