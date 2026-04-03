'use client';

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'ip_diagnostic_walkthrough_seen';

function getHasSeen(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function useDashboardWalkthrough() {
  const [hasSeenWalkthrough, setHasSeenWalkthrough] = useState(getHasSeen);
  const [isOpen, setIsOpen] = useState(() => !getHasSeen());

  const close = useCallback(() => {
    setIsOpen(false);
    setHasSeenWalkthrough(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // localStorage unavailable — silently ignore
    }
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  return { isOpen, open, close, hasSeenWalkthrough };
}
