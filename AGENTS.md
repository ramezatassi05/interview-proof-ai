# AGENTS.md - Master Plan for InterviewProof AI

## 🎯 Project Overview
**App:** InterviewProof AI  
**Goal:** Predict interview readiness and rejection risk for a specific job and interview type, and tell candidates exactly what to fix before the interview.  
**Stack:** Next.js 14 (TypeScript, App Router), Tailwind CSS, Node.js, Python FastAPI, OpenAI API  
**Current Phase:** Phase 1 - Foundation

## 🧠 How I Should Think
1. **Understand Intent First**: Before answering, identify what the user actually needs (a verdict, not generic advice).
2. **Ask If Unsure**: If critical information is missing (inputs, scope, phase), ask before proceeding.
3. **Plan Before Coding**: Propose a concrete plan, ask for approval, then implement.
4. **Verify After Changes**: Run tests, linters, or manual checks after each change.
5. **Explain Trade-offs**: When recommending an approach, briefly note alternatives and why they were not chosen.

## 🔁 Plan → Execute → Verify
1. **Plan:** Outline a brief, implementation-focused approach and ask for approval before coding.
2. **Plan Mode:** If supported, use a Plan/Reflect mode for this step.
3. **Execute:** Implement one feature or logical unit at a time.
4. **Verify:** Run tests/linters or manual checks after each feature; fix issues before moving on.

## 🧠 Context & Memory
- Treat `AGENTS.md` and `agent_docs/` as living documents.
- Use persistent tool configs (`CLAUDE.md`, `.cursorrules`, etc.) for project-wide rules.
- Update these files as the project scales (commands, conventions, constraints).

## 🤝 Optional Roles (If Supported)
- **Explorer:** Scan the codebase or docs in parallel to surface relevant context.
- **Builder:** Implement features based strictly on the approved plan.
- **Tester:** Run tests/linters and report failures or inconsistencies.

## ✅ Testing & Verification
- Follow `agent_docs/testing.md` for the testing strategy.
- If no automated tests exist, propose and run minimal manual checks.
- Do not proceed to the next step when verification fails.

## 🧩 Checkpoints & Pre-Commit Hooks
- Create checkpoints or commits after meaningful milestones.
- Ensure all pre-commit hooks pass before commits.

## 📁 Context Files
Refer to these for details (load only when needed):
- `agent_docs/tech_stack.md`: Tech stack & libraries
- `agent_docs/code_patterns.md`: Code style & patterns
- `agent_docs/project_brief.md`: Persistent project rules and conventions
- `agent_docs/product_requirements.md`: Full PRD
- `agent_docs/testing.md`: Verification strategy and commands

## 🔄 Current State (Update This!)
**Last Updated:** 2026-01-09  
**Working On:** Claude-first project scaffolding and foundation setup  
**Recently Completed:** PRD and Claude configuration  
**Blocked By:** None

## 🚀 Roadmap
### Phase 1: Foundation
- [ ] Initialize Next.js project
- [ ] Set up backend analysis service (FastAPI)
- [ ] Define core scoring schema
- [ ] Set up pre-commit hooks

### Phase 2: Core Features
- [ ] Interview Readiness Score (0–100%)
- [ ] Rejection Risk Breakdown
- [ ] Likely Interview Questions
- [ ] Personalized Study Plan
- [ ] Final Verdict output

## ⚠️ What NOT To Do
- Do NOT delete files without explicit confirmation
- Do NOT modify database schemas without a backup plan
- Do NOT add features not in the current phase
- Do NOT skip tests for “simple” changes
- Do NOT bypass failing tests or pre-commit hooks
