# Application Overview & UX Blueprint

## 1. Technical Stack & Infrastructure

### Core Framework & Language
- **Next.js 16** (App Router) with TypeScript — all pages are React Server Components with `"use client"` boundaries at the leaf level
- **Package manager:** npm
- **Runtime:** Node.js, deployed on Vercel

### UI Library / Styling Framework
- **Tailwind CSS 4** with the `tw-animate-css` animation plugin
- **shadcn/ui** components built on Radix UI primitives (`@radix-ui/react-accordion`, `@radix-ui/react-dialog`, `@radix-ui/react-select`, `@radix-ui/react-switch`, etc.) — all shadcn wrappers live in `src/components/ui/`
- **`re-resizable`** library (`^6.11.2`) for draggable accordion section heights on the dashboard
- **Lucide React** for iconography throughout
- **Dark/light/system theme** support via a `ThemeProvider` in `src/lib/utils/theme.tsx`, persisted in `app_settings.theme`

### State Management & Data Fetching
- **No global state library.** State is managed through:
  - **React Context** for cross-cutting concerns: `ViewModeProvider` (grid/list toggle — `src/components/video/view-mode-context.tsx:17`), `SidebarProvider` (injectable extra sidebar content — `src/components/layout/sidebar-context.tsx`), `SessionProvider` (NextAuth), `ThemeProvider`
  - **`useState` + `useTransition`** for local async action state (sync button, dialogs, tag filters)
  - **`useMemo`** for derived data (tag grouping in `useTopicFilter`)
  - **`localStorage`** for persistence: section heights (`section-heights.ts`), sound preferences (`sound-prefs.ts`)
- **Data fetching:** All data is loaded in Server Components (`page.tsx` → `src/lib/db/queries.ts` → Drizzle ORM → Neon Postgres). Client components receive data as props.
- **Mutations:** React Server Actions (`"use server"` in `src/actions/`) invoked from client components via `startTransition`

### YouTube API Strategy
- **Direct REST calls** from server actions to `https://www.googleapis.com/youtube/v3` (`src/lib/youtube/api.ts`)
- **No client-side YouTube API calls.** All YouTube requests flow through server actions authenticated with the user's Google OAuth access token stored in the NextAuth JWT
- **Retry logic:** Up to 2 retries with exponential backoff (1s, 2s) on transient errors (500s, network failures). Non-retryable status codes (400, 401, 403) fail immediately (`api.ts:8-87`)
- **Quota optimization strategy:**
  - Uses `playlistItems` endpoint (1 unit) derived from the channel's uploads playlist ID (`UU{channelId.slice(2)}` — `api.ts:153`) instead of the expensive `search` endpoint (100 units)
  - Batches `videos.list` calls at 50 video IDs per request (1 unit) for detail enrichment (categoryId, duration, viewCount)
  - Monitors cumulative quota per sync cycle; stops syncing new channels at 9,900 units (10,000 daily limit minus 100 buffer)
  - Limits 50 videos per channel and 50 channels per sync cycle (`sync.ts:28-29`)

### Database
- **Neon Postgres** (serverless) with **Drizzle ORM**
- 12 tables: `channels`, `videos`, `watched`, `topics` (schema exists, unused in app logic), `tags`, `video_tags`, `channel_tags`, `sync_state`, `app_settings`, `video_notes`, `watchlist`, plus Drizzle migration tracking table
- 3 migrations applied (0000–0002); latest added `video_notes` and `watchlist`
- Batch upserts for channels and videos with `ON CONFLICT DO UPDATE`

### Authentication
- **NextAuth.js v5** (beta.30) with **Google OAuth**
- Scope: `openid email profile https://www.googleapis.com/auth/youtube.readonly` with `prompt=consent` and `access_type=offline`
- JWT callback handles refresh token rotation (`src/auth.ts:33-67`) — refreshes 60s before expiry
- `session.user.id` is the user's email address; `session.accessToken` is the Google OAuth token
- (Per instructions, not a focus of this audit)

