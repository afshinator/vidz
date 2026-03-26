'use client';

import { useState, useTransition } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tag, Plus } from 'lucide-react';
import { assignTagToChannelAction, removeTagFromChannelAction, createTagAction } from '@/actions/tags';

type TagItem = { id: string; name: string; color: string | null };

interface TagAssignPopoverProps {
  channelId: string;
  allTags: TagItem[];
  assignedTagIds: string[];
}

export function TagAssignPopover({ channelId, allTags, assignedTagIds }: TagAssignPopoverProps) {
  const [open, setOpen] = useState(false);
  const [assigned, setAssigned] = useState(new Set(assignedTagIds));
  const [localTags, setLocalTags] = useState<TagItem[]>(allTags);
  const [newTagName, setNewTagName] = useState('');
  const [isPending, startTransition] = useTransition();

  function toggle(tagId: string, checked: boolean) {
    setAssigned((prev) => {
      const next = new Set(prev);
      checked ? next.add(tagId) : next.delete(tagId);
      return next;
    });
    startTransition(async () => {
      if (checked) {
        await assignTagToChannelAction(channelId, tagId);
      } else {
        await removeTagFromChannelAction(channelId, tagId);
      }
    });
  }

  function createNew() {
    const name = newTagName.trim();
    if (!name) return;
    setNewTagName('');
    startTransition(async () => {
      const tag = await createTagAction(name, '#6366f1');
      setLocalTags((prev) => [...prev, tag]);
      setAssigned((prev) => new Set([...prev, tag.id]));
      await assignTagToChannelAction(channelId, tag.id);
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground opacity-0 group-hover/chtopic:opacity-100 transition-opacity"
          onClick={(e) => e.preventDefault()}
        >
          <Tag className="h-3 w-3 mr-1" />
          Tag
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start" side="bottom">
        <p className="text-xs font-medium text-muted-foreground px-1 pb-1.5 mb-1 border-b">Assign topics</p>
        <div className="space-y-0.5 max-h-48 overflow-y-auto">
          {localTags.map((tag) => (
            <label
              key={tag.id}
              className="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-muted/50 cursor-pointer"
            >
              <Checkbox
                checked={assigned.has(tag.id)}
                onCheckedChange={(checked) => toggle(tag.id, !!checked)}
                disabled={isPending}
              />
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: tag.color || '#6366f1' }}
              />
              <span className="text-sm">{tag.name}</span>
            </label>
          ))}
          {localTags.length === 0 && (
            <p className="text-xs text-muted-foreground px-1 py-2">No topics yet — create one below</p>
          )}
        </div>
        <div className="mt-2 pt-2 border-t flex gap-1">
          <Input
            placeholder="New topic…"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createNew()}
            className="h-7 text-xs"
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 shrink-0"
            onClick={createNew}
            disabled={!newTagName.trim() || isPending}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
