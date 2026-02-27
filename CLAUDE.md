# CLAUDE.md - Claude Code Configuration for InterviewProof

## Project Overview

**App:** InterviewProof — job-specific interview diagnostic that identifies rejection risks and prioritizes fixes.
**Stack:** Next.js 16 (App Router), Supabase (Postgres + pgvector + Auth), Stripe, OpenAI, TypeScript, Tailwind CSS 4
**Stage:** Post-MVP (Phase 8 complete, ongoing enhancements)
**Repo:** `interview-proof-ai`

## Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format all files
npm run format:check # Prettier check
npm run typecheck    # TypeScript strict check (tsc --noEmit)
npm run test         # Tests (not yet configured)
```

### Utility Scripts

```bash
npm run populate-embeddings   # Generate OpenAI embeddings for RAG tables
npm run ingest-knowledge      # Ingest knowledge base data
```

## Directives

1. Read `AGENTS.md` first for the full project roadmap and architecture decisions
2. Reference `agent_docs/` for detailed implementation guides
3. **Plan before coding** — propose an approach, get approval, then implement
4. Build incrementally — one feature at a time
5. Run `npm run lint && npm run typecheck` after every change before committing
6. Do not act as a linter — focus on logic and architecture
7. Be concise and explicit

## Project Structure

```
src/
├── app/                              # Next.js App Router pages & API routes
│   ├── page.tsx                      # Landing page (hero, stats, FAQ)
│   ├── layout.tsx                    # Root layout (AuthProvider, ThemeProvider, fonts)
│   ├── auth/login/                   # Login (magic link, Google, GitHub OAuth)
│   ├── auth/callback/                # Supabase auth callback
│   ├── new/                          # Upload page (resume + JD + round selection)
│   ├── dashboard/                    # User dashboard
│   ├── r/[id]/                       # Results page (score + top 3 risks + paywall)
│   ├── r/[id]/full/                  # Full diagnostic page (9-tab gated view)
│   ├── s/[token]/                    # Shared report public view
│   ├── account/                      # Account settings + report history
│   ├── wallet/                       # Credits wallet (balance, earn, history)
│   ├── risk-simulation/              # Risk simulation page
│   ├── study-intelligence/           # Study intelligence page
│   └── api/                          # All API routes (see below)
├── components/
│   ├── ui/                           # Primitives: Button, Card, Input, Badge, Spinner, Tabs, etc.
│   ├── layout/                       # Header, Footer, Container, AppLayout, Sidebar
│   ├── upload/                       # RoundSelector, AnalysisProgress, PrepPreferencesForm
│   ├── results/                      # ScoreCard, RiskList, PaywallCTA, ExecutiveSummary
│   ├── diagnostic/                   # Full diagnostic components (18+ components)
│   ├── landing/                      # Landing sections (FAQ, BenefitsRisks, Stats, etc.)
│   ├── credits/                      # CreditsBundleCard, CreditsPurchaseModal, CreditsWrapper
│   ├── share/                        # ShareModal, SharePreviewCard
│   └── svg/                          # Animated SVG illustrations (Owl mascot, waves)
├── hooks/
│   ├── useAuth.tsx                   # AuthProvider context + useAuth hook
│   └── useTheme.tsx                  # ThemeProvider (dark/light with localStorage)
├── lib/
│   ├── supabase/client.ts            # Browser Supabase client
│   ├── supabase/server.ts            # Server client + service role client
│   ├── supabase/middleware.ts        # Session refresh middleware
│   ├── api.ts                        # Frontend API client (typed fetch wrappers)
│   ├── stripe.ts                     # Stripe client, credit bundles, pricing config
│   ├── credits.ts                    # Idempotent credit grants + referral code logic
│   ├── openai.ts                     # OpenAI client + model constants
│   ├── format.ts                     # Duration formatting helpers
│   ├── highlight.ts                  # Text highlighting for AI feedback
│   └── insights.ts                   # Aggregate stats + fallback data
├── server/
│   ├── pipeline.ts                   # Full analysis pipeline orchestrator
│   ├── questions.ts                  # LLM question generation, feedback, best answers
│   ├── pdf/template.tsx              # React-PDF template for report export
│   ├── rag/
│   │   ├── extraction.ts             # Resume + JD parsing via LLM
│   │   ├── retrieval.ts              # Vector search on rubrics + questions
│   │   ├── analysis.ts               # LLM analysis with strict JSON schema
│   │   ├── validation.ts             # Analysis quality validation
│   │   └── resource-bank.ts          # Resource bank for recommendations
│   └── scoring/
│       ├── engine.ts                 # Main scoring engine (deterministic weights v0.2)
│       ├── archetype.ts              # Interview archetype classification
│       ├── forecast.ts               # Round pass probability forecasting
│       ├── cognitive.ts              # Cognitive risk map (spider chart dimensions)
│       ├── trajectory.ts             # Career trajectory projection
│       ├── practice.ts               # Practice intelligence (sync, Rx, pressure, momentum)
│       ├── evidence.ts               # Evidence-backed claims with data citations
│       ├── hirezone.ts               # Hire zone scoring + category gaps
│       ├── competency-heatmap.ts     # Competency heatmap by domain
│       ├── company-difficulty.ts     # Company tier + difficulty adjustment
│       ├── prior-employment.ts       # Prior employment detection + boosts
│       └── studyplan.ts              # Personalized study plan generator
└── types/index.ts                    # All TypeScript interfaces (single file)