### Sound Effects
- **Web Audio API** via `src/hooks/use-sound.ts` decoding base64-encoded sound assets (`src/lib/cloth-1.ts`, `book-close.ts`, `click-soft.ts`, `notification-pop.ts`)
- Played on accordion expand/collapse and resize drag interactions on the dashboard
- Togglable via a volume button in the dashboard header; respects `prefers-reduced-motion`
- Persisted to `localStorage`

---

## 2. Screens, Routes & Layouts

### Global Layout
- **`src/app/layout.tsx`** wraps the app in `Providers` (Session, Theme, Sidebar, ViewMode)
- **Desktop sidebar** (`src/components/layout/sidebar.tsx:66`): 64px-wide sticky sidebar with 8 nav items, always visible on `md+` screens. Has a crimson gradient accent line at the top.
- **Mobile nav** (`sidebar.tsx:96`): Sheet drawer triggered by a hamburger button fixed to the top-left
- **Header** (`src/components/layout/header.tsx`): Title + optional subtitle + optional action slot (e.g., SyncButton, CreateTagDialog) + optional grid/list view toggle

### Screen-by-Screen Breakdown

#### `/` — Dashboard
- **Server component:** `src/app/page.tsx`
- **Core purpose:** Overview of all unwatched videos, grouped by channel tags in a collapsible accordion. The primary landing page.
- **Key UI elements:**
  - Header with "Dashboard" title, personalized subtitle ("Welcome back, {firstName}")
  - **SyncButton** in header actions slot (`src/components/sync-button.tsx`) — triggers `syncNowAction`, shows spinning icon + status message
  - **EmptyState** when no unwatched videos exist
  - **DashboardAccordion** (`src/components/dashboard/dashboard-accordion.tsx:52`):
    - Section header: "Unwatched (N)" with sound toggle button and "View All →" link to `/unwatched`
    - Multiple accordion items, one per tag group: colored dot + tag name + video count badge
    - Each section opens with a notification-pop sound, closes with book-close sound
    - First tag group auto-expanded
    - Each section's content is a **ResizableAccordionContent** (`resizable-accordion-content.tsx:56`) — bottom-edge draggable to resize, double-click-drag-handle to fill-to-viewport, height persisted in localStorage
    - Inside each section: **VideoGrid** in grid mode (4-column responsive)
- **Interactive controls:**
  - Sound toggle (speaker icon)
  - "View All" link
  - Accordion expand/collapse (with audio feedback)
  - Draggable section resize (with click-soft grab sound + cloth-1 full-expand sound)
  - Click any video card → VideoActionDialog

#### `/unwatched` — Unwatched Videos
- **Server component:** `src/app/unwatched/page.tsx`
- **Client component:** `src/app/unwatched/unwatched-client.tsx`
- **Core purpose:** Full-screen view of all unwatched videos with grouping controls, channel sidebar, and stats
- **Key UI elements:**
  - **SidebarChannelList** injected into the sidebar via `SidebarProvider` — a list of channel badges (see below)
  - Header with "Unwatched" title
  - **StatsHeader card** (`unwatched-client.tsx:70`):
    - Large bold count: "N unwatched videos"
    - Divider + group count: "N tags" or "N categories"
    - **Segmented control** to toggle grouping mode: "Tags" | "YouTube Categories"
  - **CategoryBadges** (`unwatched-client.tsx:124`): horizontal pill badges for each group, clickable anchor links to `#{slug}` (in-page navigation)
  - **ChannelsCloud** (`src/components/unwatched/channels-cloud.tsx:15`): collapsible section showing all channels as badge links with unwatched counts, sorted by count descending
  - **CategoryAccordionList** (`src/components/unwatched/category-accordion-list.tsx:19`): accordion groups by the selected mode, each with colored dot + name + count badge. Has "Expand all / Collapse all" toggle. Videos sorted by `publishedAt` descending within groups.
- **Interactive controls:**
  - Tags/Categories mode toggle
  - Category badge click → scroll to accordion section
  - Channel cloud expand/collapse
  - Accordion expand/collapse all
  - Click video card → VideoActionDialog

