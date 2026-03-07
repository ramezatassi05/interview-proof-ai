'use client';

import { useState, useCallback } from 'react';
import type { DailyPlan, DetailedTask } from '@/types';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';

interface TimelineRoadmapProps {
  dailyPlans: DailyPlan[];
  reportId: string;
}

const STORAGE_PREFIX = 'interviewproof-timeline-';

function loadCompletedTasks(reportId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${reportId}`);
    if (stored) return new Set(JSON.parse(stored));
  } catch { /* ignore */ }
  return new Set();
}

function saveCompletedTasks(reportId: string, completed: Set<string>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_PREFIX}${reportId}`, JSON.stringify([...completed]));
}

function getDayStatus(
  tasks: DetailedTask[],
  completed: Set<string>
): 'complete' | 'in-progress' | 'upcoming' {
  const completedCount = tasks.filter((t) => completed.has(t.id)).length;
  if (completedCount === tasks.length) return 'complete';
  if (completedCount > 0) return 'in-progress';
  return 'upcoming';
}

const STATUS_CONFIG = {
  complete: {
    badge: 'success' as const,
    label: 'Complete',
    dotClass: 'bg-[var(--color-success)]',
  },
  'in-progress': {
    badge: 'accent' as const,
    label: 'In Progress',
    dotClass: 'bg-[var(--accent-primary)]',
  },
  upcoming: {
    badge: 'default' as const,
    label: 'Upcoming',
    dotClass: 'bg-[var(--bg-elevated)] border-2 border-[var(--border-default)]',
  },
};

export function TimelineRoadmap({ dailyPlans, reportId }: TimelineRoadmapProps) {
  const [completed, setCompleted] = useState(() => loadCompletedTasks(reportId));

  const totalTasks = dailyPlans.reduce((sum, day) => sum + day.tasks.length, 0);
  const completedCount = dailyPlans.reduce(
    (sum, day) => sum + day.tasks.filter((t) => completed.has(t.id)).length,
    0
  );
  const overallPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const toggleTask = useCallback(
    (taskId: string) => {
      setCompleted((prev) => {
        const next = new Set(prev);
        if (next.has(taskId)) next.delete(taskId);
        else next.add(taskId);
        saveCompletedTasks(reportId, next);
        return next;
      });
    },
    [reportId]
  );

  // Auto-expand: first non-complete day, or last day
  const firstActiveDayIndex = dailyPlans.findIndex(
    (day) => getDayStatus(day.tasks, completed) !== 'complete'
  );
  const defaultExpandedDay = firstActiveDayIndex >= 0 ? firstActiveDayIndex : dailyPlans.length - 1;

  const [expandedDays, setExpandedDays] = useState<Set<number>>(
    () => new Set([defaultExpandedDay])
  );

  const toggleDay = useCallback((dayIndex: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayIndex)) next.delete(dayIndex);
      else next.add(dayIndex);
      return next;
    });
  }, []);

  return (
    <div className="space-y-4">
      {/* Overall progress */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">Overall Progress</span>
          <span className="text-sm font-mono font-bold text-[var(--accent-primary)]">
            {overallPercent}%
          </span>
        </div>
        <ProgressBar value={overallPercent} max={100} variant="accent" showValue={false} size="md" />
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          {completedCount} of {totalTasks} tasks completed
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-[var(--border-default)]" />

        <div className="space-y-3">
          {dailyPlans.map((day, dayIndex) => {
            const status = getDayStatus(day.tasks, completed);
            const config = STATUS_CONFIG[status];
            const isExpanded = expandedDays.has(dayIndex);

            return (
              <div key={dayIndex} className="relative pl-10">
                {/* Timeline dot */}
                <div
                  className={`absolute left-[8px] top-[14px] h-4 w-4 rounded-full ${config.dotClass}`}
                />

                {/* Day header */}
                <button
                  onClick={() => toggleDay(dayIndex)}
                  className="flex w-full items-center justify-between rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] px-4 py-3 text-left transition-colors hover:border-[var(--border-accent)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {day.label}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{day.theme}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={config.badge}>{config.label}</Badge>
                    <svg
                      className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {/* Day tasks (collapsible) */}
                <div
                  className={`grid transition-all duration-200 ease-in-out ${
                    isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="mt-2 space-y-1.5 pb-1">
                      {day.tasks.map((task) => {
                        const isCompleted = completed.has(task.id);
                        return (
                          <label
                            key={task.id}
                            className="flex items-start gap-3 rounded-lg bg-[var(--bg-elevated)] px-3 py-2.5 cursor-pointer transition-colors hover:bg-[var(--bg-card)]"
                          >
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => toggleTask(task.id)}
                              className="mt-0.5 h-4 w-4 rounded border-[var(--border-default)] accent-[var(--accent-primary)]"
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm ${
                                  isCompleted
                                    ? 'line-through text-[var(--text-muted)]'
                                    : 'text-[var(--text-primary)]'
                                }`}
                              >
                                {task.task}
                              </p>
                              {task.description && (
                                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <span className="flex-shrink-0 text-[10px] font-mono text-[var(--text-muted)]">
                              {task.timeEstimateMinutes}m
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
