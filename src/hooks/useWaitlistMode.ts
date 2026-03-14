'use client';

const ENV_WAITLIST_MODE = process.env.NEXT_PUBLIC_WAITLIST_MODE === 'true';

/**
 * Returns true if the site should be in waitlist mode.
 * Waitlist mode is disabled when ?access=open is present in the URL,
 * even if the env var is set. The bypass is persisted in localStorage
 * so it survives page navigations after a single visit with the param.
 *
 * Uses window.location instead of useSearchParams() to avoid requiring
 * Suspense boundaries on every page that renders the Header.
 */
export function useWaitlistMode(): boolean {
  if (typeof window === 'undefined') return ENV_WAITLIST_MODE;

  const params = new URLSearchParams(window.location.search);
  if (params.get('access') === 'open') {
    localStorage.setItem('waitlist_bypass', 'true');
    return false;
  }

  if (localStorage.getItem('waitlist_bypass') === 'true') {
    return false;
  }

  return ENV_WAITLIST_MODE;
}
