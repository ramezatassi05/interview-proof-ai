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
├── components/    # Reusable UI components
├── lib/           # Client-side utilities, API helpers
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

## Testing Priorities
1. Scoring engine (determinism, weights, risk bands)
2. Credits ledger (balance, spending, blocking)
3. Gating logic (free vs paid content)
