'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { TagAssignPopover } from './tag-assign-popover';
import { deleteTagAction } from '@/actions/tags';
import type { ChannelWithTags } from '@/lib/db/queries';
import type { Tag } from '@/lib/db/schema';

interface TopicsClientProps {
  channels: ChannelWithTags[];
  allTags: Tag[];
}

export function TopicsClient({ channels, allTags }: TopicsClientProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const tagGroups = allTags.map((tag) => ({
    tag,
    channels: channels.filter((c) => c.tags.some((t) => t.id === tag.id)),
  }));

  const untagged = channels.filter((c) => c.tags.length === 0);

  let visibleGroups: typeof tagGroups;
  let showUntagged: boolean;

  if (activeFilter === null) {
    visibleGroups = tagGroups.filter((g) => g.channels.length > 0);
    showUntagged = untagged.length > 0;
  } else if (activeFilter === 'untagged') {
    visibleGroups = [];
    showUntagged = true;
  } else {
    visibleGroups = tagGroups.filter((g) => g.tag.id === activeFilter && g.channels.length > 0);
    showUntagged = false;
  }

  return (
    <div>
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <FilterPill active={activeFilter === null} onClick={() => setActiveFilter(null)}>
          All · {channels.length}
        </FilterPill>
        {allTags.map((tag) => {
          const count = channels.filter((c) => c.tags.some((t) => t.id === tag.id)).length;
          return (
            <FilterPill
              key={tag.id}
              active={activeFilter === tag.id}
              color={tag.color}
              onClick={() => setActiveFilter(tag.id)}
            >
              {tag.name} · {count}
            </FilterPill>
          );
        })}
        {untagged.length > 0 && (
          <FilterPill
            active={activeFilter === 'untagged'}
            onClick={() => setActiveFilter('untagged')}
          >
            Untagged · {untagged.length}
          </FilterPill>
        )}
      </div>

      {/* Grouped sections */}
      <div className="space-y-8">
        {visibleGroups.map(({ tag, channels: groupChannels }) => (
          <section key={tag.id}>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: tag.color || '#6366f1' }}
              />
              <h2 className="text-base font-semibold">{tag.name}</h2>
              <span className="text-sm text-muted-foreground">({groupChannels.length})</span>
              <div className="flex-1 h-px bg-border/60 ml-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground/40 hover:text-destructive transition-colors"
                onClick={() => startTransition(() => deleteTagAction(tag.id))}
                title="Delete topic"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <ChannelGrid channels={groupChannels} allTags={allTags} />
          </section>
        ))}

        {showUntagged && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-semibold text-muted-foreground">Untagged</h2>
              <span className="text-sm text-muted-foreground">({untagged.length})</span>
              <div className="flex-1 h-px bg-border/60 ml-1" />
            </div>
            <ChannelGrid channels={untagged} allTags={allTags} />
          </section>
        )}

        {channels.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No channels yet — sync your YouTube subscriptions to get started.
          </p>
        )}

        {channels.length > 0 && visibleGroups.length === 0 && !showUntagged && (
          <p className="text-sm text-muted-foreground">No channels in this topic.</p>
        )}
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string | null;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all border',
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
          : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
      )}
    >
      {color && !active && (
        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      )}
      {children}
    </button>
  );
}

function ChannelGrid({
  channels,
  allTags,
}: {
  channels: ChannelWithTags[];
  allTags: Tag[];
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
      {channels.map((channel) => (
        <div key={channel.id} className="group/chtopic relative">
          <Link href={`/channels/${channel.id}`}>
            <Card className="overflow-hidden transition-all duration-200 hover:scale-[1.015] hover:shadow-lg hover:shadow-black/8 dark:hover:shadow-black/30">
              <CardContent className="px-2.5 py-2 flex items-center gap-2">
                <Avatar className="h-7 w-7 shrink-0 ring-1 ring-border transition-all group-hover/chtopic:ring-primary/40">
                  <AvatarImage src={channel.thumbnail || undefined} alt={channel.title} />
                  <AvatarFallback className="bg-primary/10 text-primary font-heading font-semibold text-xs">
                    {channel.title.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs truncate leading-tight">{channel.customName || channel.title}</p>
                  {channel.unwatchedCount > 0 && (
                    <span className="text-[10px] text-primary font-medium">{channel.unwatchedCount} new</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
          <div className="absolute top-2 right-2 z-10">
            <TagAssignPopover
              channelId={channel.id}
              allTags={allTags}
              assignedTagIds={channel.tags.map((t) => t.id)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
