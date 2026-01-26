import { ReactNode } from 'react';
import type { RiskBand } from '@/types';

type BadgeVariant = 'default' | 'high' | 'medium' | 'low' | 'critical' | 'success' | 'accent';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  glow?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)]',
  high: 'bg-[var(--color-danger-muted)] text-[var(--color-danger)] border border-[var(--color-danger)]/30',
  medium:
    'bg-[var(--color-warning-muted)] text-[var(--color-warning)] border border-[var(--color-warning)]/30',
  low: 'bg-[var(--color-success-muted)] text-[var(--color-success)] border border-[var(--color-success)]/30',
  critical: 'bg-[var(--color-danger)] text-white',
  success:
    'bg-[var(--color-success-muted)] text-[var(--color-success)] border border-[var(--color-success)]/30',
  accent:
    'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30',
};

export function Badge({ children, variant = 'default', className = '', glow = false }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
        ${variantStyles[variant]}
        ${glow ? 'shadow-[0_0_10px_rgba(99,102,241,0.3)]' : ''}
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
