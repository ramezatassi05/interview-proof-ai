'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Badge } from '@/components/ui/Badge';
import { relativeTime } from '@/lib/relative-time';
import { agentMeta } from './agents';
import { SectionLabel } from './_primitives';
import type { CompanyTaskOwnerKind, CompanyTaskStatus } from '@/server/agents/company/types';

export interface CompanyTask {
  id: string;
  sourceActionId: string | null;
  ownerKind: CompanyTaskOwnerKind;
  title: string;
  description: string | null;
  status: CompanyTaskStatus;
  dueAt: string | null;
  delegatedBy: string | null;
  delegationRationale: string | null;
  escalatedAt: string | null;
  escalationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

const BOARD_COLUMNS: { status: CompanyTaskStatus; label: string }[] = [
  { status: 'todo', label: 'Backlog' },
  { status: 'doing', label: 'In Progress' },
  { status: 'blocked', label: 'Blocked' },
  { status: 'done', label: 'Done' },
];

function ownerLabel(kind: CompanyTaskOwnerKind): string {
  return agentMeta(kind).label.replace('Director of ', '');
}

function TaskCard({ task }: { task: CompanyTask }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 30,
      }
    : undefined;

  const fromCeo = task.delegatedBy === 'ceo_orchestrator';
  const isEscalated = !!task.escalatedAt;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      title={isEscalated && task.escalationReason ? `Escalated: ${task.escalationReason}` : undefined}
      className={`cursor-grab border bg-[var(--bg-card)] p-2.5 active:cursor-grabbing ${
        isEscalated
          ? 'border-[var(--border-default)] border-l-2 border-l-[var(--color-warning,#f5a524)]'
          : 'border-[var(--border-default)]'
      } ${isDragging ? 'opacity-60 shadow-lg' : ''}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="default">{ownerLabel(task.ownerKind)}</Badge>
        {fromCeo && <Badge variant="accent">from CEO</Badge>}
        {isEscalated && <Badge variant="default">escalated</Badge>}
        <span className="ml-auto text-[10px] tabular-nums text-[var(--text-muted)]">
          {relativeTime(task.updatedAt)}
        </span>
      </div>
      <p
        className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-[var(--text-primary)]"
        title={task.title}
      >
        {task.title}
      </p>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">
          {task.description}
        </p>
      )}
      {fromCeo && task.delegationRationale && (
        <p className="mt-1 line-clamp-2 text-[11px] italic leading-snug text-[var(--text-muted)]">
          “{task.delegationRationale}”
        </p>
      )}
      {task.dueAt && (
        <p className="mt-1.5 text-[10px] tabular-nums text-[var(--accent-primary)]">
          Due {new Date(task.dueAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

function Column({
  status,
  label,
  tasks,
}: {
  status: CompanyTaskStatus;
  label: string;
  tasks: CompanyTask[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status}` });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[280px] flex-col gap-2 border bg-[var(--bg-primary)] p-3 transition-colors ${
        isOver
          ? 'border-[var(--border-accent)] bg-[var(--bg-elevated)]'
          : 'border-[var(--border-default)]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <SectionLabel>{label}</SectionLabel>
        <span className="text-[10px] tabular-nums text-[var(--text-muted)]">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.length === 0 ? (
          <p className="py-6 text-center text-[11px] text-[var(--text-muted)]">Empty</p>
        ) : (
          tasks.map((t) => <TaskCard key={t.id} task={t} />)
        )}
      </div>
    </div>
  );
}

export function TaskKanban({ initialTasks }: { initialTasks?: CompanyTask[] }) {
  const [tasks, setTasks] = useState<CompanyTask[]>(initialTasks ?? []);
  const [loading, setLoading] = useState(!initialTasks);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/company-tasks');
      const json = (await res.json()) as { data?: CompanyTask[]; error?: string };
      if (!res.ok || !json.data) throw new Error(json.error ?? 'Could not load tasks');
      setTasks(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialTasks) {
      setTasks(initialTasks);
      setLoading(false);
    } else {
      void fetchTasks();
    }
  }, [initialTasks, fetchTasks]);

  const grouped = useMemo(() => {
    const map: Record<CompanyTaskStatus, CompanyTask[]> = {
      todo: [],
      doing: [],
      blocked: [],
      done: [],
      canceled: [],
    };
    for (const t of tasks) map[t.status]?.push(t);
    return map;
  }, [tasks]);

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;
      const droppedOn = String(over.id);
      if (!droppedOn.startsWith('col:')) return;
      const newStatus = droppedOn.slice(4) as CompanyTaskStatus;
      const taskId = String(active.id);
      const current = tasks.find((t) => t.id === taskId);
      if (!current || current.status === newStatus) return;

      const prev = tasks;
      setTasks((rows) => rows.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
      setError(null);

      try {
        const res = await fetch('/api/admin/company-tasks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: taskId, status: newStatus }),
        });
        if (!res.ok) throw new Error('Update failed');
      } catch (e) {
        setTasks(prev);
        setError(e instanceof Error ? e.message : 'Update failed');
      }
    },
    [tasks]
  );

  return (
    <div className="border border-[var(--border-default)] bg-[var(--bg-card)] p-3">
      <div className="flex items-center justify-between gap-2 px-1 pb-3">
        <SectionLabel>Goals · Kanban</SectionLabel>
        <div className="flex items-center gap-3 text-[10px] tabular-nums text-[var(--text-muted)]">
          {error && <span className="text-[var(--color-danger)]">{error}</span>}
          <span>{tasks.length} tasks</span>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">
          No tasks yet. Approve a <span className="font-mono">create_task</span> action from the
          right rail to populate this board.
        </p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {BOARD_COLUMNS.map((col) => (
              <Column
                key={col.status}
                status={col.status}
                label={col.label}
                tasks={grouped[col.status]}
              />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}
