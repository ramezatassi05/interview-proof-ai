'use client';

import { useState } from 'react';
import type { LLMAnalysis } from '@/types';

interface StudyPlanProps {
  tasks: LLMAnalysis['studyPlan'];
}

export function StudyPlan({ tasks }: StudyPlanProps) {
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());

  if (tasks.length === 0) {
    return null;
  }

  const totalMinutes = tasks.reduce((sum, t) => sum + t.timeEstimateMinutes, 0);
  const completedMinutes = tasks
    .filter((_, i) => completedTasks.has(i))
    .reduce((sum, t) => sum + t.timeEstimateMinutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const completedHours = Math.round((completedMinutes / 60) * 10) / 10;
  const progress = Math.round((completedTasks.size / tasks.length) * 100);

  const toggleTask = (index: number) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedTasks(newCompleted);
  };

  // Get number badge style based on priority
  const getNumberStyle = (index: number, isCompleted: boolean) => {
    if (isCompleted) {
      return 'bg-[var(--color-success)] text-white';
    }
    if (index === 0) {
      return 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white';
    }
    if (index < 3) {
      return 'bg-[var(--color-warning)] text-white';
    }
    return 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]';
  };

  // Get priority label
  const getPriorityLabel = (index: number) => {
    if (index === 0) return 'Top Priority';
    if (index < 3) return 'High Priority';
    return null;
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-[var(--accent-primary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Execution Roadmap</h2>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[var(--text-secondary)]">
            {completedTasks.size}/{tasks.length} tasks
          </span>
          <span className="text-[var(--text-secondary)]">
            {completedHours}/{totalHours}h completed
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">Overall Progress</span>
          <span className="text-sm font-bold text-[var(--accent-primary)]">{progress}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[var(--track-bg)]">
          <div
            className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task, index) => {
          const isCompleted = completedTasks.has(index);
          const priorityLabel = getPriorityLabel(index);

          return (
            <div
              key={index}
              onClick={() => toggleTask(index)}
              className={`
                flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-all
                ${
                  isCompleted
                    ? 'bg-[var(--color-success-muted)] border-[var(--color-success)]/30'
                    : 'bg-[var(--bg-card)] border-[var(--border-default)] hover:border-[var(--border-accent)]'
                }
              `}
            >
              {/* Numbered Circle */}
              <div
                className={`
                  flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full
                  text-sm font-bold transition-all
                  ${getNumberStyle(index, isCompleted)}
                `}
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              <div className="flex-1 min-w-0">
                {priorityLabel && !isCompleted && (
                  <span
                    className={`
                      inline-block text-xs font-medium px-2 py-0.5 rounded mb-1.5
                      ${index === 0 ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]'}
                    `}
                  >
                    {priorityLabel}
                  </span>
                )}
                <p
                  className={`font-medium ${
                    isCompleted
                      ? 'text-[var(--text-muted)] line-through'
                      : 'text-[var(--text-primary)]'
                  }`}
                >
                  {task.task}
                </p>
              </div>

              <div
                className={`
                  flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium
                  ${
                    isCompleted
                      ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                  }
                `}
              >
                {task.timeEstimateMinutes} min
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
