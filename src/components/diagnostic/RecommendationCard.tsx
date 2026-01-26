import { ReactNode } from 'react';
import { Badge } from '@/components/ui/Badge';

type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

interface RecommendationCardProps {
  title: string;
  description: string;
  priority: RecommendationPriority;
  actionItems?: string[];
  icon?: ReactNode;
  className?: string;
}

const priorityConfig: Record<
  RecommendationPriority,
  { label: string; variant: 'critical' | 'high' | 'medium' | 'low' }
> = {
  critical: { label: 'Fix Immediately', variant: 'critical' },
  high: { label: 'High Priority', variant: 'high' },
  medium: { label: 'Recommended', variant: 'medium' },
  low: { label: 'Nice to Have', variant: 'low' },
};

export function RecommendationCard({
  title,
  description,
  priority,
  actionItems,
  icon,
  className = '',
}: RecommendationCardProps) {
  const config = priorityConfig[priority];
  const isCritical = priority === 'critical' || priority === 'high';

  return (
    <div
      className={`
        rounded-xl border p-5
        ${
          isCritical
            ? 'bg-[var(--color-danger-muted)] border-[var(--color-danger)]/30'
            : 'bg-[var(--bg-card)] border-[var(--border-default)]'
        }
        ${className}
      `}
    >
      <div className="flex items-start gap-4">
        <div
          className={`
            flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg
            ${
              isCritical
                ? 'bg-[var(--color-danger)]/20 text-[var(--color-danger)]'
                : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
            }
          `}
        >
          {icon || (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
          <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p>

          {actionItems && actionItems.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Action Items
              </p>
              <ul className="space-y-2">
                {actionItems.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                  >
                    <svg
                      className="h-4 w-4 flex-shrink-0 mt-0.5 text-[var(--accent-primary)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface RecommendationListProps {
  recommendations: Array<{
    title: string;
    description: string;
    priority: RecommendationPriority;
    actionItems?: string[];
  }>;
  title?: string;
  className?: string;
}

export function RecommendationList({
  recommendations,
  title = 'Recommendations',
  className = '',
}: RecommendationListProps) {
  if (recommendations.length === 0) {
    return null;
  }

  // Sort by priority
  const priorityOrder: Record<RecommendationPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const sortedRecs = [...recommendations].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return (
    <div className={className}>
      <div className="mb-6 flex items-center gap-2">
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {title}
          <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
            ({recommendations.length})
          </span>
        </h2>
      </div>
      <div className="space-y-4">
        {sortedRecs.map((rec, index) => (
          <RecommendationCard
            key={index}
            title={rec.title}
            description={rec.description}
            priority={rec.priority}
            actionItems={rec.actionItems}
          />
        ))}
      </div>
    </div>
  );
}
