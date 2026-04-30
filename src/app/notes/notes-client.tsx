'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { formatRelativeTime } from '@/lib/utils/time';
import { deleteNoteAction } from '@/actions/notes';
import { ConfirmDeleteDialog, DeleteButton } from '@/components/ui/confirm-delete';
import type { VideoNoteWithVideo } from '@/lib/db/queries';

interface NotesClientProps {
  notes: VideoNoteWithVideo[];
}

function NoteCard({ note }: { note: VideoNoteWithVideo }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteNoteAction(note.id);
      setConfirmOpen(false);
    });
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${note.video.id}`;

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
          {note.video.thumbnail && (
            <Image
              src={note.video.thumbnail}
              alt={note.video.title}
              fill
              className="object-cover"
              sizes="128px"
            />
          )}
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
            {note.video.title}
          </a>
          <p className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground mb-2">
            <span className="text-primary/90 font-medium">{note.video.channelTitle}</span>
            <span className="opacity-30">·</span>
            <span>{formatRelativeTime(note.video.publishedAt)}</span>
          </p>
          {note.notes && (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5 leading-relaxed">
              {note.notes}
            </p>
          )}
        </div>

        {/* Delete button */}
        <DeleteButton onClick={() => setConfirmOpen(true)} />
      </div>

      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remove from Notes?"
        description={`This will remove the note for \u201c${note.video.title}\u201d. This action cannot be undone.`}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </>
  );
}

export function NotesClient({ notes }: NotesClientProps) {
  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
