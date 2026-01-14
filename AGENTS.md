# AGENTS.md - Master Plan for InterviewProof

## 🎯 Project Overview
**App:** InterviewProof
**Goal:** Help job candidates understand exactly what will cause rejection in a specific interview so they can fix the highest-impact gaps quickly.
**Stack:** Next.js 16, Supabase (Postgres + pgvector + Auth + Storage), TypeScript, Stripe, OpenAI/Anthropic LLM, OpenAI Embeddings
**Current Phase:** Phase 3 - Frontend UI

## 🛠 Commands
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format all
npm run format:check # Prettier check
npm run typecheck    # TypeScript check
npm run test         # Run tests (TBD)
```

## 📁 Project Structure
```
src/
├── app/
│   ├── api/report/   # API routes (create, analyze, [id], unlock, rerun)
│   └── ...           # Pages (TBD)
├── components/       # React UI components (TBD)
├── lib/
│   ├── supabase/     # Supabase clients (client, server, middleware)
│   └── openai.ts     # OpenAI client + model constants
├── server/
│   ├── scoring/      # Deterministic scoring engine (v0.1)
│   ├── rag/          # Extraction, retrieval, LLM analysis
│   └── pipeline.ts   # Full analysis pipeline orchestrator
└── types/            # TypeScript interfaces

supabase/
├── migrations/       # SQL schema migrations (001, 002)
└── seed.sql          # Initial rubric + question data
```

## 🧠 How I Should Think
1. **Understand Intent First**: Before answering, identify what the user actually needs
2. **Ask If Unsure**: If critical information is missing, ask before proceeding
3. **Plan Before Coding**: Propose a plan, ask for approval, then implement
4. **Verify After Changes**: Run `npm run lint && npm run typecheck` after each change
5. **Explain Trade-offs**: When recommending something, mention alternatives

## 🔁 Plan → Execute → Verify
1. **Plan:** Outline a brief approach and ask for approval before coding
2. **Plan Mode:** Use plan/reflect mode if supported
3. **Execute:** Implement one feature at a time
4. **Verify:** Run lint + typecheck after each feature

## 🧠 Context & Memory
- `AGENTS.md` and `agent_docs/` are living documents
- Tool configs point here as the source of truth
- Update files as scope or architecture evolves

## 🤝 Optional Roles
- **Explorer:** Scan codebase or docs
- **Builder:** Implement approved features
- **Tester:** Run verification and report failures

## ✅ Testing & Verification
- Follow `agent_docs/testing.md`
- No progress allowed when verification fails
- Pre-commit hooks run: lint-staged + typecheck

## 🧩 Checkpoints & Pre-Commit Hooks
- Commit after milestones
- Hooks must pass before merge
- Husky pre-commit: `npx lint-staged && npm run typecheck`

## 📁 Context Files
- agent_docs/tech_stack.md
- agent_docs/code_patterns.md
- agent_docs/project_brief.md
- agent_docs/product_requirements.md
- agent_docs/testing.md
- docs/PRD-InterviewProof-MVP.md
- docs/TechDesign-InterviewProof-MVP.md

## 🔄 Current State
**Last Updated:** January 14, 2026
**Working On:** Phase 3 - Frontend UI
**Recently Completed:** Phase 2 - Core Backend (extraction, RAG, analysis, API routes)
**Blocked By:** None

## 🚀 Roadmap
### Phase 1: Foundation ✅
- [x] Initialize Next.js project with TypeScript, Tailwind
- [x] Set up project structure (app, components, lib, server, types)
- [x] Configure ESLint, Prettier, pre-commit hooks (Husky)
- [x] Set up Supabase clients (browser, server, service role)
- [x] Create database schema (001_initial_schema.sql)
- [x] Create seed data (rubric chunks, question archetypes)

### Phase 2: Core Backend ✅
- [x] Implement extraction pipeline (resume + JD parsing with LLM)
- [x] Implement RAG pipeline (embeddings + vector search)
- [x] Implement LLM analysis with strict JSON output
- [x] Connect scoring engine to LLM output
- [x] Build API routes:
  - `POST /api/report/create` - Create report
  - `POST /api/report/analyze` - Run analysis pipeline
  - `GET /api/report/[id]` - Get report (gated)
  - `POST /api/report/unlock` - Spend credit
  - `POST /api/report/rerun` - Re-analyze (paid only)

### Phase 3: Frontend UI (Next)
- [ ] Landing page
- [ ] Upload page (resume + JD + round selection)
- [ ] Results page (score + top 3 risks + paywall)
- [ ] Full diagnostic page (gated)

### Phase 4: Payments
- [ ] Stripe Checkout integration
- [ ] Webhook handler
- [ ] Credits ledger logic

### Phase 5: Polish
- [ ] PDF export
- [ ] Account page
- [ ] Mobile QA

## 🔧 Key Architecture Decisions
- **Scoring:** Deterministic weights in `src/server/scoring/engine.ts` (v0.1)
- **LLM:** Returns strict JSON only; scoring authority is code, not LLM
- **Database:** pgvector for semantic search on rubrics/questions
- **Auth:** Supabase Auth with magic link
- **RLS:** Users can only access their own data

## ⚠️ What NOT To Do
- Do NOT delete files without confirmation
- Do NOT modify schemas without a migration plan
- Do NOT add features outside MVP
- Do NOT skip tests
- Do NOT bypass failing hooks
- Do NOT let LLM be scoring authority (deterministic only)
