# Project Instructions: vidz

## Environment Context
- **Runtime:** Node.js (Next.js 16)
- **Package Manager:** npm
- **Database:** Neon Postgres with Drizzle ORM
- **Auth:** NextAuth.js (Google OAuth)

## Build & Development Commands
- **Install:** `npm install`
- **Dev Server:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Test:** `npm run test` (Vitest)

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Drizzle ORM + Neon Postgres
- NextAuth.js (Google OAuth with YouTube scope + refresh token rotation)
- date-fns

## Code Style & Constraints
- **Language:** TypeScript / React
- **Styling:** Tailwind CSS
- **Imports:** Use absolute paths with `@/` (configured in tsconfig)
- **Pure Functions:** Business logic in `src/lib/` should be pure and testable

## Project Structure

### Pages
| Route | Purpose |
|-------|---------|
| `/` | Dashboard — unwatched videos grouped by channel tags in a collapsible accordion. Hover on video cards reveals a tag icon for in-place channel tagging via `TagAssignPopover`. |
| `/unwatched` | All unwatched videos grouped by YouTube category or tag (toggleable) |
| `/watchlist` | Watch later queue — videos saved with "Add to Watchlist" |
| `/notes` | Saved video notes — videos saved with "Save to Notes" |
| `/tags` | Tag management — create/delete tags, assign to channels via channel avatars |
| `/channels` | Channel list — your YouTube subscriptions |
| `/channels/[id]` | Single channel detail — paginated video history |
| `/settings` | App settings — theme, timezone, category backfill |
| `/about` | About page with app info and navigation guide |

### API Routes
| Route | Purpose |
|-------|---------|
| `/api/auth/[...nextauth]` | NextAuth handler (Google OAuth) |

### Server Actions (src/actions/)
- `videos.ts` — toggleWatched, markAsWatchedAction, addToWatchlistAction, removeFromWatchlistAction
- `sync.ts` — syncNowAction, backfillCategoryIdsAction
- `notes.ts` — addNoteAction, deleteNoteAction
- `tags.ts` — createTagAction, deleteTagAction, assignTagToChannelAction, removeTagFromChannelAction (also revalidates `/` for dashboard regrouping)

### Core Libraries (src/lib/)
| Module | Purpose |
|--------|---------|
| `db/schema.ts` | Drizzle schema — 12 tables (see Database Schema below) |
| `db/client.ts` | Neon serverless DB client setup |
| `db/queries.ts` | All DB query functions |
| `youtube/api.ts` | YouTube Data API client with retry logic and quota handling |
| `youtube/transformers.ts` | Duration and view count formatters |
| `sync-utils.ts` | Sync helpers (mapChannelValues, mapVideoValues, buildCategoryUpdates, buildSyncResultMessage, checkQuota) |
| `error.ts` | Error classes (YouTubeQuotaError) |
| `topics/categorizer.ts` | Static YouTube category ID → name mapping |
| `utils.ts` | General utilities (cn(), etc.) |
| `utils/time.ts` | Timezone formatting and TIMEZONES list |
| `utils/video-grouping.ts` | Groups videos by channel tags for dashboard display |
| `utils/height-utils.ts` | Accordion height calculations |
| `utils/section-heights.ts` | Section height persistence |
| `utils/sound-prefs.ts` | Sound preference toggles |
| `sound-engine.ts` | Sound playback engine |
| `sound-types.ts` | Sound type definitions |
| `cloth-1.ts`, `book-close.ts`, `click-soft.ts`, `notification-pop.ts` | Base64-encoded sound effects |

## Environment Variables Required

Create `.env.local` with:
```env
DATABASE_URL=           # Neon connection string
AUTH_SECRET=            # openssl rand -base64 32
AUTH_GOOGLE_ID=         # Google Cloud Console OAuth client ID
AUTH_GOOGLE_SECRET=     # Google Cloud Console OAuth client secret
```

## Authentication
- Uses Google OAuth via NextAuth.js
- Required scope: `https://www.googleapis.com/auth/youtube.readonly`
- Refresh token rotation handled in JWT callback
- Configure Vercel Password Protection in dashboard for personal-only access (no code needed)

## Database Schema (Drizzle)

Tables:
- `channels` — YouTube subscriptions (id, userId, title, thumbnail, customName, subscribedAt, lastSyncedAt)
- `videos` — Video metadata from channels (id, channelId, title, description, thumbnail, publishedAt, duration, viewCount, categoryId, fetchedAt)
- `watched` — Watch history (videoId PK, watchedAt)
- `topics` — User-defined topics (id, userId, name, type, keywords[], categoryId, color, deletedAt) — schema exists but not actively used; tags are the primary categorization mechanism
- `tags` — User-created tags (id, userId, name, color, deletedAt)
- `video_tags` — Junction: video ↔ tag (schema exists, not used in current queries — all tagging is channel-level via `channel_tags`)
- `channel_tags` — Junction: channel ↔ tag (primary tagging mechanism — videos inherit their channel's tags)
- `sync_state` — Sync tracking per channel (channelId PK, lastSyncedAt, lastVideoId, quotaUsedToday)
- `app_settings` — User settings (userId PK, theme, timezone, syncIntervalMinutes, lastSyncAt)
- `video_notes` — Notes attached to videos (id, userId, videoId, notes, createdAt)
- `watchlist` — Watch later queue (id, userId, videoId, addedAt)

## YouTube API Quota
- 10,000 units/day (free tier)
- `search` endpoint = 100 units (expensive!)
- `subscriptions`, `channels`, `videos` = 1 unit each
- **Strategy:** Use `subscriptions` + `channels.list` + `playlistItems` for channel videos instead of `search`