#### `/watchlist` — Watch List
- **Server component:** `src/app/watchlist/page.tsx`
- **Client component:** `src/app/watchlist/watchlist-client.tsx`
- **Core purpose:** List of videos the user has explicitly saved to watch later
- **Key UI elements:**
  - Header: "Watchlist" with subtitle "Videos you want to watch later", view toggle hidden
  - **WatchlistCard** (`watchlist-client.tsx:15`): horizontal card with:
    - 128px thumbnail linking to YouTube (new tab), with play overlay on hover
    - Title linking to YouTube (new tab)
    - Channel name · relative time · duration
    - "Added {relativeTime}" timestamp
    - Delete button → ConfirmDeleteDialog → `removeFromWatchlistAction`
- **Interactive controls:**
  - Click thumbnail/title → opens YouTube in new tab
  - Delete button with confirmation dialog
- **Empty state:** "No videos in watchlist" with instructional text

#### `/notes` — Saved Notes
- **Server component:** `src/app/notes/page.tsx`
- **Client component:** `src/app/notes/notes-client.tsx`
- **Core purpose:** Videos the user has saved with optional text notes
- **Key UI elements:**
  - Header: "Notes" with subtitle "Videos you've saved for later", view toggle hidden
  - **NoteCard** (`notes-client.tsx:14`): horizontal card with:
    - 128px thumbnail (no YouTube link overlay)
    - Title linking to YouTube (new tab)
    - Channel name · relative time
    - Note text in a muted rounded box (if notes exist)
    - Delete button → ConfirmDeleteDialog → `deleteNoteAction`
- **Interactive controls:**
  - Click title → opens YouTube in new tab
  - Delete button with confirmation dialog
- **Empty state:** "No saved notes" with instructional text

#### `/tags` — Tag Management
- **Server component:** `src/app/tags/page.tsx`
- **Client component:** `src/components/topic/topics-client.tsx`
- **Core purpose:** Create, delete, and assign tags to channels. Channels grouped by tag in accordion sections.
- **Key UI elements:**
  - Header: "Tags" with subtitle "Group your channels by tag"; **CreateTagDialog** (`src/components/topic/create-tag-dialog.tsx`) in header actions slot
  - **Filter pills** (`topics-client.tsx:122`): horizontal row of pill buttons — "All · N" + one pill per tag (color dot + name + count) + optional "Untagged · N" pill. Active pill gets primary fill style.
  - **Expand all / Collapse all** toggle (only appears when > 1 section)
  - **Accordion sections** by tag group (`TopicAccordionSection`):
    - Per-tag accordion item: color dot + tag name + channel count + trash delete button (with `startTransition`)
    - "Untagged" section for channels with no tags (muted styling)
    - Inside each: **ChannelGrid** (`topics-client.tsx:227`): responsive 4–10 column grid of channel avatars
      - Avatar with ring highlight on hover + initial letter fallback
      - Custom name or channel title below (2-line clamp)
      - **Unwatched count badge** (top-right, capped at "99+")
      - Click avatar → navigates to `/channels/{id}`
      - Hover → **TagAssignPopover** appears at top-right corner (`src/components/topic/tag-assign-popover.tsx`) for quick tag assignment
  - **Empty state:** "No channels yet — sync your YouTube subscriptions to get started."
- **Interactive controls:**
  - Filter pills toggle visibility per tag
  - Create tag dialog
  - Inline tag delete (trash icon per accordion header)
  - Expand/collapse all
  - Tag assignment popover per channel (on hover)

#### `/channels` — Channel List
- **Server component:** `src/app/channels/page.tsx`
- **Core purpose:** Grid of all subscribed YouTube channels
- **Key UI elements:**
  - Header: "Channels" with subscription count
  - **ChannelCard** grid (3-column responsive): each card links to `/channels/{id}`
  - **Empty state:** (implicit — grid is empty when no channels)
- **Interactive controls:**
  - Click channel card → navigates to channel detail page

#### `/channels/[id]` — Channel Detail
- **Server component:** `src/app/channels/[id]/page.tsx`
- **Core purpose:** Paginated video history for a single channel
- **Key UI elements:**
  - Back navigation to `/channels`
  - Channel info header
  - Paginated video list with cursor-based pagination (`getVideosByChannel`)
