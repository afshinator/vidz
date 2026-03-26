'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChannelCardProps {
  channel: {
    id: string;
    title: string;
    thumbnail?: string | null;
    customName?: string | null;
  };
  videoCount?: number;
}

export function ChannelCard({ channel, videoCount }: ChannelCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-200 cursor-pointer group/channel hover:scale-[1.015] hover:shadow-lg hover:shadow-black/8 dark:hover:shadow-black/30">
      <CardContent className="p-4 flex items-center gap-3">
        <Avatar className="h-11 w-11 shrink-0 ring-2 ring-border transition-all duration-150 group-hover/channel:ring-primary/40">
          <AvatarImage src={channel.thumbnail || undefined} alt={channel.title} />
          <AvatarFallback className="bg-primary/10 text-primary font-heading font-semibold text-sm">
            {channel.title.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate text-sm leading-snug">
            {channel.customName || channel.title}
          </h3>
          {videoCount !== undefined && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {videoCount} video{videoCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
