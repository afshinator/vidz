'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Tv } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ChannelCount {
  id: string;
  title: string;
  count: number;
}

export function ChannelsCloud({ channels }: { channels: ChannelCount[] }) {
  const [isOpen, setIsOpen] = useState(true);

  if (channels.length === 0) return null;

  return (
    <div className="border-t border-border/50 pt-3 space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Tv className="h-3 w-3" />
        <span>Channels</span>
        <span className="text-muted-foreground/50">({channels.length})</span>
        {isOpen ? (
          <ChevronUp className="h-3 w-3 ml-auto" />
        ) : (
          <ChevronDown className="h-3 w-3 ml-auto" />
        )}
      </button>

      <div
        className={cn(
          'flex flex-wrap gap-1.5 overflow-hidden transition-all duration-200',
          isOpen ? 'opacity-100' : 'hidden'
        )}
      >
        {channels.map((ch) => (
          <Link key={ch.id} href={`/channels/${ch.id}`}>
            <Badge
              variant="outline"
              className="cursor-pointer hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-150 text-xs"
            >
              {ch.title}
              <span className="ml-1.5 font-semibold tabular-nums">{ch.count}</span>
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
