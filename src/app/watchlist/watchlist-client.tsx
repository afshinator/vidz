'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Trash2, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatRelativeTime } from '@/lib/utils/time';
import { removeFromWatchlistAction } from '@/actions/videos';
import type { WatchlistVideo } from '@/lib/db/queries';

interface WatchlistClientProps {
  items: WatchlistVideo[];
}

function WatchlistCard({ item }: { item: WatchlistVideo }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      await removeFromWatchlistAction(item.id);
      setConfirmOpen(false);
    });
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${item.video.id}`;

  return (
    <>
      <div className="flex gap-3 rounded-xl border border-border/60 bg-card p-3 transition-all duration-150 hover:border-border hover:shadow-sm">
        {/* Thumbnail */}
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative shrink-0 overflow-hidden rounded-lg bg-muted"
          style={{ width: 128, aspectRatio: '16/9' }}
          onClick={(e) => e.stopPropagation()}
        >
          {item.video.thumbnail && (
            <Image
              src={item.video.thumbnail}
              alt={item.video.title}
              fill
              className="object-cover"
              sizes="128px"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
            <PlayCircle className="h-8 w-8 text-white" />
          </div>
        </a>

        {/* Content */}
        <div className="flex-1 min-w-0 py-0.5">
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="line-clamp-2 text-sm font-medium leading-snug mb-1 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {item.video.title}
          </a>
          <p className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground mb-2">
            <span className="text-primary/90 font-medium">{item.video.channelTitle}</span>
            <span className="opacity-30">·</span>
            <span>{formatRelativeTime(item.video.publishedAt)}</span>
            {item.video.duration && (
              <>
                <span className="opacity-30">·</span>
                <span>{item.video.duration}</span>
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            Added {item.addedAt ? formatRelativeTime(item.addedAt) : 'recently'}
          </p>
        </div>

        {/* Remove button */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Remove confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove from Watchlist?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will remove &ldquo;{item.video.title}&rdquo; from your watchlist. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={isPending}>
              {isPending ? 'Removing…' : 'Remove'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function WatchlistClient({ items }: WatchlistClientProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <WatchlistCard key={item.id} item={item} />
      ))}
    </div>
  );
}