supabase/
├── migrations/                       # SQL schema migrations (001-009)
└── seed.sql                          # Initial rubric + question data

scripts/
├── populate-embeddings.ts            # Generate OpenAI embeddings
├── ingest-knowledge.ts               # Knowledge base ingestion
└── transform-scraped-data.ts         # Data transformation utility

agent_docs/                           # AI agent reference documents
├── code_patterns.md
├── tech_stack.md
├── product_requirements.md
├── project_brief.md
└── testing.md
```

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/report/create` | POST | Create a new report (resume + JD + round) |
| `/api/report/analyze` | POST | Run the full analysis pipeline |
| `/api/report/[id]` | GET | Get report data (gated by paywall) |
| `/api/report/[id]/pdf` | GET | Download PDF export |
| `/api/report/[id]/share` | POST | Generate/toggle share link |
| `/api/report/[id]/questions/generate` | POST | Generate practice questions |
| `/api/report/[id]/questions/feedback` | POST | Score an answer + give AI feedback |
| `/api/report/[id]/questions/best-answer` | POST | Generate best answer script |
| `/api/report/unlock` | POST | Spend credits to unlock a report |
| `/api/report/rerun` | POST | Re-analyze a paid report |
| `/api/report/shared/[token]` | GET | Public shared report access |
| `/api/checkout` | POST | Stripe checkout session (legacy) |
| `/api/checkout/credits` | POST | Credit bundle purchase checkout |
| `/api/credits/history` | GET | Credits transaction history |
| `/api/referral` | GET/POST | Referral code + stats |
| `/api/insights` | GET | Aggregate cross-user interview stats (5-min cache) |
| `/api/account` | GET | Account info |
| `/api/parse-pdf` | POST | Extract text from PDF upload |
| `/api/webhook/stripe` | POST | Stripe webhook handler |
| `/auth/callback` | GET | Supabase auth callback |

## Architecture & Key Patterns

### Scoring: Deterministic, Not LLM

The LLM is the **analyst** (extracts, retrieves, produces structured analysis). The **code** is the scoring authority.

- Scoring engine: `src/server/scoring/engine.ts` (version `v0.2`)
- Weighted formula: hardMatch (35%), evidenceDepth (25%), roundReadiness (20%), clarity (10%), companyProxy (10%)
- Company difficulty adjustment: 1.0-1.5x multiplier based on company tier (FAANG+, Big Tech, etc.)
- All score breakdowns stored as JSONB for reproducibility

### Analysis Pipeline (`src/server/pipeline.ts`)

1. **Extract** resume + JD via LLM (`rag/extraction.ts`)
2. **Retrieve** relevant rubric chunks via pgvector cosine similarity (`rag/retrieval.ts`)
3. **Analyze** with LLM — strict JSON output only (`rag/analysis.ts`)
4. **Validate** analysis quality (`rag/validation.ts`)
5. **Score** deterministically via code (`scoring/engine.ts`)
6. **Compute** diagnostic intelligence (archetype, forecast, cognitive map, hire zone, etc.)
7. **Generate** personalized study plan if preferences provided

### Supabase Client Conventions

```typescript
// Browser (client components):
import { createClient } from '@/lib/supabase/client';

// Server (server components, API routes):
import { createClient } from '@/lib/supabase/server';

// Service role (admin operations, bypasses RLS):
import { createServiceClient } from '@/lib/supabase/server';
```

### Auth

