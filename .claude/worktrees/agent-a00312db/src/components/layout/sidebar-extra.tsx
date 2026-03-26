'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSidebar } from './sidebar-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Channel } from '@/lib/db/schema';

export function SidebarChannelList({ channels }: { channels: Channel[] }) {
  const { setExtraContent } = useSidebar();

  useEffect(() => {
    setExtraContent(
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Channels</p>
        <div className="space-y-0.5">
          {channels.map((channel) => (
            <Link
              key={channel.id}
              href={`/channels/${channel.id}`}
              className="flex items-center gap-2 px-1 py-1.5 rounded-md text-xs hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarImage src={channel.thumbnail || undefined} alt={channel.title} />
                <AvatarFallback className="text-[10px]">{channel.title.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="truncate">{channel.title}</span>
            </Link>
          ))}
        </div>
      </div>
    );
    return () => setExtraContent(null);
  }, [channels, setExtraContent]);

  return null;
}
