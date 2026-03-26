import { eq, desc, and, sql, isNull, lt } from 'drizzle-orm';
import { getDb } from './client';
import {
  channels,
  videos,
  watched,
  topics,
  tags,
  videoTags,
  channelTags,
  syncState,
  appSettings,
} from './schema';
import type { Channel, Video, Topic, Tag, AppSettings } from './schema';

export interface PaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export function getChannelsByUser(userId: string): Promise<Channel[]> {
  return getDb()
    .select()
    .from(channels)
    .where(eq(channels.userId, userId))
    .orderBy(desc(channels.title));
}

export function getChannelById(channelId: string, userId: string): Promise<Channel | undefined> {
  return getDb()
    .select()
    .from(channels)
    .where(and(eq(channels.id, channelId), eq(channels.userId, userId)))
    .limit(1)
    .then((r) => r[0]);
}

export function getVideosByChannel(
  channelId: string,
  userId: string,
  limit = 20,
  cursor?: string
): Promise<PaginatedResult<Video & { isWatched: boolean }>> {
  return getDb()
    .select({
      id: videos.id,
      channelId: videos.channelId,
      title: videos.title,
      description: videos.description,
      thumbnail: videos.thumbnail,
      publishedAt: videos.publishedAt,
      duration: videos.duration,
      viewCount: videos.viewCount,
      categoryId: videos.categoryId,
      fetchedAt: videos.fetchedAt,
      watchedAt: watched.watchedAt,
    })
    .from(videos)
    .innerJoin(channels, eq(videos.channelId, channels.id))
    .leftJoin(watched, eq(watched.videoId, videos.id))
    .where(
      and(
        eq(videos.channelId, channelId),
        eq(channels.userId, userId),
        ...(cursor ? [lt(videos.publishedAt, new Date(cursor))] : [])
      )
    )
    .orderBy(desc(videos.publishedAt))
    .limit(limit + 1)
    .then((rows) => {
      const hasMore = rows.length > limit;
      const data = (hasMore ? rows.slice(0, -1) : rows).map((r) => ({
        id: r.id,
        channelId: r.channelId,
        title: r.title,
        description: r.description,
        thumbnail: r.thumbnail,
        publishedAt: r.publishedAt,
        duration: r.duration,
        viewCount: r.viewCount,
        categoryId: r.categoryId,
        fetchedAt: r.fetchedAt,
        isWatched: r.watchedAt !== null,
      }));
      const nextCursor = hasMore && data.length > 0
        ? data[data.length - 1].publishedAt?.toISOString()
        : undefined;
      return { data, nextCursor, hasMore };
    });
}

export function getRecentVideos(limit = 50): Promise<Video[]> {
  return getDb().select().from(videos).orderBy(desc(videos.publishedAt)).limit(limit);
}

export function getUnwatchedVideos(
  userId: string,
  limit = 20,
  cursor?: string
): Promise<PaginatedResult<Video & { channelTitle: string }>> {
  return getDb()
    .select({
      id: videos.id,
      channelId: videos.channelId,
      title: videos.title,
      description: videos.description,
      thumbnail: videos.thumbnail,
      publishedAt: videos.publishedAt,
      duration: videos.duration,
      viewCount: videos.viewCount,
      categoryId: videos.categoryId,
      fetchedAt: videos.fetchedAt,
      channelTitle: channels.title,
    })
    .from(videos)
    .innerJoin(channels, eq(videos.channelId, channels.id))
    .leftJoin(watched, eq(watched.videoId, videos.id))
    .where(
      and(
        eq(channels.userId, userId),
        isNull(watched.videoId),
        ...(cursor ? [lt(videos.publishedAt, new Date(cursor))] : [])
      )
    )
    .orderBy(desc(videos.publishedAt))
    .limit(limit + 1)
    .then((rows) => {
      const hasMore = rows.length > limit;
      const data = hasMore ? rows.slice(0, -1) : rows;
      const nextCursor = hasMore && data.length > 0 
        ? data[data.length - 1].publishedAt?.toISOString() 
        : undefined;
      return { data, nextCursor, hasMore };
    });
}

export function getWatchedVideoIds(userId: string): Promise<string[]> {
  return getDb()
    .select({ videoId: watched.videoId })
    .from(watched)
    .innerJoin(videos, eq(watched.videoId, videos.id))
    .innerJoin(channels, eq(videos.channelId, channels.id))
    .where(eq(channels.userId, userId))
    .then((rows) => rows.map((r) => r.videoId!).filter((id): id is string => !!id));
}

export function markVideoWatched(videoId: string): Promise<void> {
  return getDb()
    .insert(watched)
    .values({ videoId, watchedAt: new Date() })
    .onConflictDoNothing()
    .then();
}

export function markVideoUnwatched(videoId: string): Promise<void> {
  return getDb().delete(watched).where(eq(watched.videoId, videoId)).then();
}

