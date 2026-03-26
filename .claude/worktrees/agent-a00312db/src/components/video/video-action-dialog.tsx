'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, BookmarkPlus, Loader2, CheckCircle2 } from 'lucide-react';
import { addNoteAction } from '@/actions/notes';

interface VideoActionDialogProps {
  video: {
    id: string;
    title: string;
    thumbnail?: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoActionDialog({ video, open, onOpenChange }: VideoActionDialogProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpenYouTube() {
    window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank');
    onOpenChange(false);
  }

  function handleShowNotes() {
    setShowNotes(true);
  }

  function handleSave(skipNotes?: boolean) {
    startTransition(async () => {
      await addNoteAction(video.id, skipNotes ? undefined : notesText.trim() || undefined);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setShowNotes(false);
        setNotesText('');
        onOpenChange(false);
      }, 1000);
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setShowNotes(false);
      setNotesText('');
      setSaved(false);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="line-clamp-2 text-base leading-snug pr-6">
            {video.title}
          </DialogTitle>
        </DialogHeader>

        {saved ? (
          <div className="flex flex-col items-center gap-2 py-6 text-green-500">
            <CheckCircle2 className="h-8 w-8" />
            <p className="text-sm font-medium">Saved to Notes</p>
          </div>
        ) : !showNotes ? (
          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="default"
              className="w-full justify-start gap-2"
              onClick={handleOpenYouTube}
            >
              <ExternalLink className="h-4 w-4" />
              Open in YouTube
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleShowNotes}
            >
              <BookmarkPlus className="h-4 w-4" />
              Save to Notes
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <textarea
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
              placeholder="Add a note... (optional)"
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => handleSave(true)}
              >
                Skip
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => handleSave(false)}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