- **Interactive controls:**
  - Load more / pagination
  - Mark as watched toggle per video

#### `/settings` — Settings
- **Server component:** `src/app/settings/page.tsx`
- **Core purpose:** User preferences
- **Key UI elements:**
  - Info banner: signed-in email + note about Google OAuth revocation
  - **Appearance card:** Theme selector (dark/light/system)
  - **Localization card:** Timezone selector (8 predefined zones: PT, MT, CT, ET, London, Paris, Tokyo, Shanghai)
  - **YouTube Sync card:**
    - Auto-sync toggle (Switch — UI only, no backend wiring evident)
    - Sync interval selector (Manual / 15m / 30m / 1h / 6h — UI only, no backend wiring)
    - **BackfillCategoriesButton** (`src/components/settings/backfill-categories-button.tsx:7`): triggers `backfillCategoryIdsAction` which bulk-fetches category IDs for videos missing them, in batches of 50 per API call
- **Interactive controls:**
  - Theme selector
  - Timezone selector
  - Auto-sync switch (presentational)
  - Sync interval selector (presentational)
  - Backfill button with loading + status message

#### `/about` — About Page
- **Server component:** `src/app/about/page.tsx`
- **Core purpose:** App information and navigation reference
- **Key UI elements:**
  - Navigation cards for each app section (Dashboard, Unwatched, Notes, Watchlist, Tags, Channels, Settings) with icon, label, description, and linked href
  - Quick facts card (Stack, Database, Auth)

---

## 3. Core Functionality & Features

### Channel Subscription Sync
1. User clicks "Sync Now" → `syncNowAction` server action (`src/actions/sync.ts:159`)
2. **Phase 1 — Subscriptions:** Calls YouTube `subscriptions.list` (mine=true, part=snippet, maxResults=50, paginated). Each page costs 1 quota unit. Maps results to channel values via `mapChannelValues` and batch-upserts into `channels` table. Collects all channel IDs.
3. **Phase 2 — Videos:** For each channel (max 50 per sync, quota permitting), calls `getChannelVideos` which:
   - Derives uploads playlist ID: `UU{channelId.slice(2)}`
   - Fetches `playlistItems` (1 unit, 50 results per page)
   - Fetches `videos.list` with the collected video IDs for details (1 unit, up to 50 IDs)
   - Total: 2 units per page of videos per channel
   - Stops at 50 videos per channel or when quota buffer is hit (9,900/10,000 units)
4. **Upserts:** Videos are `batchUpsertVideos` — `ON CONFLICT (id) DO UPDATE` on title, description, thumbnail, viewCount, categoryId
5. **Sync state:** `upsertSyncState` records `lastSyncedAt` and `lastVideoId` per channel
6. **Settings update:** `upsertSettings` stores `lastSyncAt` timestamp
7. **Revalidation:** `revalidatePath` on `/`, `/channels`, `/topics`

### Category Backfill
- `backfillCategoryIdsAction` (`sync.ts:252`):
  - Queries `getVideoIdsWithNullCategoryId` (videos with null `category_id`, up to 1000)
  - Batches in groups of 50, fetches `videos.list` (part=snippet) for category IDs (1 unit/batch)
  - Single `UPDATE … FROM (VALUES …)` for each batch via `batchUpdateVideoCategoryIds`
  - Revalidates `/unwatched`

### Watch History Tracking
- **Mark as watched:** Inserts into `watched` table with `ON CONFLICT DO NOTHING` (`queries.ts:94-99`)
- **Mark as unwatched:** Deletes from `watched` (`queries.ts:102`)
- **UI paths:**
  - Hover checkmark button on video card thumbnails (calls `toggleWatched`)
  - "Mark as Watched" action in `VideoActionDialog`
  - Marked-as-watched videos render at 55% opacity

