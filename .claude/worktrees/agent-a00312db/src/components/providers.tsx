'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/lib/utils/theme';
import { SidebarProvider } from '@/components/layout/sidebar-context';
import { ViewModeProvider } from '@/components/video/view-mode-context';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <SidebarProvider>
          <ViewModeProvider>{children}</ViewModeProvider>
        </SidebarProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}