'use client';

import { useState } from 'react';
import type { LLMAnalysis, PersonalizedStudyPlan, DailyPlan, DetailedTask } from '@/types';

interface StudyPlanProps {
  tasks: LLMAnalysis['studyPlan'];
  personalizedStudyPlan?: PersonalizedStudyPlan;
}

// Storage key for persistence
const STORAGE_KEY = 'interviewproof-completed-tasks';

// Load completed tasks from localStorage
function loadCompletedTasks(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Ignore errors
  }
  return new Set();
}

// Save completed tasks to localStorage
function saveCompletedTasks(tasks: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...tasks]));
  } catch {
    // Ignore errors
  }
}

export function StudyPlan({ tasks, personalizedStudyPlan }: StudyPlanProps) {
  // Initialize state with localStorage value (runs only on client)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(() => loadCompletedTasks());
  const [openDays, setOpenDays] = useState<Set<number>>(new Set([1])); // Day 1 open by default

  // If we have a personalized plan, use it
  if (personalizedStudyPlan) {
    return (
      <PersonalizedPlanView
        plan={personalizedStudyPlan}
        completedTasks={completedTasks}
        setCompletedTasks={setCompletedTasks}
        openDays={openDays}
        setOpenDays={setOpenDays}
      />
    );
  }

  // Fall back to legacy view
  return (
    <LegacyPlanView
      tasks={tasks}
      completedTasks={completedTasks}
      setCompletedTasks={setCompletedTasks}
    />
  );
}

