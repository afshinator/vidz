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
    <nav className="space-y-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
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
    <aside className="hidden md:flex flex-col w-64 h-screen border-r bg-card p-4 overflow-y-auto">
      <div className="mb-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">vidz</span>
        </Link>
      </div>
      <NavContent />
      {extraContent}
      <div className="mt-auto pt-4 border-t">
        <p className="text-xs text-muted-foreground">Personal YouTube Dashboard</p>
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
        <SheetContent side="left" className="w-64">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xl font-bold">vidz</span>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <NavContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}