- Supabase Auth: magic link + Google/GitHub OAuth
- Middleware (`middleware.ts`) refreshes session on every request
- `AuthProvider` context in `src/hooks/useAuth.tsx`
- RLS enforces user-level data isolation on all tables

### Payments & Credits

- Stripe Checkout for credit bundle purchases (Starter $9/5cr, Popular $13/20cr, Pro $23/50cr)
- 5 credits required to unlock a report
- Idempotent credit grants via `stripe_event_id` convention (`grant:{reason}:{uniqueKey}`)
- Bonus credits: upload (1), first unlock (2), referral (3 each)
- Webhook flow: `checkout.session.completed` -> verify signature -> add credits -> unlock report

### Theming

- CSS variables with `data-theme` attribute on `<html>` (`dark`/`light`)
- Inline `<script>` in layout prevents flash of wrong theme
- `useSyncExternalStore` in ThemeProvider to avoid hydration mismatches
- Persists to `localStorage`, respects system preference on first visit

### Full Diagnostic Page (9 tabs on `/r/[id]/full`)

Signal Strength | Hire Zone | Red Flags | Questions | Execution Roadmap | Coaching | Cognitive Map | Recruiter View | Practice Intel

## Database Schema

**Tables:** `credits_ledger`, `reports`, `runs`, `rubric_chunks`, `question_archetypes`
**Extensions:** pgvector (1536-dim OpenAI embeddings, IVFFlat index)
**RLS:** Enabled on all tables — users can only access their own data
**Migrations:** `supabase/migrations/001-009`

Key Postgres functions:
- `get_user_credit_balance(user_id)` — sum of credits ledger
- `can_spend_credit(user_id, amount)` — balance check
- `get_aggregate_insights()` — cross-user stats (005)
- Vector similarity search functions (002, 007)

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Supabase anon key (public)
SUPABASE_SERVICE_ROLE_KEY       # Supabase service role (server-only, bypasses RLS)
OPENAI_API_KEY                  # OpenAI API key
STRIPE_SECRET_KEY               # Stripe secret key
STRIPE_WEBHOOK_SECRET           # Stripe webhook signing secret
NEXT_PUBLIC_APP_URL             # App base URL (for Stripe redirects, sharing)
```

## Code Conventions

- **TypeScript:** Strict mode, no `any`, Zod for runtime validation
- **Variables/functions:** camelCase (`getUserCredits`, `reportId`)
- **Components:** PascalCase (`ScoreCard`, `RiskList`)
- **Database columns:** snake_case (`user_id`, `created_at`)
- **Types/interfaces:** PascalCase, all centralized in `src/types/index.ts`
- **API responses:** Consistent shape `{ data?, error? }` with appropriate HTTP status
- **Imports:** Use `@/*` path alias (maps to `./src/*`)
- **Formatting:** Prettier — single quotes, semi, 2-space indent, trailing comma `es5`, 100 char width
- **Linting:** ESLint flat config with `next/core-web-vitals` + `next/typescript`
- **Fonts:** Source Serif 4 (serif), Source Sans 3 (sans), Source Code Pro (mono)

## Pre-Commit Hooks (Husky)

```bash
npx lint-staged    # ESLint --fix + Prettier on staged .ts/.tsx/.json/.css/.md files
npm run typecheck  # tsc --noEmit
```

Both must pass. Do not bypass with `--no-verify`.

## Verification Before Commits

1. `npm run lint` passes
2. `npm run typecheck` passes
3. `npm run build` succeeds (for significant changes)
4. Manual smoke test if touching the core pipeline or scoring engine

## What NOT To Do

- Do NOT let the LLM be the scoring authority — scoring is deterministic code only
- Do NOT modify database schemas without adding a migration file
- Do NOT delete files without confirmation
- Do NOT bypass failing pre-commit hooks
- Do NOT commit `.env` files or secrets
- Do NOT skip verification steps
- Do NOT add features outside the current phase scope

## Reference Documents

- `AGENTS.md` — Master project roadmap, architecture decisions, phase history
- `agent_docs/code_patterns.md` — Naming, API patterns, scoring engine rules, LLM integration
- `agent_docs/tech_stack.md` — Stack overview, architecture rules
- `agent_docs/product_requirements.md` — MVP features, success metrics, UX guidelines
- `agent_docs/project_brief.md` — Vision, coding conventions, quality gates
- `agent_docs/testing.md` — Testing strategy, manual checks, pre-commit hooks
