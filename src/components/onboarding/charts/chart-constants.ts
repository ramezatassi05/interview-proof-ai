// Shared constants for onboarding chart components

export const TIERS = [
  {
    label: 'Building Foundation',
    max: 29,
    color: '#fecaca',
    gradientFrom: '#fecaca',
    gradientTo: '#fde68a',
    textColor: 'text-red-500',
    dotColor: '#ef4444',
  },
  {
    label: 'Gaining Traction',
    max: 49,
    color: '#fde68a',
    gradientFrom: '#fde68a',
    gradientTo: '#a7f3d0',
    textColor: 'text-amber-500',
    dotColor: '#f59e0b',
  },
  {
    label: 'Developing Strengths',
    max: 69,
    color: '#a7f3d0',
    gradientFrom: '#a7f3d0',
    gradientTo: '#c7d2fe',
    textColor: 'text-emerald-500',
    dotColor: '#10b981',
  },
  {
    label: 'Interview Ready',
    max: 75,
    color: '#c7d2fe',
    gradientFrom: '#c7d2fe',
    gradientTo: '#a5b4fc',
    textColor: 'text-indigo-500',
    dotColor: '#6366f1',
  },
] as const;

export function getTierIndex(score: number): number {
  if (score <= 29) return 0;
  if (score <= 49) return 1;
  if (score <= 69) return 2;
  return 3;
}

// Per-category accent colors for improvement bars
export const CATEGORY_COLORS: Record<string, { hex: string; bg: string; text: string }> = {
  roundReadiness: { hex: '#6366f1', bg: 'bg-indigo-500', text: 'text-indigo-600' },
  clarity: { hex: '#8b5cf6', bg: 'bg-violet-500', text: 'text-violet-600' },
  evidenceDepth: { hex: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-600' },
  hardMatch: { hex: '#06b6d4', bg: 'bg-cyan-500', text: 'text-cyan-600' },
  companyProxy: { hex: '#a855f7', bg: 'bg-purple-500', text: 'text-purple-600' },
};

// Tier boundary reference lines for the growth chart
export const TIER_BOUNDARIES = [
  { value: 30, label: 'Traction', color: '#f59e0b' },
  { value: 50, label: 'Strengths', color: '#10b981' },
  { value: 70, label: 'Ready', color: '#6366f1' },
] as const;
