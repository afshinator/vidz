'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Hash, Tv, Settings, Menu, X, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useSidebar } from './sidebar-context';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/unwatched', label: 'Unwatched', icon: PlayCircle },
  { href: '/topics', label: 'Topics', icon: Hash },
  { href: '/channels', label: 'Channels', icon: Tv },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-0.5">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <item.icon className={cn('h-4 w-4', isActive && 'text-primary')} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const { extraContent } = useSidebar();
  return (
    <aside className="hidden md:flex flex-col w-64 h-screen border-r bg-sidebar p-4 overflow-y-auto relative">
      {/* Crimson accent line at top */}
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-primary via-primary/50 to-transparent rounded-tl-sm" />

      <div className="mb-6 mt-1">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-all group-hover:shadow-md group-hover:scale-105">
            <PlayCircle className="h-4 w-4" />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight">vidz</span>
        </Link>
      </div>

      <NavContent />
      {extraContent}

      <div className="mt-auto pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground/60">Personal YouTube Dashboard</p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-40">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-sidebar">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PlayCircle className="h-4 w-4" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight">vidz</span>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="ml-auto">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <NavContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
