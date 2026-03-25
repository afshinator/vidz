'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/lib/utils/theme';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}