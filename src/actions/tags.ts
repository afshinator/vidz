'use server';

import { auth } from '@/auth';
import { createTag, deleteTag, assignTagToChannel, removeTagFromChannel } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import type { Tag } from '@/lib/db/schema';

export async function createTagAction(name: string, color: string): Promise<Tag> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const tag = await createTag({ userId: session.user.id, name, color });
  revalidatePath('/topics');
  return tag;
}

export async function deleteTagAction(tagId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  await deleteTag(tagId, session.user.id);
  revalidatePath('/topics');
}

export async function assignTagToChannelAction(channelId: string, tagId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  await assignTagToChannel(channelId, tagId);
  revalidatePath('/topics');
}

export async function removeTagFromChannelAction(channelId: string, tagId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  await removeTagFromChannel(channelId, tagId);
  revalidatePath('/topics');
}
