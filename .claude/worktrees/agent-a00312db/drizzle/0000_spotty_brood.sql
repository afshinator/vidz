CREATE TABLE "app_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"theme" text DEFAULT 'system',
	"timezone" text DEFAULT 'America/Los_Angeles',
	"sync_interval_minutes" integer DEFAULT 0,
	"last_sync_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "channel_tags" (
	"channel_id" text,
	"tag_id" text,
	CONSTRAINT "channel_tags_channel_id_tag_id_pk" PRIMARY KEY("channel_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"thumbnail" text,
	"custom_name" text,
	"subscribed_at" timestamp,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sync_state" (
	"channel_id" text PRIMARY KEY NOT NULL,
	"last_synced_at" timestamp,
	"last_video_id" text,
	"quota_used_today" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#6366f1',
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"keywords" text[],
	"category_id" text,
	"color" text DEFAULT '#6366f1',
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "video_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"video_id" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "video_tags" (
	"video_id" text,
	"tag_id" text,
	CONSTRAINT "video_tags_video_id_tag_id_pk" PRIMARY KEY("video_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" text PRIMARY KEY NOT NULL,
	"channel_id" text,
	"title" text NOT NULL,
	"description" text,
	"thumbnail" text,
	"published_at" timestamp NOT NULL,
	"duration" text,
	"view_count" bigint,
	"category_id" text,
	"fetched_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "watched" (
	"video_id" text,
	"watched_at" timestamp DEFAULT now(),
	CONSTRAINT "watched_video_id_pk" PRIMARY KEY("video_id")
);
--> statement-breakpoint
ALTER TABLE "channel_tags" ADD CONSTRAINT "channel_tags_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_tags" ADD CONSTRAINT "channel_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_state" ADD CONSTRAINT "sync_state_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_notes" ADD CONSTRAINT "video_notes_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_tags" ADD CONSTRAINT "video_tags_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_tags" ADD CONSTRAINT "video_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watched" ADD CONSTRAINT "watched_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "channel_tags_channel_id_idx" ON "channel_tags" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "channel_tags_tag_id_idx" ON "channel_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "channels_user_id_idx" ON "channels" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tags_user_id_idx" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tags_user_id_deleted_at_idx" ON "tags" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "topics_user_id_idx" ON "topics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "topics_user_id_deleted_at_idx" ON "topics" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "video_notes_user_id_idx" ON "video_notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "video_notes_created_at_idx" ON "video_notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "video_tags_video_id_idx" ON "video_tags" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "video_tags_tag_id_idx" ON "video_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "videos_channel_id_idx" ON "videos" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "videos_published_at_idx" ON "videos" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "watched_watched_at_idx" ON "watched" USING btree ("watched_at");