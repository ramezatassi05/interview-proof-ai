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

## Naming Conventions
- camelCase for variables/functions
- PascalCase for components
- snake_case for DB columns
