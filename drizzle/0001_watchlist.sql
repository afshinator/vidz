CREATE TABLE "watchlist" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"video_id" text NOT NULL,
	"added_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "watchlist_user_id_idx" ON "watchlist" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "watchlist_video_id_idx" ON "watchlist" USING btree ("video_id");
--> statement-breakpoint
CREATE INDEX "watchlist_added_at_idx" ON "watchlist" USING btree ("added_at");
