'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { UserNotification } from '@/types';

const POLL_INTERVAL_MS = 30_000;

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  return `${d}d`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data, unreadCount } = await api.listNotifications({ limit: 12 });
      setItems(data);
      setUnread(unreadCount);
    } catch (err) {
      // Bell is best-effort — log and move on. Most likely cause is the
      // user_notifications migration hasn't been applied yet (404/500).
      console.error('[notification-bell] fetch failed:', err);
    }
  }, [user]);

  // Initial fetch + visibility-change refresh + interval poll.
  useEffect(() => {
    if (!user) return;
    void fetchNotifications();
    const handleFocus = () => void fetchNotifications();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void fetchNotifications();
    }, POLL_INTERVAL_MS);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      window.clearInterval(id);
    };
  }, [user, fetchNotifications]);

  // Outside-click closes the popover.
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handle);
    return () => window.removeEventListener('mousedown', handle);
  }, [open]);

  if (!user) return null;

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open) {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    }
  };

  const handleItemClick = async (n: UserNotification) => {
    if (!n.readAt) {
      // Optimistic update.
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
      setUnread((c) => Math.max(0, c - 1));
      try {
        await api.markNotificationRead(n.id);
      } catch (err) {
        console.error('[notification-bell] mark-read failed:', err);
      }
    }
    if (n.href) {
      router.push(n.href);
    }
    setOpen(false);
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnread(0);
    try {
      await api.markAllNotificationsRead();
    } catch (err) {
      console.error('[notification-bell] mark-all failed:', err);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--header-border)] bg-[var(--header-elevated)] text-[var(--header-text-secondary)] transition-colors hover:text-[var(--header-text)]"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent-primary)] px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-xs text-[var(--accent-primary)] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                You&apos;re all caught up.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border-default)]">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(n)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-elevated)] ${
                        n.readAt ? '' : 'bg-[var(--accent-primary)]/[0.04]'
                      }`}
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          n.readAt ? 'bg-transparent' : 'bg-[var(--accent-primary)]'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="line-clamp-2 text-xs text-[var(--text-secondary)]">
                            {n.body}
                          </p>
                        )}
                        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                          {formatRelative(n.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
