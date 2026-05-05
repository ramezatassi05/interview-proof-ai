import type { CompanyAgentKind } from './types';

interface CronSchedule {
  hourUtc: number;
  minute: number;
  dayOfWeek: number | null;
}

const SCHEDULES: Record<Exclude<CompanyAgentKind, 'ceo_orchestrator'>, CronSchedule> = {
  executive_assistant: { hourUtc: 8, minute: 0, dayOfWeek: null },
  director_marketing: { hourUtc: 9, minute: 0, dayOfWeek: 1 },
  director_engineering: { hourUtc: 9, minute: 0, dayOfWeek: 2 },
  director_finance: { hourUtc: 17, minute: 0, dayOfWeek: 5 },
};

export interface AgentHeartbeat {
  agentKind: CompanyAgentKind;
  scheduleHuman: string;
  nextFireIso: string | null;
}

function nextFireFor(s: CronSchedule, from: Date): Date {
  const next = new Date(from);
  next.setUTCSeconds(0, 0);

  if (s.dayOfWeek === null) {
    next.setUTCHours(s.hourUtc, s.minute, 0, 0);
    if (next.getTime() <= from.getTime()) next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }

  next.setUTCHours(s.hourUtc, s.minute, 0, 0);
  let daysAhead = (s.dayOfWeek - next.getUTCDay() + 7) % 7;
  if (daysAhead === 0 && next.getTime() <= from.getTime()) daysAhead = 7;
  next.setUTCDate(next.getUTCDate() + daysAhead);
  return next;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function describe(s: CronSchedule): string {
  const time = `${String(s.hourUtc).padStart(2, '0')}:${String(s.minute).padStart(2, '0')} UTC`;
  return s.dayOfWeek === null ? `Daily ${time}` : `${DAY_NAMES[s.dayOfWeek]} ${time}`;
}

export function getHeartbeats(now: Date = new Date()): AgentHeartbeat[] {
  const entries = Object.entries(SCHEDULES) as [keyof typeof SCHEDULES, CronSchedule][];
  return [
    { agentKind: 'ceo_orchestrator' as const, scheduleHuman: 'On demand', nextFireIso: null },
    ...entries.map(([kind, s]) => ({
      agentKind: kind as CompanyAgentKind,
      scheduleHuman: describe(s),
      nextFireIso: nextFireFor(s, now).toISOString(),
    })),
  ];
}

export function getNextFireOverall(now: Date = new Date()): string | null {
  const fires = getHeartbeats(now)
    .map((h) => h.nextFireIso)
    .filter((iso): iso is string => Boolean(iso))
    .sort();
  return fires[0] ?? null;
}
