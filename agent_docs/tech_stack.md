# Tech Stack & Tools

## Core Stack
- **Frontend:** Next.js (App Router, TypeScript)
- **Backend:** Next.js Route Handlers (Node.js, TypeScript)
- **Database:** Supabase Postgres + pgvector
- **Auth:** Supabase Auth (magic link)
- **Storage:** Supabase Storage (private buckets)
- **Payments:** Stripe Checkout + Webhooks
- **LLM:** OpenAI or Anthropic (single reasoning model)
- **Embeddings:** OpenAI Embeddings API
- **PDF:** React-PDF (server-side)

## Architecture Rules
- Routes handle HTTP only
- Business logic lives in `server/`
- Deterministic scoring in code, never in prompts
- LLM returns strict JSON only

## Client-Side Patterns
- **localStorage persistence:** Used for onboarding draft state (survives refresh before completion) and theme preference
- **Deterministic client-side scoring:** `src/lib/onboarding-scoring.ts` computes Aha scores entirely client-side with clamped 20-75 range — no LLM, no server round-trip for the score itself
- **Reducer-based multi-step flows:** Onboarding uses `useReducer` for state management across 7 steps

## Storage
- **Supabase Storage:** Private `resumes` bucket for PDF uploads (5MB limit, RLS-enforced per-user access)
- **Supabase Postgres:** `user_profiles` table for onboarding state persistence

## Naming Conventions
- camelCase for variables/functions
- PascalCase for components
- snake_case for DB columns