export function isVideoWatched(videoId: string): Promise<boolean> {
  return getDb()
    .select({ videoId: watched.videoId })
    .from(watched)
    .where(eq(watched.videoId, videoId))
    .limit(1)
    .then((r) => r.length > 0);
}

export function getVideoById(videoId: string, userId: string): Promise<Video | undefined> {
  return getDb()
    .select({ videos })
    .from(videos)
    .innerJoin(channels, eq(videos.channelId, channels.id))
    .where(and(eq(videos.id, videoId), eq(channels.userId, userId)))
    .limit(1)
    .then((r) => r[0]?.videos);
}

export function getTopicsByUser(userId: string): Promise<Topic[]> {
  return getDb()
    .select()
    .from(topics)
    .where(and(eq(topics.userId, userId), isNull(topics.deletedAt)))
    .orderBy(desc(topics.createdAt));
}

export function getTopicById(topicId: string, userId: string): Promise<Topic | undefined> {
  return getDb()
    .select()
    .from(topics)
    .where(and(eq(topics.id, topicId), eq(topics.userId, userId)))
    .limit(1)
    .then((r) => r[0]);
}

export function updateTopic(
  topicId: string,
  userId: string,
  data: Partial<Pick<Topic, 'name' | 'keywords' | 'categoryId' | 'color'>>
): Promise<Topic> {
  return getDb()
    .update(topics)
    .set(data)
    .where(and(eq(topics.id, topicId), eq(topics.userId, userId)))
    .returning()
    .then((r) => r[0]);
}

export function deleteTopic(topicId: string, userId: string): Promise<void> {
  return getDb()
    .update(topics)
    .set({ deletedAt: new Date() })
    .where(and(eq(topics.id, topicId), eq(topics.userId, userId)))
    .then();
}

export function createTopic(data: {
  userId: string;
  name: string;
  type: 'keyword' | 'category';
  keywords?: string[];
  categoryId?: string;
  color?: string;
}): Promise<Topic> {
  return getDb()
    .insert(topics)
    .values({
      id: crypto.randomUUID(),
      userId: data.userId,
      name: data.name,
      type: data.type,
      keywords: data.keywords || [],
      categoryId: data.categoryId || null,
      color: data.color || '#6366f1',
    })
    .returning()
    .then((r) => r[0]);
}

export function getTagsByUser(userId: string): Promise<Tag[]> {
  return getDb()
    .select()
    .from(tags)
    .where(and(eq(tags.userId, userId), isNull(tags.deletedAt)))
    .orderBy(desc(tags.name));
}

export function createTag(data: { userId: string; name: string; color?: string }): Promise<Tag> {
  return getDb()
    .insert(tags)
    .values({
      id: crypto.randomUUID(),
      userId: data.userId,
      name: data.name,
      color: data.color || '#6366f1',
    })
    .returning()
    .then((r) => r[0]);
}

export function getSettingsByUser(userId: string): Promise<AppSettings | undefined> {
  return getDb().select().from(appSettings).where(eq(appSettings.userId, userId)).limit(1).then((r) => r[0]);
}

export function upsertSettings(
  userId: string,
  data: Partial<Pick<AppSettings, 'theme' | 'timezone' | 'syncIntervalMinutes' | 'lastSyncAt'>>
): Promise<AppSettings> {
  return getDb()
    .insert(appSettings)
    .values({
      userId,
      theme: data.theme || 'system',
      timezone: data.timezone || 'America/Los_Angeles',
      syncIntervalMinutes: data.syncIntervalMinutes ?? 0,
      lastSyncAt: data.lastSyncAt,
    })
    .onConflictDoUpdate({
      target: appSettings.userId,
      set: {
        ...data,
        theme: data.theme || 'system',
        timezone: data.timezone || 'America/Los_Angeles',
      },
    })
    .returning()
    .then((r) => r[0]);
}

export function upsertChannel(
  channel: Omit<Channel, 'createdAt' | 'customName' | 'lastSyncedAt'>
): Promise<Channel> {
  return getDb()
    .insert(channels)
    .values(channel)
    .onConflictDoUpdate({
      target: channels.id,
      set: { title: channel.title, thumbnail: channel.thumbnail },
    })
    .returning()
    .then((r) => r[0]);
}

export function upsertVideo(video: Omit<Video, 'fetchedAt'>): Promise<Video> {
  return getDb()
    .insert(videos)
    .values(video)
    .onConflictDoUpdate({
      target: videos.id,
      set: {
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail,
        viewCount: video.viewCount,
        categoryId: video.categoryId,
      },
    })
    .returning()
    .then((r) => r[0]);
}

export function getSyncState(channelId: string) {
  return getDb().select().from(syncState).where(eq(syncState.channelId, channelId)).limit(1).then((r) => r[0]);
}

export function upsertSyncState(data: {
  channelId: string;
  lastSyncedAt?: Date;
  lastVideoId?: string;
  quotaUsedToday?: number;
}) {
  return getDb()
    .insert(syncState)
    .values(data)
    .onConflictDoUpdate({
      target: syncState.channelId,
      set: data,
    })
    .then();
}