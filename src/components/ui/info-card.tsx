import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReactNode } from 'react';

interface InfoCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function InfoCard({ title, description, children, className }: InfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={className}>{children}</CardContent>
    </Card>
  );
}
