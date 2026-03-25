'use client';

import Image from 'next/image';
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
    <Card className="overflow-hidden transition-all hover:shadow-md cursor-pointer">
      <CardContent className="p-4 flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={channel.thumbnail || undefined} alt={channel.title} />
          <AvatarFallback>{channel.title.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">
            {channel.customName || channel.title}
          </h3>
          {videoCount !== undefined && (
            <p className="text-sm text-muted-foreground">
              {videoCount} video{videoCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}