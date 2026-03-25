'use client';

import { useTheme } from '@/lib/utils/theme';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeSelectorProps {
  defaultValue: string;
  userId: string;
}

export function ThemeSelector({ defaultValue }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  
  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;
  
  return (
    <div className="flex gap-2">
      {themes.map((t) => (
        <Button
          key={t.value}
          variant={theme === t.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme(t.value)}
          className={cn('gap-2', theme !== t.value && 'text-muted-foreground')}
        >
          <t.icon className="h-4 w-4" />
          {t.label}
        </Button>
      ))}
    </div>
  );
}