import { pgTable, text, timestamp, bigint, integer, primaryKey, index } from 'drizzle-orm/pg-core';

export const channels = pgTable('channels', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  thumbnail: text('thumbnail'),
  customName: text('custom_name'),
  subscribedAt: timestamp('subscribed_at'),
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('channels_user_id_idx').on(table.userId),
}));

export const videos = pgTable('videos', {
  id: text('id').primaryKey(),
  channelId: text('channel_id').references(() => channels.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  thumbnail: text('thumbnail'),
  publishedAt: timestamp('published_at').notNull(),
  duration: text('duration'),
  viewCount: bigint('view_count', { mode: 'number' }),
  categoryId: text('category_id'),
  fetchedAt: timestamp('fetched_at').defaultNow(),
}, (table) => ({
  channelIdIdx: index('videos_channel_id_idx').on(table.channelId),
  publishedAtIdx: index('videos_published_at_idx').on(table.publishedAt),
}));

export const watched = pgTable('watched', {
  videoId: text('video_id').references(() => videos.id, { onDelete: 'cascade' }),
  watchedAt: timestamp('watched_at').defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.videoId] }),
  watchedAtIdx: index('watched_watched_at_idx').on(table.watchedAt),
}));

export const topics = pgTable('topics', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  keywords: text('keywords').array(),
  categoryId: text('category_id'),
  color: text('color').default('#6366f1'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('topics_user_id_idx').on(table.userId),
  userIdDeletedAtIdx: index('topics_user_id_deleted_at_idx').on(table.userId, table.deletedAt),
}));

export const tags = pgTable('tags', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  color: text('color').default('#6366f1'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('tags_user_id_idx').on(table.userId),
  userIdDeletedAtIdx: index('tags_user_id_deleted_at_idx').on(table.userId, table.deletedAt),
}));

export const videoTags = pgTable('video_tags', {
  videoId: text('video_id').references(() => videos.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.videoId, table.tagId] }),
  videoIdIdx: index('video_tags_video_id_idx').on(table.videoId),
  tagIdIdx: index('video_tags_tag_id_idx').on(table.tagId),
}));

export const channelTags = pgTable('channel_tags', {
  channelId: text('channel_id').references(() => channels.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.channelId, table.tagId] }),
  channelIdIdx: index('channel_tags_channel_id_idx').on(table.channelId),
  tagIdIdx: index('channel_tags_tag_id_idx').on(table.tagId),
}));

export const syncState = pgTable('sync_state', {
  channelId: text('channel_id').primaryKey().references(() => channels.id),
  lastSyncedAt: timestamp('last_synced_at'),
  lastVideoId: text('last_video_id'),
  quotaUsedToday: integer('quota_used_today').default(0),
});

export const appSettings = pgTable('app_settings', {
  userId: text('user_id').primaryKey(),
  theme: text('theme').default('system'),
  timezone: text('timezone').default('America/Los_Angeles'),
  syncIntervalMinutes: integer('sync_interval_minutes').default(0),
  lastSyncAt: timestamp('last_sync_at'),
});

export const videoNotes = pgTable('video_notes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  videoId: text('video_id').references(() => videos.id, { onDelete: 'cascade' }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('video_notes_user_id_idx').on(table.userId),
  createdAtIdx: index('video_notes_created_at_idx').on(table.createdAt),
}));

export type Channel = typeof channels.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type Watched = typeof watched.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type AppSettings = typeof appSettings.$inferSelect;
export type VideoNote = typeof videoNotes.$inferSelect;