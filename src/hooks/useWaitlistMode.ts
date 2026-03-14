'use client';

import { useSearchParams } from 'next/navigation';

const ENV_WAITLIST_MODE = process.env.NEXT_PUBLIC_WAITLIST_MODE === 'true';

/**
 * Returns true if the site should be in waitlist mode.
 * Waitlist mode is disabled when ?access=open is present in the URL,
 * even if the env var is set. The bypass is persisted in localStorage
 * so it survives page navigations after a single visit with the param.
 */
export function useWaitlistMode(): boolean {
  const searchParams = useSearchParams();
  const accessParam = searchParams.get('access');

  if (accessParam === 'open') {
    if (typeof window !== 'undefined') {
      localStorage.setItem('waitlist_bypass', 'true');
    }
    return false;
  }

  if (typeof window !== 'undefined' && localStorage.getItem('waitlist_bypass') === 'true') {
    return false;
  }

  return ENV_WAITLIST_MODE;
}
