"use client";

import { useState, useTransition, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUp, ArrowDown, Check, ListPlus, Loader2, CheckCircle2, ImageIcon, ImageMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/time";
import { formatDuration } from "@/lib/youtube/transformers";
import { markAsWatchedAction, addToWatchlistAction } from "@/actions/videos";
import { loadMoreUnwatchedAction } from "@/actions/listview";
import { VideoActionDialog } from "@/components/video/video-action-dialog";
import { TagAssignPopover } from "@/components/topic/tag-assign-popover";
import type { UnwatchedVideoWithTags, PaginatedResult } from "@/lib/db/queries";
import type { Tag } from "@/lib/db/schema";

type SortField = "publishedAt" | "title" | "channelTitle";
type ThumbSize = "sm" | "md" | "lg";

const THUMB_SIZES: Record<ThumbSize, number> = { sm: 32, md: 64, lg: 96 };

interface SortState {
  field: SortField;
  dir: "asc" | "desc";
}

// ── pure helpers ──

function nextSort(current: SortState, clicked: SortField): SortState {
  if (current.field === clicked) {
    return { field: clicked, dir: current.dir === "asc" ? "desc" : "asc" };
  }
  if (clicked === "publishedAt") return { field: "publishedAt", dir: "desc" };
  return { field: clicked, dir: "asc" };
}

function ariaSortValue(field: SortField, current: SortState): "ascending" | "descending" | "none" {
  if (current.field !== field) return "none";
  return current.dir === "asc" ? "ascending" : "descending";
}

function sortIcon(field: SortField, current: SortState) {
  if (current.field !== field) return null;
  return current.dir === "asc" ? (
    <ArrowUp className="h-3 w-3" />
  ) : (
    <ArrowDown className="h-3 w-3" />
  );
}

// ── components ──

function SortHeader({
  label,
  field,
  sort,
  onSort,
}: {
  label: string;
  field: SortField;
  sort: SortState;
  onSort: (field: SortField) => void;
}) {
  return (
    <button
      onClick={() => onSort(field)}
      aria-sort={ariaSortValue(field, sort)}
      className={cn(
        "flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm",
        sort.field === field && "text-foreground",
      )}
    >
      {label}
      {sortIcon(field, sort)}
    </button>
  );
}

function ThumbSizeToggle({
  size,
  onChange,
}: {
  size: ThumbSize;
  onChange: (s: ThumbSize) => void;
}) {
  return (
    <div className="flex items-center border rounded-lg p-0.5 text-muted-foreground" role="radiogroup" aria-label="Thumbnail size">
      <button
        onClick={() => onChange("sm")}
        role="radio"
        aria-checked={size === "sm"}
        aria-label="Extra small thumbnails"
        className={cn(
          "px-1.5 py-0.5 rounded text-[10px] transition-colors",
          size === "sm" ? "bg-secondary text-foreground shadow-sm" : "hover:text-foreground",
        )}
      >
        <ImageMinus className="h-3 w-3" />
      </button>
      <button
        onClick={() => onChange("md")}
        role="radio"
        aria-checked={size === "md"}
        aria-label="Small thumbnails"
        className={cn(
          "px-1.5 py-0.5 rounded text-[10px] transition-colors",
          size === "md" ? "bg-secondary text-foreground shadow-sm" : "hover:text-foreground",
        )}
      >
        <ImageIcon className="h-3 w-3" />
      </button>
      <button
        onClick={() => onChange("lg")}
        role="radio"
        aria-checked={size === "lg"}
        aria-label="Medium thumbnails"
        className={cn(
          "px-1.5 py-0.5 rounded text-[10px] transition-colors",
          size === "lg" ? "bg-secondary text-foreground shadow-sm" : "hover:text-foreground",
        )}
      >
        <ImageIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface ListRowProps {
  video: UnwatchedVideoWithTags;
  allTags: Tag[];
  thumbSize: ThumbSize;
  onRemove: (id: string) => void;
  onError: (msg: string) => void;
}

const ListRow = memo(function ListRow({ video, allTags, thumbSize, onRemove, onError }: ListRowProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [wlState, setWlState] = useState<"idle" | "pending" | "done">("idle");
  const assignedTagIds = video.tags.map((t) => t.id);
  const thumbW = THUMB_SIZES[thumbSize];

  const handleMarkWatched = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsWatchedAction(video.id);
      onRemove(video.id);
    } catch {
      onError("Failed to mark as watched");
    }
  };

  const handleAddToWatchlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setWlState("pending");
    try {
      await addToWatchlistAction(video.id);
      setWlState("done");
      setTimeout(() => setWlState("idle"), 1500);
    } catch {
      setWlState("idle");
      onError("Failed to add to watchlist");
    }
  };

  return (
    <>
      <div className="group flex items-center gap-3 border-b border-border/40 px-2 py-1.5 hover:bg-muted/30 transition-colors">
        {/* thumbnail */}
        <div
          className="relative shrink-0 overflow-hidden rounded bg-muted cursor-pointer transition-transform duration-200 hover:z-10 hover:scale-150"
          style={{ width: thumbW, aspectRatio: "16/9" }}
          onClick={() => setDialogOpen(true)}
        >
          {video.thumbnail ? (
            <Image src={video.thumbnail} alt={video.title} fill className="object-cover" sizes={`${thumbW}px`} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="h-3.5 w-3.5 rounded-full bg-muted-foreground/20" />
            </div>
          )}
          {thumbSize !== "sm" && (
            <div className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 text-[9px] font-medium text-white tabular-nums">
              {video.duration ? formatDuration(video.duration) : "0:00"}
            </div>
          )}
        </div>

        {/* title */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => setDialogOpen(true)}
            className="text-sm leading-snug line-clamp-1 text-left hover:underline cursor-pointer w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            {video.title}
          </button>
        </div>

        {/* channel */}
        <div className="w-28 shrink-0">
          {video.channelId ? (
            <Link
              href={`/channels/${video.channelId}`}
              className="text-xs text-primary/80 hover:underline line-clamp-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {video.channelTitle}
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">{video.channelTitle}</span>
          )}
        </div>

        {/* tag */}
        <div className="w-8 shrink-0 flex justify-center">
          {video.channelId && (
            <div onClick={(e) => e.stopPropagation()} title="Tag channel">
              <TagAssignPopover
                channelId={video.channelId}
                allTags={allTags}
                assignedTagIds={assignedTagIds}
              />
            </div>
          )}
        </div>

        {/* published */}
        <span className="w-24 shrink-0 text-xs text-muted-foreground text-right tabular-nums">
          {formatRelativeTime(video.publishedAt)}
        </span>

        {/* actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-green-500 focus-visible:ring-2 focus-visible:ring-ring"
            onClick={handleMarkWatched}
            aria-label="Mark as watched"
            title="Mark as watched"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
            disabled={wlState !== "idle"}
            onClick={handleAddToWatchlist}
            aria-label="Add to watchlist"
            title="Add to watchlist"
          >
            {wlState === "pending" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : wlState === "done" ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <ListPlus className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      <VideoActionDialog
        video={{ id: video.id, title: video.title, thumbnail: video.thumbnail, channelId: video.channelId }}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
});

// ── main ──

interface ListViewClientProps {
  initialData: PaginatedResult<UnwatchedVideoWithTags>;
  allTags: Tag[];
}

export function ListViewClient({ initialData, allTags }: ListViewClientProps) {
  const [videos, setVideos] = useState(initialData.data);
  const [cursor, setCursor] = useState<string | undefined>(initialData.nextCursor);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [sort, setSort] = useState<SortState>({ field: "publishedAt", dir: "desc" });
  const [loading, startLoad] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [thumbSize, setThumbSize] = useState<ThumbSize>("md");

  const clearError = () => setError(null);
  const headerSpacer = THUMB_SIZES[thumbSize];

  const handleSort = (field: SortField) => {
    const next = nextSort(sort, field);
    setSort(next);
    clearError();
    startLoad(async () => {
      try {
        const result = await loadMoreUnwatchedAction(50, {
          sortBy: next.field,
          sortDir: next.dir,
        });
        setVideos(result.data);
        setCursor(result.nextCursor);
        setHasMore(result.hasMore);
      } catch {
        setError("Failed to load videos. Please try again.");
      }
    });
  };

  const loadMore = () => {
    clearError();
    startLoad(async () => {
      try {
        const result = await loadMoreUnwatchedAction(50, {
          sortBy: sort.field,
          sortDir: sort.dir,
          cursor,
        });
        setVideos((prev) => [...prev, ...result.data]);
        setCursor(result.nextCursor);
        setHasMore(result.hasMore);
      } catch {
        setError("Failed to load more videos. Please try again.");
      }
    });
  };

  const handleRemove = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const handleError = (msg: string) => setError(msg);

  return (
    <div className="mt-4">
      {/* error banner */}
      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>{error}</span>
          <button onClick={clearError} className="ml-auto text-xs underline hover:no-underline">
            Dismiss
          </button>
        </div>
      )}

      {/* size toggle */}
      <div className="flex items-center justify-end mb-2">
        <ThumbSizeToggle size={thumbSize} onChange={setThumbSize} />
      </div>

      {/* header */}
      <div className="flex items-center gap-3 border-b-2 border-border px-2 pb-2 mb-1 sticky top-[57px] bg-background/95 backdrop-blur-sm z-[5]">
        <div style={{ width: headerSpacer }} />
        <div className="flex-1 min-w-0">
          <SortHeader label="Title" field="title" sort={sort} onSort={handleSort} />
        </div>
        <div className="w-28 shrink-0">
          <SortHeader label="Channel" field="channelTitle" sort={sort} onSort={handleSort} />
        </div>
        <div className="w-8 shrink-0" />
        <div className="w-24 shrink-0 text-right">
          <SortHeader label="Published" field="publishedAt" sort={sort} onSort={handleSort} />
        </div>
        <div className="w-16 shrink-0" />
      </div>

      {/* rows */}
      {videos.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">No unwatched videos.</p>
      )}
      {videos.map((v) => (
        <ListRow
          key={v.id}
          video={v}
          allTags={allTags}
          thumbSize={thumbSize}
          onRemove={handleRemove}
          onError={handleError}
        />
      ))}

      {/* load more */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Loading…
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
