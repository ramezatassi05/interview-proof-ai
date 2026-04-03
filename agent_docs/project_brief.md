# Project Brief (Persistent)

- **Product Vision:** Diagnostic, not advice. Deterministic, auditable interview readiness scoring.
- **Current State:** Post-MVP. Phase 8 + F-001 (Seamless Onboarding) complete.
- **Coding Conventions:** TypeScript strict mode, no `any`, Zod for validation
- **Quality Gates:** Typecheck + lint before commit
- **Key Commands:**
  - npm run dev
  - npm run lint
  - npm run typecheck
  - npm run build

## Completed Milestones
- **Phases 1-5:** Foundation, Core Backend, Frontend UI, Payments, Polish (MVP)
- **Phase 6:** UI Enhancement (light mode, redesigned components)
- **Phase 7a-e:** Career Intelligence Engine (archetype, forecast, practice intel, credits, language upgrade)
- **Phase 8a-e:** Interactive Practice, HireZone, Evidence, Coaching Hub, Landing Page, Bug Fixes
- **F-001:** Seamless Onboarding UI/UX (7-step flow, Aha moment, profile persistence, resume upload)

## Key Architectural Principles
- Scoring is deterministic code, never LLM-driven
- Onboarding scoring is client-side deterministic (separate from server scoring engine)
- LLM returns strict JSON; code is the scoring authority
- RLS enforces user-level data isolation
- localStorage for draft persistence (onboarding, theme)

**Update Cadence:** Update after each phase/feature completion