### Video Notes
- **Add note:** `addNoteAction` in `src/actions/notes.ts:7` — inserts into `video_notes` with optional text
- **Trigger:** "Save to Notes" action in `VideoActionDialog`, which opens a sub-view with a textarea + Save/Skip buttons
- **Delete:** `deleteNoteAction` from the Notes page
- **Visual indicator:** Videos with notes have an amber ring (`ring-2 ring-amber-400`) and "NOTED" badge on the card + amber sticky-note icon in the top-right of the thumbnail

### Watchlist
- **Add:** "Add to Watchlist" action in `VideoActionDialog` → `addToWatchlistAction` in `src/actions/videos.ts:59`
- **Remove:** Delete button on watchlist items with confirmation dialog
- **On conflict:** `ON CONFLICT DO NOTHING` prevents duplicate entries

### Tag System
- **Create tag:** `CreateTagDialog` (modal with name + color inputs) → `createTagAction` in `src/actions/tags.ts:7`
- **Delete tag:** Trash icon per accordion section → `deleteTagAction` (soft delete via `deletedAt`)
- **Assign to channel:** `TagAssignPopover` (hover on channels in Tags page) → `assignTagToChannelAction`
- **Remove from channel:** Via `TagAssignPopover` → `removeTagFromChannelAction`
- **Filtering:** `useTopicFilter` hook (`src/hooks/use-topic-filter.ts:55`) computes visibility state from active filter + tag groups + untagged channels. Pure logic is extracted into `computeTopicVisibility` for testability.

### Video Sorting & Ordering
- **Dashboard:** Videos grouped by tag (alphabetical by tag name), then sorted by `publishedAt` descending within each group (`video-grouping.ts:10-48`). Videos without any channel tags go into an "Uncategorized" group.
- **Unwatched page:** Same tag grouping, or YouTube category grouping. Within each group, videos sorted by `publishedAt` descending (`unwatched-client.tsx:41`).
- **Channel detail page:** Cursor-based pagination ordered by `publishedAt` descending (`queries.ts:69`).
- **Watchlist:** Ordered by `addedAt` descending.
- **Notes:** Ordered by `createdAt` descending (most recently saved first).

### View Modes
- **Grid mode** (default): 1–4 column responsive grid (`VideoGrid` → `VideoCard`)
- **List mode**: 1–2 column layout (`VideoGrid` → `VideoListItem`)
- Toggle available via header in contexts that include `showViewToggle`

---

## 4. Implied User Stories

1. **"As a user, I can sync my YouTube subscriptions so that my dashboard stays current with new videos from channels I follow."**
   - `syncNowAction` → fetches subscriptions + recent videos → batch upserts into DB → revalidates pages

2. **"As a user, I can see all unwatched videos grouped by my custom tags so that I can quickly find content from channels I care most about."**
   - `groupByTag()` in `video-grouping.ts` + `DashboardAccordion` groups by channel tags + `UnwatchedClient` with tag/category toggle

3. **"As a user, I can mark a video as watched with one click so that it disappears from my unwatched feed."**
   - Hover checkmark on `VideoCard`/`VideoListItem` thumbnails → `toggleWatched` server action

4. **"As a user, I can save a video to my watchlist so that I don't lose track of videos I want to watch later."**
   - "Add to Watchlist" in `VideoActionDialog` → `addToWatchlistAction` → dedicated `/watchlist` page

5. **"As a user, I can add notes to a video so that I remember why I saved it or what I want to reference later."**
   - "Save to Notes" in `VideoActionDialog` → textarea + Save/Skip → `addNoteAction` → dedicated `/notes` page

6. **"As a user, I can create and assign custom tags to channels so that I can organize my subscriptions into meaningful groups."**
   - `/tags` page: `CreateTagDialog` + `TagAssignPopover` + filter pills + accordion grouping

7. **"As a user, I can browse all my unwatched videos grouped by YouTube category so that I can discover content by topic area."**
   - `/unwatched` page with Tags/Categories mode toggle → `groupByYTCategory()` using `getCategoryById()` from `categorizer.ts`

8. **"As a user, I can view a channel's video history so that I can catch up on content from a specific creator."**
   - `/channels/[id]` with cursor-paginated `getVideosByChannel`

