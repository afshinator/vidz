"use server";

import { auth } from "@/auth";
import { getUnwatchedVideosPaginated } from "@/lib/db/queries";
import type { UnwatchedVideoWithTags, PaginatedResult } from "@/lib/db/queries";

export async function loadMoreUnwatchedAction(
  limit: number,
  options?: {
    cursor?: string;
    sortBy?: "publishedAt" | "title" | "channelTitle";
    sortDir?: "asc" | "desc";
  },
): Promise<PaginatedResult<UnwatchedVideoWithTags>> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return getUnwatchedVideosPaginated(session.user.id, limit, options);
}
