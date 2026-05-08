import type { ComponentType } from 'react';
import { MetricsCard } from './MetricsCard';
import { ListCard } from './ListCard';
import { TicketsCard } from './TicketsCard';

export interface ArtifactProps {
  data: Record<string, unknown>;
}

// skillId → renderer. Skills not in this map fall back to JSON in ToolCallCard.
// Keep entries grouped by component so a new skill returning the same shape can
// opt in by adding one line here.
export const ARTIFACT_REGISTRY: Record<string, ComponentType<ArtifactProps>> = {
  // metrics-shaped outputs
  summarize_metrics: MetricsCard,
  fetch_funnel_metrics: MetricsCard,
  fetch_revenue_snapshot: MetricsCard,
  fetch_runway: MetricsCard,
  fetch_burn_breakdown: MetricsCard,
  fetch_uptime: MetricsCard,
  // list-shaped outputs
  fetch_open_incidents: ListCard,
  fetch_deploy_history: ListCard,
  summarize_threads: ListCard,
  search_emails: ListCard,
};

export function getArtifactRenderer(skillId: string): ComponentType<ArtifactProps> | null {
  return ARTIFACT_REGISTRY[skillId] ?? null;
}

export { MetricsCard, ListCard, TicketsCard };
