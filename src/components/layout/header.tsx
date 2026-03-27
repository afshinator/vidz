'use client';

import { useTheme } from '@/lib/utils/theme';
import { useViewMode } from '@/components/video/view-mode-context';
import { Moon, Sun, Monitor, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showViewToggle?: boolean;
}

export function Header({ title, subtitle, actions, showViewToggle = true }: HeaderProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const { viewMode, setViewMode } = useViewMode();
  const [signOutOpen, setSignOutOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur-sm -mx-4 md:-mx-6 px-4 md:px-6 py-3.5 mb-6">
      <div>
        {title && (
          <h1 className="font-heading text-2xl font-bold tracking-tight">{title}</h1>
        )}
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions}

        {/* View toggle */}
        {showViewToggle && (
          <div className="flex items-center gap-1.5 rounded-lg border border-border/60 px-2 py-1.5">
            <LayoutGrid
              className={cn(
                'h-3.5 w-3.5 transition-colors',
                viewMode === 'grid' ? 'text-primary' : 'text-muted-foreground/50'
              )}
            />
            <Switch
              size="sm"
              checked={viewMode === 'list'}
              onCheckedChange={(checked) => setViewMode(checked ? 'list' : 'grid')}
              aria-label="Toggle list view"
            />
            <List
              className={cn(
                'h-3.5 w-3.5 transition-colors',
                viewMode === 'list' ? 'text-primary' : 'text-muted-foreground/50'
              )}
            />
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              {resolvedTheme === 'dark' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="mr-2 h-4 w-4" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSignOutOpen(true)}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Sign out
        </Button>

        <Dialog open={signOutOpen} onOpenChange={setSignOutOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sign out?</DialogTitle>
              <DialogDescription>
                You can sign back in at any time. Note: if you have revoked app access via
                myaccount.google.com/permissions, signing back in will not automatically restore
                YouTube sync — you will need to re-authorize the app to get a new refresh token.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSignOutOpen(false)}>Cancel</Button>
              <Button onClick={() => signOut()}>Sign out</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
