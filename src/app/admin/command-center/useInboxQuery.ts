'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CompanyAction } from './_approvals';
import type { CompanyAgentKind } from '@/server/agents/company/types';

export type InboxStatus =
  | 'awaiting_approval'
  | 'rejected'
  | 'completed'
  | 'failed'
  | 'drafted'
  | 'approved';

export type InboxTriggeredBy = 'any' | 'user' | 'cron' | 'agent';

export interface InboxFilters {
  status: InboxStatus;
  agentKinds: CompanyAgentKind[]; // empty = all
  triggeredBy: InboxTriggeredBy;
  q: string;
}

export const DEFAULT_INBOX_FILTERS: InboxFilters = {
  status: 'awaiting_approval',
  agentKinds: [],
  triggeredBy: 'any',
  q: '',
};

interface FetchPageResponse {
  data: CompanyAction[];
  nextCursor: string | null;
}

async function fetchPage(filters: InboxFilters, cursor: string | null, signal: AbortSignal) {
  // Multi-select agentKind = client-side merge of N requests, dedup by id, re-sort by createdAt desc.
  const agentKinds = filters.agentKinds.length === 0 ? [null] : filters.agentKinds;

  const results = await Promise.all(
    agentKinds.map((kind) => {
      const params = new URLSearchParams();
      params.set('status', filters.status);
      if (kind) params.set('agentKind', kind);
      if (filters.triggeredBy !== 'any') params.set('triggeredBy', filters.triggeredBy);
      if (filters.q.trim()) params.set('q', filters.q.trim());
      if (cursor) params.set('cursor', cursor);
      return fetch(`/api/admin/company-agent/actions?${params.toString()}`, { signal }).then(
        async (res) => {
          if (!res.ok) throw new Error(`Failed to load actions (${res.status})`);
          return (await res.json()) as FetchPageResponse;
        }
      );
    })
  );

  const seen = new Set<string>();
  const merged: CompanyAction[] = [];
  for (const r of results) {
    for (const a of r.data) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      merged.push(a);
    }
  }
  merged.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  // When merging multiple agent requests, take the newest "next" cursor we got back —
  // if any agent has more, we're not done. Use the oldest createdAt from this page.
  const someHaveMore = results.some((r) => r.nextCursor !== null);
  const nextCursor = someHaveMore && merged.length > 0 ? merged[merged.length - 1].createdAt : null;

  return { data: merged, nextCursor };
}

export function useInboxQuery(filters: InboxFilters) {
  const [actions, setActions] = useState<CompanyAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Reset and fetch first page whenever filters change.
  useEffect(() => {
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;

    setLoading(true);
    setError(null);
    setActions([]);
    setNextCursor(null);

    fetchPage(filters, null, ctl.signal)
      .then((page) => {
        if (ctl.signal.aborted) return;
        setActions(page.data);
        setNextCursor(page.nextCursor);
      })
      .catch((err: unknown) => {
        if (ctl.signal.aborted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load actions');
      })
      .finally(() => {
        if (!ctl.signal.aborted) setLoading(false);
      });

    return () => ctl.abort();
    // We intentionally re-run on filter primitive changes; agentKinds is array, so include length + sorted join.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.triggeredBy, filters.q, filters.agentKinds.slice().sort().join(',')]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    const ctl = new AbortController();
    try {
      const page = await fetchPage(filters, nextCursor, ctl.signal);
      setActions((prev) => {
        const seen = new Set(prev.map((a) => a.id));
        const merged = [...prev];
        for (const a of page.data) {
          if (!seen.has(a.id)) merged.push(a);
        }
        return merged;
      });
      setNextCursor(page.nextCursor);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [filters, nextCursor, loadingMore]);

  const removeAction = useCallback((id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { actions, loading, loadingMore, error, nextCursor, loadMore, removeAction };
}
