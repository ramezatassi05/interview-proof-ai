'use client';

import { useCallback, useRef, useState } from 'react';

export function useLazyTab(defaultTab: string) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const mountedTabs = useRef(new Set<string>([defaultTab]));

  const switchTab = useCallback((tabId: string) => {
    mountedTabs.current.add(tabId);
    setActiveTab(tabId);
  }, []);

  const hasBeenMounted = useCallback(
    (tabId: string) => mountedTabs.current.has(tabId),
    []
  );

  return { activeTab, switchTab, hasBeenMounted };
}
