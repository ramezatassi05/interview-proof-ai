import { Skeleton } from '@/components/ui/skeleton';

export function DiagnosticSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Toolbar skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-2" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-2" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Hero dashboard skeleton */}
      <div className="mb-8 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Radial score */}
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-40 w-40 rounded-full" />
            <Skeleton className="h-6 w-20 rounded" />
          </div>

          {/* Metric cards + risk snapshot */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-5 w-64" />
          </div>
        </div>

        {/* Priority action */}
        <Skeleton className="mt-6 h-16 rounded-xl" />
      </div>

      {/* Tab bar skeleton */}
      <div className="mb-6 flex gap-2 rounded-2xl bg-[var(--bg-card)] p-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 flex-1 rounded-lg" />
        ))}
      </div>

      {/* Tab content skeleton */}
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
