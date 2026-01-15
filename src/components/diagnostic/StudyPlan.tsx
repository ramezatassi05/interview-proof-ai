import type { LLMAnalysis } from '@/types';

interface StudyPlanProps {
  tasks: LLMAnalysis['studyPlan'];
}

export function StudyPlan({ tasks }: StudyPlanProps) {
  if (tasks.length === 0) {
    return null;
  }

  const totalMinutes = tasks.reduce((sum, t) => sum + t.timeEstimateMinutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Study Plan</h2>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">~{totalHours} hours total</span>
      </div>

      <div className="space-y-2">
        {tasks.map((task, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700"
            />
            <div className="flex-1">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{task.task}</p>
            </div>
            <span className="flex-shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
              {task.timeEstimateMinutes} min
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
