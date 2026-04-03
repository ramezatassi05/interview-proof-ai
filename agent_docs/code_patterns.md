# Code Patterns & Conventions

## Naming Conventions
- **Variables/Functions:** camelCase (`getUserCredits`, `reportId`)
- **Components:** PascalCase (`ScoreCard`, `RiskList`)
- **Database columns:** snake_case (`user_id`, `created_at`)
- **Types/Interfaces:** PascalCase (`Report`, `ExtractedResume`)
- **Enums:** PascalCase type, lowercase values (`RoundType = 'technical'`)

## File Organization
```
src/
├── app/           # Page routes only, minimal logic
│   └── onboarding/  # Multi-step onboarding flow (reducer + localStorage)
├── components/    # Reusable UI components
│   └── onboarding/  # Step components, progress indicators, parallax
├── lib/           # Client-side utilities, API helpers
│   ├── onboarding-scoring.ts  # Deterministic Aha score (client-side)
│   ├── focus-area-pool.ts     # Focus area selection pool
│   ├── resume-signals.ts      # Resume keyword detection
│   ├── role-suggestions.ts    # 100+ role titles
│   └── location-data.ts       # 30+ countries, 200+ cities
├── server/        # Server-only business logic
└── types/         # Shared TypeScript interfaces
```

## API Route Patterns
- Use Next.js Route Handlers (`app/api/*/route.ts`)
- Return JSON with consistent shape: `{ data?, error? }`
- Validate inputs with Zod schemas
- Handle errors explicitly, no silent failures

## Supabase Patterns
- Browser: `import { createClient } from '@/lib/supabase/client'`
- Server: `import { createClient } from '@/lib/supabase/server'`
- Service role (admin): `import { createServiceClient } from '@/lib/supabase/server'`

## Scoring Engine Rules
- All scoring logic lives in `src/server/scoring/engine.ts`
- Weights are versioned (`SCORING_VERSION = 'v0.1'`)
- LLM provides analysis, code computes final score
- Store `score_breakdown_json` for reproducibility

## LLM Integration Rules
- Always use strict JSON schema output
- Temperature: 0-0.2 for consistency
- Retry up to 2 times on JSON parse failure
- Fail visibly on error, never silently

## Error Handling
- API routes: Return `{ error: string }` with appropriate status
- Server functions: Throw typed errors
- Client: Display user-friendly messages

## Onboarding Patterns

### Multi-Step Flow (Reducer Pattern)
- `onboarding/page.tsx` uses `useReducer` with typed actions for state management
- Steps are independent components receiving state + dispatch props
- `OnboardingProgress` and `OnboardingDotNav` provide navigation UI
- Step transitions are animated; some steps auto-advance on selection (e.g., career stage)

### localStorage Draft Persistence
- Onboarding state is persisted to `localStorage` on every state change
- On mount, state is hydrated from localStorage if a draft exists
- Draft is cleared on successful profile save to the database

### Onboarding Scoring (Client-Side Deterministic)
- `src/lib/onboarding-scoring.ts` computes readiness estimates
- Output range: clamped to 20-75 (intentionally conservative — never overpromises)
- Inputs: career_stage, prep_urgency, interview_experience, resume signals, domain
- Focus areas selected from `src/lib/focus-area-pool.ts` based on profile signals
- Entirely deterministic — no LLM involvement

### Data Files Pattern
- `role-suggestions.ts`, `location-data.ts`: Static data exported as typed arrays/objects
- Used for autocomplete/search in onboarding step components
- Kept in `src/lib/` since they are shared utilities, not server-only

## Testing Priorities
1. Scoring engine (determinism, weights, risk bands)
2. Credits ledger (balance, spending, blocking)
3. Gating logic (free vs paid content)
4. Onboarding flow (7-step completion, draft persistence, Aha score bounds)
