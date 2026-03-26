import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getWatchedVideosWithTags } from '@/lib/db/queries';
import { Header } from '@/components/layout/header';
import { HistoryClient } from './history-client';

const RANGES = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: null,
} as const;

export type HistoryRange = keyof typeof RANGES;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/api/auth/signin');

  const { range: rawRange } = await searchParams;
  const range: HistoryRange = rawRange && rawRange in RANGES ? (rawRange as HistoryRange) : '7d';

  const days = RANGES[range];
  const since = days != null ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined;

  const videos = await getWatchedVideosWithTags(session.user.id, since);

  return (
    <>
      <Header title="History" />
      <HistoryClient videos={videos} currentRange={range} />
    </>
  );
}
