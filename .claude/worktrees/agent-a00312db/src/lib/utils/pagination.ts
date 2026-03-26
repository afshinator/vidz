export interface PaginationParams {
  limit: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export function getPaginationCursor<T extends { publishedAt: Date }>(
  items: T[],
  limit: number
): PaginatedResult<T> {
  if (items.length <= limit) {
    return { data: items, hasMore: false };
  }
  const data = items.slice(0, limit);
  const nextCursor = items[limit - 1].publishedAt.toISOString();
  return { data, nextCursor, hasMore: true };
}

export function createCursorFromDate(date: Date): string {
  return date.toISOString();
}

export function parseCursor(cursor: string | undefined): Date | undefined {
  if (!cursor) return undefined;
  const parsed = new Date(cursor);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}