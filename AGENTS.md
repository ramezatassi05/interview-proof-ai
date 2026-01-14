# AGENTS.md - Master Plan for InterviewProof

## 🎯 Project Overview
**App:** InterviewProof  
**Goal:** Help job candidates understand exactly what will cause rejection in a specific interview so they can fix the highest-impact gaps quickly.  
**Stack:** Next.js, Supabase (Postgres + pgvector + Auth + Storage), Node.js (TypeScript), Stripe, OpenAI/Anthropic LLM, OpenAI Embeddings  
**Current Phase:** Phase 1 - Foundation

## 🧠 How I Should Think
1. **Understand Intent First**: Before answering, identify what the user actually needs
2. **Ask If Unsure**: If critical information is missing, ask before proceeding
3. **Plan Before Coding**: Propose a plan, ask for approval, then implement
4. **Verify After Changes**: Run tests/linters or manual checks after each change
5. **Explain Trade-offs**: When recommending something, mention alternatives

## 🔁 Plan → Execute → Verify
1. **Plan:** Outline a brief approach and ask for approval before coding
2. **Plan Mode:** Use plan/reflect mode if supported
3. **Execute:** Implement one feature at a time
4. **Verify:** Run tests or manual checks after each feature

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

## 🧩 Checkpoints & Pre-Commit Hooks
- Commit after milestones
- Hooks must pass before merge

## 📁 Context Files
- agent_docs/tech_stack.md
- agent_docs/code_patterns.md
- agent_docs/project_brief.md
- agent_docs/product_requirements.md
- agent_docs/testing.md

## 🔄 Current State
**Last Updated:** January 2026  
**Working On:** Initial project setup  
**Recently Completed:** PRD + Technical Design  
**Blocked By:** None

## 🚀 Roadmap
### Phase 1: Foundation
- [ ] Initialize Next.js project
- [ ] Set up Supabase (Auth, DB, Storage, pgvector)
- [ ] Configure pre-commit hooks

### Phase 2: Core Features
- [ ] Resume + JD ingestion
- [ ] Readiness score + top 3 risks
- [ ] Paid unlock via credits
- [ ] Rerun + delta tracking

## ⚠️ What NOT To Do
- Do NOT delete files without confirmation
- Do NOT modify schemas without a migration plan
- Do NOT add features outside MVP
- Do NOT skip tests
- Do NOT bypass failing hooks
