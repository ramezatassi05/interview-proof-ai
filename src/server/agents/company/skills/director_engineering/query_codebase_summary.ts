import type { SkillDefinition } from '../types';

const CODEBASE_NOTES = `Stack: Next.js 15 App Router, TypeScript strict, Tailwind, Supabase (Postgres + Auth + Storage), Anthropic Claude (Sonnet 4.6 across the board).

Frontend lives in src/app and src/components. The diagnostic flow (the core product) is at src/app/r/[id]/full/page.tsx with tabs for analysis / practice / strategy / insights / coach. Components for the diagnostic are in src/components/diagnostic.

Server logic lives in src/server. Scoring modules are deterministic and live in src/server/scoring. AI agent logic for the user-facing coach is in src/server/agents (orchestrator + specialists). The CEO command center's agents are in src/server/agents/company.

API routes live in src/app/api. Cron jobs are wired in vercel.json and live under src/app/api/cron.

Supabase migrations are in supabase/migrations, numbered sequentially. RLS uses the auth.uid() = user_id template.

Big invariants worth knowing: deterministic scoring is the source of truth — agents never patch a score. The LLMAnalysis shape (src/types/index.ts) is frozen. Service-role Supabase client is restricted to a small allowlist.`;

export const queryCodebaseSummarySkill: SkillDefinition = {
  id: 'query_codebase_summary',
  agentKinds: ['director_engineering'],
  kind: 'read',
  ui: {
    label: 'Refresh on the codebase',
    description: 'Quick map of how the codebase is laid out.',
    icon: 'folder',
  },
  tool: {
    name: 'query_codebase_summary',
    description:
      "Pull a quick map of the codebase — stack, where the big pieces live, the invariants worth knowing. Call this before drafting a spec so what you propose fits where the code already is.",
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {},
    },
  },
  async handler() {
    return {
      status: 'succeeded',
      output: { notes: CODEBASE_NOTES },
    };
  },
};
