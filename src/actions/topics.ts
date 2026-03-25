'use server';

import { auth } from '@/auth';
import { createTopic, updateTopic, deleteTopic, getTopicsByUser, getTopicById } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const topicSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['keyword', 'category']),
  keywords: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  color: z.string().optional(),
});

export async function createTopicAction(data: z.infer<typeof topicSchema>) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  const validated = topicSchema.parse(data);
  
  await createTopic({
    userId: session.user.id,
    name: validated.name,
    type: validated.type,
    keywords: validated.keywords,
    categoryId: validated.categoryId,
    color: validated.color,
  });
  
  revalidatePath('/topics');
}

export async function updateTopicAction(
  topicId: string,
  data: Partial<z.infer<typeof topicSchema>>
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  const topic = await getTopicById(topicId, session.user.id);
  if (!topic) {
    throw new Error('Not found');
  }
  
  await updateTopic(topicId, session.user.id, {
    name: data.name,
    keywords: data.keywords,
    categoryId: data.categoryId,
    color: data.color,
  });
  
  revalidatePath('/topics');
  revalidatePath(`/topics/${topicId}`);
}

export async function deleteTopicAction(topicId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  const topic = await getTopicById(topicId, session.user.id);
  if (!topic) {
    throw new Error('Not found');
  }
  
  await deleteTopic(topicId, session.user.id);
  
  revalidatePath('/topics');
}