// Personalized day-by-day view
function PersonalizedPlanView({
  plan,
  completedTasks,
  setCompletedTasks,
  openDays,
  setOpenDays,
}: {
  plan: PersonalizedStudyPlan;
  completedTasks: Set<string>;
  setCompletedTasks: React.Dispatch<React.SetStateAction<Set<string>>>;
  openDays: Set<number>;
  setOpenDays: React.Dispatch<React.SetStateAction<Set<number>>>;
}) {
  const totalTasks = plan.dailyPlans.reduce((sum, d) => sum + d.tasks.length, 0);
  const completedCount = plan.dailyPlans.reduce(
    (sum, d) => sum + d.tasks.filter((t) => completedTasks.has(t.id)).length,
    0
  );
  const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const toggleTask = (taskId: string) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompletedTasks(newCompleted);
    saveCompletedTasks(newCompleted);
  };

  const toggleDay = (dayNumber: number) => {
    const newOpen = new Set(openDays);
    if (newOpen.has(dayNumber)) {
      newOpen.delete(dayNumber);
    } else {
      newOpen.add(dayNumber);
    }
    setOpenDays(newOpen);
  };

  const getDayProgress = (day: DailyPlan) => {
    const completed = day.tasks.filter((t) => completedTasks.has(t.id)).length;
    return { completed, total: day.tasks.length };
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
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Your {plan.totalDays}-Day Execution Roadmap
          </h2>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[var(--text-secondary)]">
            {completedCount}/{totalTasks} tasks
          </span>
          <span className="text-[var(--text-secondary)]">{plan.totalHours}h total</span>
        </div>
      </div>

      {/* Overall Progress bar */}
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

      {/* Day-by-day sections */}
      <div className="space-y-4">
        {plan.dailyPlans.map((day) => {
          const { completed, total } = getDayProgress(day);
          const dayProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
          const isComplete = completed === total && total > 0;
          const isOpen = openDays.has(day.dayNumber);

          return (
            <div key={day.dayNumber}>
              <button
                type="button"
                onClick={() => toggleDay(day.dayNumber)}
                className={`
                  w-full flex items-center justify-between p-4 rounded-xl border transition-all
                  ${
                    isComplete
                      ? 'bg-[var(--color-success-muted)] border-[var(--color-success)]/30'
                      : 'bg-[var(--bg-card)] border-[var(--border-default)] hover:border-[var(--border-accent)]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold
                      ${
                        isComplete
                          ? 'bg-[var(--color-success)] text-white'
                          : dayProgress > 0
                            ? 'bg-[var(--accent-primary)] text-white'
                            : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                      }
                    `}
                  >
                    {isComplete ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      day.dayNumber
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-[var(--text-primary)]">{day.label}</div>
                    <div className="text-sm text-[var(--text-muted)]">{day.theme}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="text-[var(--text-secondary)]">
                      {completed}/{total} tasks
                    </div>
                    <div className="text-[var(--text-muted)]">
                      {Math.round((day.totalMinutes / 60) * 10) / 10}h
                    </div>
                  </div>
                  <svg
                    className={`h-5 w-5 text-[var(--text-muted)] transition-transform ${
                      isOpen ? 'rotate-180' : ''
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
              <div
                className={`grid transition-all duration-200 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="mt-2 space-y-2 pl-4">
                    {day.tasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        isCompleted={completedTasks.has(task.id)}
                        onToggle={() => toggleTask(task.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Individual task item component
function TaskItem({
  task,
  isCompleted,
  onToggle,
}: {
  task: DetailedTask;
  isCompleted: boolean;
  onToggle: () => void;
}) {
  const getPriorityStyle = () => {
    if (isCompleted) return 'bg-[var(--color-success)] text-white';
    switch (task.priority) {
      case 'critical':
        return 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white';
      case 'high':
        return 'bg-[var(--color-warning)] text-white';
      default:
        return 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]';
    }
  };

  const getPriorityLabel = () => {
    if (task.priority === 'critical') return 'Critical';
    if (task.priority === 'high') return 'High Priority';
    return null;
  };

  const getCategoryIcon = () => {
    switch (task.category) {
      case 'technical':
        return (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        );
      case 'behavioral':
        return (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      case 'practice':
        return (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        );
    }
  };

  const priorityLabel = getPriorityLabel();

  return (
    <div
      onClick={onToggle}
      className={`
        flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all
        ${
          isCompleted
            ? 'bg-[var(--color-success-muted)] border-[var(--color-success)]/30'
            : 'bg-[var(--bg-card)] border-[var(--border-default)] hover:border-[var(--border-accent)]'
        }
      `}
    >
      {/* Checkbox */}
      <div
        className={`
          flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md
          text-xs font-bold transition-all ${getPriorityStyle()}
        `}
      >
        {isCompleted ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          getCategoryIcon()
        )}
      </div>

      <div className="flex-1 min-w-0">
        {priorityLabel && !isCompleted && (
          <span
            className={`
              inline-block text-xs font-medium px-2 py-0.5 rounded mb-1
              ${task.priority === 'critical' ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]'}
            `}
          >
            {priorityLabel}
          </span>
        )}
        <p
          className={`font-medium text-sm ${
            isCompleted ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'
          }`}
        >
          {task.task}
        </p>
        {task.description && (
          <p className="mt-1 text-xs text-[var(--text-muted)]">{task.description}</p>
        )}
      </div>

      <div
        className={`
          flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium
          ${
            isCompleted
              ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
          }
        `}
      >
        {task.timeEstimateMinutes}m
      </div>
    </div>
  );
}

// Legacy flat list view (for backwards compatibility)
function LegacyPlanView({
  tasks,
  completedTasks,
  setCompletedTasks,
}: {
  tasks: LLMAnalysis['studyPlan'];
  completedTasks: Set<string>;
  setCompletedTasks: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  if (tasks.length === 0) {
    return null;
  }

  const totalMinutes = tasks.reduce((sum, t) => sum + t.timeEstimateMinutes, 0);
  const completedMinutes = tasks
    .filter((_, i) => completedTasks.has(`legacy-${i}`))
    .reduce((sum, t) => sum + t.timeEstimateMinutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const completedHours = Math.round((completedMinutes / 60) * 10) / 10;
  const completedCount = tasks.filter((_, i) => completedTasks.has(`legacy-${i}`)).length;
  const progress = Math.round((completedCount / tasks.length) * 100);

  const toggleTask = (index: number) => {
    const taskId = `legacy-${index}`;
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompletedTasks(newCompleted);
    saveCompletedTasks(newCompleted);
  };

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
            {completedCount}/{tasks.length} tasks
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
          const isCompleted = completedTasks.has(`legacy-${index}`);
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
