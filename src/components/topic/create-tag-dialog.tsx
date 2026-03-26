'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createTagAction } from '@/actions/tags';

const COLORS = [
  // Reds / pinks
  '#ef4444', '#f43f5e', '#ec4899', '#db2777',
  // Oranges / yellows
  '#f97316', '#fb923c', '#eab308', '#ca8a04',
  // Greens
  '#22c55e', '#16a34a', '#84cc16', '#10b981',
  // Blues / cyans
  '#06b6d4', '#0ea5e9', '#3b82f6', '#2563eb',
  // Purples / violets
  '#6366f1', '#4f46e5', '#8b5cf6', '#7c3aed',
  // Neutrals
  '#6b7280', '#475569', '#a16207', '#92400e',
];

export function CreateTagDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [isPending, startTransition] = useTransition();

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await createTagAction(trimmed, color);
      setName('');
      setColor('#6366f1');
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Topic
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create topic</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              placeholder="e.g. Tech, Gaming, News…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-7 w-7 rounded-full transition-all hover:scale-105',
                    color === c && 'ring-2 ring-offset-2 ring-offset-background scale-110'
                  )}
                  style={{ backgroundColor: c, ['--tw-ring-color' as string]: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!name.trim() || isPending}>
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
