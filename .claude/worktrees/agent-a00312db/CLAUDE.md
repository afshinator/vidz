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

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Drizzle ORM + Neon Postgres
- NextAuth.js (Google OAuth)
- date-fns + date-fns-tz (timezone handling)

## Code Style & Constraints
- **Language:** TypeScript / React
- **Styling:** Tailwind CSS
- **Imports:** Use absolute paths with `@/` (configured in tsconfig)
- **Pure Functions:** Business logic in `src/lib/` should be pure and testable

## Project Structure

### Pages
| Route | Purpose |
|-------|---------|
| `/` | Dashboard — overview of unwatched videos, topics, channels |
| `/topics` | Topic management — create/edit topics (keyword or category-based) |
| `/channels` | Channel list — your YouTube subscriptions |
| `/settings` | App settings — theme, timezone, sync controls |

### API Routes
| Route | Purpose |
|-------|---------|
| `/api/auth/[...nextauth]` | NextAuth handler (Google OAuth) |

### Server Actions (src/actions/)
- `videos.ts` — toggleWatched, markAsWatchedAction, markAsUnwatchedAction
- `topics.ts` — createTopicAction, updateTopicAction, deleteTopicAction
- `sync.ts` — syncNowAction
- `settings.ts` — getSettingsAction, updateSettingsAction

### Core Libraries (src/lib/)
| Module | Purpose |
|--------|---------|
| `db/schema.ts` | Drizzle schema (channels, videos, watched, topics, tags, etc.) |
| `db/queries.ts` | Pure DB query functions |
| `youtube/api.ts` | YouTube Data API client |
| `youtube/transformers.ts` | API response → DB shape converters |
| `youtube/filter.ts` | Video filtering by topic/keywords |
| `topics/matcher.ts` | Keyword matching logic |
| `topics/categorizer.ts` | YouTube category definitions |
| `utils/time.ts` | PST timezone formatting |

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
- Configure Vercel Password Protection in dashboard for personal-only access (no code needed)

## Database Schema (Drizzle)

Tables:
- `channels` — YouTube subscriptions
- `videos` — Video metadata from channels
- `watched` — Watch history (videoId, watchedAt)
- `topics` — User-defined topics (keyword or category type)
- `tags` — Manual tags
- `video_tags` / `channel_tags` — Junction tables
- `syncState` — Sync tracking per channel (quota management)
- `appSettings` — User settings (theme, timezone, sync interval)

## YouTube API Quota
- 10,000 units/day (free tier)
- `search` endpoint = 100 units (expensive!)
- `subscriptions`, `channels`, `videos`, `activities` = 1 unit each
- **Strategy:** Use `activities` for subscription feed instead of `search`

---

## Project Status (as of March 2026)

### Completed
- Project scaffolding with Next.js 16 + shadcn/ui
- Drizzle schema with all tables
- NextAuth.js Google OAuth configured
- Core UI components (sidebar, header, video-card, channel-card, topic-card)
- Pages: Dashboard, Topics, Channels, Settings
- Theme selector (dark/light/system)
- Timezone support (PST default)

### To Do
1. Set up Neon database and run migrations
2. Configure Google Cloud Console credentials
3. Implement YouTube sync (subscriptions, videos, watch history)
4. Add topic filtering by keywords/categories
5. Deploy to Vercel and configure password protection

---

## Next Steps

1. **Create Neon project** and get DATABASE_URL
2. **Set up Google OAuth** in Google Cloud Console
3. **Run Drizzle push** to create tables: `npx drizzle-kit push`
4. **Configure env vars** in `.env.local`
5. **Deploy to Vercel** and add environment variables
6. **Test sync** — authorize with Google, sync subscriptions