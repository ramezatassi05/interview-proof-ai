'use client';

/**
 * usePrepPlanTaskSync — bridges localStorage-driven study-plan completion UI
 * to the server-backed prep_plan_tasks table (M4).
 *
 * Behavior:
 *  - On mount, hydrates from localStorage immediately (offline-first paint).
 *  - Then POSTs the client tasks to /api/report/[id]/prep-plan-tasks. On
 *    success, replaces the local completed set with the server's snapshot
 *    (server wins per CEO decision D2) and remembers the
 *    clientId → prep_plan_tasks.id mapping for future PATCH calls.
 *  - toggleTask updates local state + localStorage optimistically, then
 *    PATCHes the server. A server failure does not roll back the optimistic
 *    UI — localStorage stays as offline cache.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UsePrepPlanTaskSyncArgs {
  reportId: string;
  storagePrefix: string;
  clientTasks: {
    id: string;
    title: string;
    description?: string | null;
    category?: string | null;
    dayOffset?: number | null;
    estimatedMinutes?: number | null;
  }[];
}

interface SyncResponse {
  data: {
    planId: string;
    clientIdToTaskId: Record<string, string>;
    completedClientTaskIds: string[];
  };
}

function readLocalCompleted(reportId: string, storagePrefix: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(`${storagePrefix}${reportId}`);
    if (stored) return new Set(JSON.parse(stored) as string[]);
  } catch {
    // ignore
  }
  return new Set();
}

function writeLocalCompleted(reportId: string, storagePrefix: string, completed: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${storagePrefix}${reportId}`, JSON.stringify([...completed]));
  } catch {
    // ignore
  }
}

export function usePrepPlanTaskSync({
  reportId,
  storagePrefix,
  clientTasks,
}: UsePrepPlanTaskSyncArgs) {
  const [completed, setCompleted] = useState<Set<string>>(() =>
    readLocalCompleted(reportId, storagePrefix)
  );
  const mappingRef = useRef<Record<string, string>>({});
  const syncedRef = useRef(false);

  // Stable signature for the dependency array — re-sync only if the set of
  // client task ids changes meaningfully.
  const clientTasksKey = useMemo(
    () =>
      clientTasks
        .map((t) => t.id)
        .sort()
        .join('|'),
    [clientTasks]
  );

  useEffect(() => {
    if (syncedRef.current && clientTasksKey === '') return;
    if (clientTasks.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/report/${reportId}/prep-plan-tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientTasks }),
        });
        if (!res.ok) return;
        const json = (await res.json()) as SyncResponse;
        if (cancelled) return;

        mappingRef.current = json.data.clientIdToTaskId;
        const serverCompleted = new Set(json.data.completedClientTaskIds);
        setCompleted(serverCompleted);
        writeLocalCompleted(reportId, storagePrefix, serverCompleted);
        syncedRef.current = true;
      } catch {
        // Silent fallback — the component keeps localStorage state.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId, storagePrefix, clientTasksKey, clientTasks]);

  const toggleTask = useCallback(
    (clientTaskId: string) => {
      setCompleted((prev) => {
        const next = new Set(prev);
        const wasCompleted = next.has(clientTaskId);
        if (wasCompleted) next.delete(clientTaskId);
        else next.add(clientTaskId);
        writeLocalCompleted(reportId, storagePrefix, next);

        // Fire-and-forget PATCH (best-effort).
        const taskUuid = mappingRef.current[clientTaskId];
        if (taskUuid) {
          const status = wasCompleted ? 'pending' : 'done';
          fetch(`/api/report/${reportId}/prep-plan-tasks`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId: taskUuid, status }),
          }).catch(() => {
            // ignore — localStorage is the offline cache
          });
        }

        return next;
      });
    },
    [reportId, storagePrefix]
  );

  const setCompletedAndMirror = useCallback(
    (next: Set<string>) => {
      setCompleted(next);
      writeLocalCompleted(reportId, storagePrefix, next);
    },
    [reportId, storagePrefix]
  );

  return { completed, toggleTask, setCompleted: setCompletedAndMirror };
}