9. **"As a user, I can customize the dashboard layout by resizing accordion sections so that I can allocate more screen space to important tag groups."**
   - `ResizableAccordionContent` with `re-resizable` + `localStorage` persistence + double-click-to-expand

10. **"As a user, I receive subtle audio feedback when interacting with the dashboard so that the interface feels responsive and polished."**
    - `useSound` hook with 4 distinct sounds (expand, collapse, drag-grab, full-expand) + mute toggle + `prefers-reduced-motion` respect

---

## 5. Current Discoverability Mechanisms

### Video Sorting & Ranking
- **No algorithmic ranking.** All video lists are strictly reverse-chronological (`publishedAt DESC`). There is no relevance scoring, engagement weighting, or personalization based on watch history.
- The single ordering dimension is **recency** — newest videos appear first within any group.

### Grouping & Categorization

**Primary: Tag-based grouping (Dashboard default)**
- Videos are associated with tags **indirectly** through their channel: `videos → channels → channel_tags → tags` (`queries.ts:133-159`)
- A video from a channel tagged "Tech" will appear under the "Tech" group even if the video itself has no direct tag
- Videos from channels with multiple tags appear in **all** relevant groups (a single video can belong to multiple groups simultaneously — `groupByTag` iterates all tags per video)
- Untagged channels' videos appear in an "Uncategorized" group at the bottom

**Secondary: YouTube Category grouping**
- Available on the `/unwatched` page via the mode toggle
- Maps `videos.categoryId` (populated during sync or backfill) to human-readable names using `getCategoryById()` from `src/lib/topics/categorizer.ts`
- 17 predefined YouTube categories (Film & Animation, Music, Gaming, Science & Technology, etc.)
- Videos without a `categoryId` go into "Uncategorized"
- Categories without any videos are omitted

### Unwatched Video Surface Area
Every unwatched video is surfaced in **three independent places**:
1. **Dashboard (`/`):** Tag-grouped accordion — the primary entry point. Only the first group is auto-expanded; others are collapsed by default.
2. **Unwatched page (`/unwatched`):** Full listing with stats, category badges, channel cloud, and tag/category toggle. All groups start collapsed; user can expand all.
3. **Tags page (`/tags`):** Each channel avatar shows an unwatched count badge in the top-right corner (e.g., "3", "99+"). This provides a per-channel unwatched signal even before navigating to the video list.

### Discovery Features Present
| Feature | Implementation | Location |
|---------|---------------|----------|
| Tag-based video grouping | `groupByTag()` | Dashboard + Unwatched page |
| YouTube category grouping | `groupByYTCategory()` | Unwatched page (toggle) |
| Channel cloud with counts | `ChannelsCloud` | Unwatched page sidebar |
| Category quick-jump badges | `CategoryBadges` with `#{slug}` anchors | Unwatched page |
| Per-channel unwatched badges | `unwatchedCount` overlay on avatars | Tags page |
| Filterable tag pills | `FilterPill` + `useTopicFilter` | Tags page |
| "View All" link | Links to `/unwatched` | Dashboard header |

### Discovery Features NOT Present
- **No search** — there is no search bar, no keyword search, no full-text search of video titles or descriptions
- **No recommendation engine** — no "because you watched," no similar-video suggestions, no trending/popularity sorting
- **No custom playlists or queues** — the watchlist is the only user-curated list; there are no topic-based playlists or auto-generated queues
- **No "Recently Watched" section** — watched videos simply disappear from the unwatched views (no browseable watch history)
- **No notification badges or indicators for "new since last visit"** — the unwatched count is absolute, not delta-based
- **No favoriting or priority system** — all unwatched videos have equal weight; no way to pin or star high-priority content
- **No multi-channel filtering** — the tag filter on /tags filters channels, not videos; there's no way to filter the unwatched view by tag or channel from the dashboard
- **No drag-and-drop reordering** — tag groups are alphabetically sorted; users cannot reorder groups or videos
- **No infinite scroll or "load more"** on unwatched views — hard limit of 500 unwatched videos (`queries.ts:133`)
