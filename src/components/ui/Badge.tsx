import { ReactNode } from 'react';
import type { RiskBand } from '@/types';

type BadgeVariant = 'default' | 'high' | 'medium' | 'low' | 'critical';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  critical: 'bg-red-600 text-white dark:bg-red-700',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Helper to convert RiskBand to Badge variant
export function riskBandToVariant(riskBand: RiskBand): BadgeVariant {
  const map: Record<RiskBand, BadgeVariant> = {
    High: 'high',
    Medium: 'medium',
    Low: 'low',
  };
  return map[riskBand];
}

// Helper to convert severity to Badge variant
export function severityToVariant(severity: 'critical' | 'high' | 'medium' | 'low'): BadgeVariant {
  return severity;
}
