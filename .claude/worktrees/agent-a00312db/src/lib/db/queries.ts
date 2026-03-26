import { eq, desc, and, sql, isNull, lt, inArray } from 'drizzle-orm';
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
  videoNotes,
} from './schema';
import type { Channel, Video, Topic, Tag, AppSettings, VideoNote } from './schema';

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

export type UnwatchedVideoWithTags = {
  id: string;
  channelId: string | null;
  title: string;
  description: string | null;
  thumbnail: string | null;
  publishedAt: Date;
  duration: string | null;
  viewCount: number | null;
  categoryId: string | null;
  fetchedAt: Date | null;
  channelTitle: string;
  tags: { id: string; name: string; color: string }[];
};

export async function getUnwatchedVideosWithChannelTags(userId: string, limit = 500): Promise<UnwatchedVideoWithTags[]> {
  // Fetch unwatched videos (no watched record), with their channel's tags
  const rows = await getDb()
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
      tagId: tags.id,
      tagName: tags.name,
      tagColor: tags.color,
    })
    .from(videos)
    .innerJoin(channels, eq(videos.channelId, channels.id))
    .leftJoin(watched, eq(watched.videoId, videos.id))
    .leftJoin(channelTags, eq(channelTags.channelId, channels.id))
    .leftJoin(tags, and(eq(channelTags.tagId, tags.id), isNull(tags.deletedAt)))
    .where(and(eq(channels.userId, userId), isNull(watched.videoId)))
    .orderBy(desc(videos.publishedAt))
    .limit(limit);

  const videoMap = new Map<string, UnwatchedVideoWithTags>();
  for (const row of rows) {
    if (!videoMap.has(row.id)) {
      videoMap.set(row.id, {
        id: row.id,
        channelId: row.channelId,
        title: row.title,
        description: row.description,
        thumbnail: row.thumbnail,
        publishedAt: row.publishedAt,
        duration: row.duration,
        viewCount: row.viewCount,
        categoryId: row.categoryId,
        fetchedAt: row.fetchedAt,
        channelTitle: row.channelTitle,
        tags: [],
      });
    }
    if (row.tagId && row.tagName && row.tagColor) {
      videoMap.get(row.id)!.tags.push({ id: row.tagId, name: row.tagName, color: row.tagColor });
    }
  }

  return Array.from(videoMap.values());
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

export type ChannelWithTags = Channel & {
  tags: Tag[];
  unwatchedCount: number;
};

export async function getChannelsWithTags(userId: string): Promise<ChannelWithTags[]> {
  const userChannels = await getDb()
    .select()
    .from(channels)
    .where(eq(channels.userId, userId))
    .orderBy(channels.title);

  if (userChannels.length === 0) return [];

  const channelIds = userChannels.map((c) => c.id);

  const [channelTagRows, unwatchedRows] = await Promise.all([
    getDb()
      .select({ channelId: channelTags.channelId, tag: tags })
      .from(channelTags)
      .innerJoin(tags, eq(channelTags.tagId, tags.id))
      .where(inArray(channelTags.channelId, channelIds)),
    getDb()
      .select({ channelId: videos.channelId, count: sql<number>`cast(count(*) as int)` })
      .from(videos)
      .leftJoin(watched, eq(watched.videoId, videos.id))
      .where(and(inArray(videos.channelId, channelIds), isNull(watched.videoId)))
      .groupBy(videos.channelId),
  ]);

  const tagsByChannel = new Map<string, Tag[]>();
  for (const row of channelTagRows) {
    if (!row.channelId) continue;
    if (!tagsByChannel.has(row.channelId)) tagsByChannel.set(row.channelId, []);
    tagsByChannel.get(row.channelId)!.push(row.tag);
  }

  const unwatchedByChannel = new Map<string, number>();
  for (const row of unwatchedRows) {
    if (row.channelId) unwatchedByChannel.set(row.channelId, row.count);
  }

  return userChannels.map((channel) => ({
    ...channel,
    tags: tagsByChannel.get(channel.id) ?? [],
    unwatchedCount: unwatchedByChannel.get(channel.id) ?? 0,
  }));
}

export function assignTagToChannel(channelId: string, tagId: string): Promise<void> {
  return getDb()
    .insert(channelTags)
    .values({ channelId, tagId })
    .onConflictDoNothing()
    .then();
}

export function removeTagFromChannel(channelId: string, tagId: string): Promise<void> {
  return getDb()
    .delete(channelTags)
    .where(and(eq(channelTags.channelId, channelId), eq(channelTags.tagId, tagId)))
    .then();
}

export function deleteTag(tagId: string, userId: string): Promise<void> {
  return getDb()
    .update(tags)
    .set({ deletedAt: new Date() })
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .then();
}

export type VideoNoteWithVideo = VideoNote & {
  video: {
    id: string;
    title: string;
    thumbnail: string | null;
    channelTitle: string;
    publishedAt: Date;
    duration: string | null;
  };
};

export function addVideoNote(data: { userId: string; videoId: string; notes?: string }): Promise<VideoNote> {
  return getDb()
    .insert(videoNotes)
    .values({
      id: crypto.randomUUID(),
      userId: data.userId,
      videoId: data.videoId,
      notes: data.notes ?? null,
    })
    .returning()
    .then((r) => r[0]);
}

export function deleteVideoNote(noteId: string, userId: string): Promise<void> {
  return getDb()
    .delete(videoNotes)
    .where(and(eq(videoNotes.id, noteId), eq(videoNotes.userId, userId)))
    .then();
}

export async function getVideoNotesByUser(userId: string): Promise<VideoNoteWithVideo[]> {
  const rows = await getDb()
    .select({
      id: videoNotes.id,
      userId: videoNotes.userId,
      videoId: videoNotes.videoId,
      notes: videoNotes.notes,
      createdAt: videoNotes.createdAt,
      videoTitle: videos.title,
      videoThumbnail: videos.thumbnail,
      videoPublishedAt: videos.publishedAt,
      videoDuration: videos.duration,
      channelTitle: channels.title,
    })
    .from(videoNotes)
    .innerJoin(videos, eq(videoNotes.videoId, videos.id))
    .innerJoin(channels, eq(videos.channelId, channels.id))
    .where(eq(videoNotes.userId, userId))
    .orderBy(desc(videoNotes.createdAt));

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    videoId: r.videoId,
    notes: r.notes,
    createdAt: r.createdAt,
    video: {
      id: r.videoId,
      title: r.videoTitle,
      thumbnail: r.videoThumbnail,
      channelTitle: r.channelTitle,
      publishedAt: r.videoPublishedAt,
      duration: r.videoDuration,
    },
  }));
}

export function getNoteByVideo(userId: string, videoId: string): Promise<VideoNote | undefined> {
  return getDb()
    .select()
    .from(videoNotes)
    .where(and(eq(videoNotes.userId, userId), eq(videoNotes.videoId, videoId)))
    .limit(1)
    .then((r) => r[0]);
}

export function getNotedVideoIds(userId: string): Promise<string[]> {
  return getDb()
    .select({ videoId: videoNotes.videoId })
    .from(videoNotes)
    .where(eq(videoNotes.userId, userId))
    .then((rows) => rows.map((r) => r.videoId));
}
