'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextValue {
  extraContent: ReactNode;
  setExtraContent: (content: ReactNode) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  extraContent: null,
  setExtraContent: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [extraContent, setExtraContent] = useState<ReactNode>(null);
  return (
    <SidebarContext.Provider value={{ extraContent, setExtraContent }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
