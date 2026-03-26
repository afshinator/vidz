'use server';

import { auth } from '@/auth';
import { getSettingsByUser, upsertSettings } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';

export async function getSettingsAction() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  const settings = await getSettingsByUser(session.user.id);
  return settings;
}

export async function updateSettingsAction(data: {
  theme?: 'light' | 'dark' | 'system';
  timezone?: string;
  syncIntervalMinutes?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  await upsertSettings(session.user.id, data);
  revalidatePath('/settings');
}