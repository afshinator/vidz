'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopicCardProps {
  topic: {
    id: string;
    name: string;
    type: string;
    keywords?: string[] | null;
    categoryId?: string | null;
    color?: string | null;
  };
  videoCount?: number;
  onEdit?: (topicId: string) => void;
  onDelete?: (topicId: string) => void;
}

export function TopicCard({ topic, videoCount, onEdit, onDelete }: TopicCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: topic.color || '#6366f1' }}
            />
            <h3 className="font-medium">{topic.name}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(topic.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(topic.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Badge variant="outline" className="text-xs">
            {topic.type === 'keyword' ? 'Keywords' : 'Category'}
          </Badge>
          {videoCount !== undefined && (
            <span className="text-xs">{videoCount} video{videoCount !== 1 ? 's' : ''}</span>
          )}
        </div>
        {topic.type === 'keyword' && topic.keywords?.length && (
          <div className="flex flex-wrap gap-1">
            {topic.keywords.slice(0, 5).map((kw, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {kw}
              </Badge>
            ))}
            {topic.keywords.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{topic.keywords.length - 5}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}