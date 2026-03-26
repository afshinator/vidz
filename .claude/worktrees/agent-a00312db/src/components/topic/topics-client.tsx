'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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

  const allSectionIds = [
    ...visibleGroups.map((g) => g.tag.id),
    ...(showUntagged ? ['untagged'] : []),
  ];
  const [openSections, setOpenSections] = useState<string[]>(allSectionIds);
  const allOpen = openSections.length >= allSectionIds.length;

  return (
    <div>
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
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
        {allSectionIds.length > 1 && (
          <button
            onClick={() => setOpenSections(allOpen ? [] : allSectionIds)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        )}
      </div>

      {/* Grouped accordion sections */}
      {(visibleGroups.length > 0 || showUntagged) ? (
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="space-y-2"
        >
          {visibleGroups.map(({ tag, channels: groupChannels }) => (
            <AccordionItem
              key={tag.id}
              value={tag.id}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline py-3 [&>svg]:shrink-0">
                <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color || '#6366f1' }}
                  />
                  <span className="text-sm font-semibold">{tag.name}</span>
                  <span className="text-xs text-muted-foreground">({groupChannels.length})</span>
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      startTransition(() => deleteTagAction(tag.id));
                    }}
                    title="Delete topic"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1 [&_a]:no-underline">
                <ChannelGrid channels={groupChannels} allTags={allTags} />
              </AccordionContent>
            </AccordionItem>
          ))}

          {showUntagged && (
            <AccordionItem value="untagged" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-muted-foreground">Untagged</span>
                  <span className="text-xs text-muted-foreground">({untagged.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-1 [&_a]:no-underline">
                <ChannelGrid channels={untagged} allTags={allTags} />
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      ) : (
        <p className="text-sm text-muted-foreground">
          {channels.length === 0
            ? 'No channels yet — sync your YouTube subscriptions to get started.'
            : 'No channels in this topic.'}
        </p>
      )}
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
    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
      {channels.map((channel) => (
        <div key={channel.id} className="group/chtopic relative">
          <Link href={`/channels/${channel.id}`}>
            <div className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-center">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-transparent transition-all group-hover/chtopic:ring-primary/50">
                  <AvatarImage src={channel.thumbnail || undefined} alt={channel.title} />
                  <AvatarFallback className="bg-primary/10 text-primary font-heading font-bold text-base">
                    {channel.title.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {channel.unwatchedCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center leading-none">
                    {channel.unwatchedCount > 99 ? '99+' : channel.unwatchedCount}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium leading-tight line-clamp-2 w-full">
                {channel.customName || channel.title}
              </p>
            </div>
          </Link>
          <div className="absolute -top-1 -right-1 z-10 opacity-0 group-hover/chtopic:opacity-100 transition-opacity">
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
