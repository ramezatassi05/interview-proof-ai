# CEO Workflow For Implementing InterviewProof’s Agentic Platform With Claude Code

## Summary

Use Claude Code as a structured engineering team, not as one giant coder.

Your role as CEO is to own the product direction, quality bar, and approval gates. Claude Code should work in small, reviewable missions with clear roles: Architect, Explorer, Builder, Security Reviewer, Product Reviewer, and QA.

Source documents to give Claude Code:

```text
agent_docs/agentic-tool-improvements.md
agent_docs/codebase-changes-for-agentic-application.md
agent_docs/ai-agent-implementation-strategy.md
```

Note: in the current repo, only `agentic-tool-improvements.md` exists. The other two should be created from the plans before execution starts.

## Operating Model

### CEO Role

You approve:

- Product scope
- Agent list and responsibilities
- User autonomy boundary
- Milestone sequencing
- Final UX quality
- Whether a milestone is ready to merge

You should not ask Claude Code to “build the whole thing.” Instead, ask it to complete one milestone at a time.

The CEO-level rule:

```text
No milestone starts until the previous milestone has a written spec, implemented code, passing checks, and a review summary.
```

### Claude Code Roles

Use separate Claude Code sessions or explicit role prompts.

1. **Product Architect**
   - Turns the three strategy docs into a technical implementation spec.
   - Defines milestones, data models, APIs, and UX surfaces.
   - Does not write production code.

2. **Codebase Explorer**
   - Reads the current codebase.
   - Finds existing patterns for Supabase, API routes, diagnostic tabs, practice questions, scoring, and auth.
   - Produces a file map and implementation constraints.
   - Does not write production code.

3. **Backend Builder**
   - Owns migrations, RLS, server types, API routes, agent orchestration, and persistence.
   - Implements one backend milestone at a time.

4. **Frontend Builder**
   - Owns Coach tab, practice persistence UI, approval modals, opportunity tracker, and agent-facing UX.
   - Implements after backend contracts are stable.

5. **Security Reviewer**
   - Reviews RLS, auth checks, user ownership, agent action approval, and external-action boundaries.
   - Must verify no agent can send, submit, schedule, or impersonate without approval.

6. **Product QA Reviewer**
   - Reviews whether the feature feels world class.
   - Checks clarity, user value, UX friction, trust, and whether the agent helps the user do real interview work.

7. **Regression Tester**
   - Runs `npm run lint`, `npm run typecheck`, and targeted manual scenarios.
   - Confirms existing report, onboarding, practice, and diagnostic flows still work.

## Master Prompt For Claude Code

Use this as the first prompt:

```text
You are helping build InterviewProof’s agentic interview-readiness platform.

Read these docs first:
- agent_docs/agentic-tool-improvements.md
- agent_docs/codebase-changes-for-agentic-application.md
- agent_docs/ai-agent-implementation-strategy.md
- AGENTS.md
- agent_docs/code_patterns.md
- agent_docs/testing.md

CEO product direction:
InterviewProof is moving from a static diagnostic report product into a persistent interview-readiness operating system. The product should diagnose why a user may fail an interview, then actively help them fix those risks through coaching, practice, company research, resume evidence improvement, recruiter communication drafts, opportunity tracking, and prep planning.

Hard product boundary:
Agents may research, draft, fill, plan, score, recommend, and organize. Agents must not submit applications, send emails, schedule meetings, message recruiters, join live interviews, or impersonate the user without explicit approval.

Architecture principles:
- Do not replace deterministic scoring.
- Existing readiness score, risk band, HireZone, and scoring logic remain source of truth.
- Reuse existing report, question generation, answer feedback, and scoring systems.
- Add persistent memory and action tracking before advanced automation.
- All user-owned data must have RLS.
- All new API inputs must use Zod validation.
- Run lint and typecheck before reporting completion.

Do not implement the full platform at once.
First produce a milestone-by-milestone implementation plan with exact files, data contracts, acceptance criteria, and verification commands.
```

## Recommended Milestones

### Milestone 0: Source-Of-Truth Docs

Goal:
Create or finalize the three planning docs so every coding agent works from the same strategy.

Deliverables:

- `agentic-tool-improvements.md`
- `codebase-changes-for-agentic-application.md`
- `ai-agent-implementation-strategy.md`

Acceptance criteria:

- The docs agree on agent names, product boundary, milestone order, and data model direction.
- No code changes yet.

### Milestone 1: Codebase Discovery

Prompt Claude Code:

```text
Act as Codebase Explorer.

Do not edit files.

Read the current codebase and produce a discovery report for implementing the agentic platform.

Focus on:
- Supabase migration and RLS patterns
- API route patterns
- report and run data flow
- diagnostic full page tabs
- practice question and feedback flow
- localStorage usage in practice
- scoring authority boundaries
- profile and onboarding data

Output:
- relevant files
- current behavior
- implementation constraints
- risks
- recommended first coding milestone
```

CEO approval gate:
You approve whether the discovery matches your understanding of the product.

### Milestone 2: Agent Persistence Foundation

Prompt Claude Code:

```text
Act as Backend Builder.

Implement only the persistence foundation.

Scope:
- Add Supabase migrations for agent_sessions, agent_messages, agent_actions, practice_sessions, practice_answers, user_memory, prep_plans, prep_plan_tasks, opportunities, and company_research_cache.
- Add RLS policies following existing user-owned data patterns.
- Add TypeScript types in src/types.
- Do not build UI.
- Do not implement agent LLM logic.
- Do not modify deterministic scoring.

Acceptance criteria:
- Users can only access their own agent, practice, memory, prep plan, and opportunity data.
- Types compile.
- Existing report flow is unchanged.

Run:
- npm run lint
- npm run typecheck
```

CEO approval gate:
Do not continue unless the schema feels strategically complete and secure.

### Milestone 3: Agent Action System

Prompt Claude Code:

```text
Act as Backend Builder.

Implement the agent action system.

Scope:
- Add API routes for creating, listing, approving, rejecting, completing, and failing agent actions.
- Use statuses: drafted, awaiting_approval, approved, rejected, completed, failed.
- Use Zod validation.
- Require authentication.
- Enforce user ownership.
- No external sends or submissions.
- Add minimal tests or route-level validation where practical.

Acceptance criteria:
- An agent can create a draft action.
- User can approve or reject it.
- Approved action can be marked completed.
- Another user cannot access it.
- No irreversible action happens automatically.

Run:
- npm run lint
- npm run typecheck
```

CEO approval gate:
Review whether this approval model matches the company’s trust posture.

### Milestone 4: Practice Persistence

Prompt Claude Code:

```text
Act as Backend Builder first, then Frontend Builder only where necessary.

Move practice history from localStorage-first to server-backed persistence.

Scope:
- Persist practice sessions and answers in Supabase.
- Save question, answer, feedback, score, mappedRiskId, attemptNumber, and timestamps.
- Preserve existing practice UI behavior.
- Keep localStorage only as draft/offline fallback.
- Reuse existing question feedback and best answer APIs.
- Do not redesign the full Practice tab yet.

Acceptance criteria:
- User feedback persists across browser sessions.
- Practice score history is available to future agents.
- Existing question generation and answer feedback still work.
- No user can access another user’s practice data.

Run:
- npm run lint
- npm run typecheck
```

CEO approval gate:
Confirm this creates useful memory, not just storage.

### Milestone 5: Coach Tab MVP

Prompt Claude Code:

```text
Act as Frontend Builder.

Add a Coach tab to the full diagnostic page.

Scope:
- Add Coach to the existing diagnostic tabs.
- Build a report-aware coach UI.
- Show today’s recommended action.
- Show current weakest areas.
- Show active prep plan summary.
- Show recent practice trend.
- Show pending agent actions requiring approval.
- Do not add external integrations.
- Do not replace existing tabs.

Acceptance criteria:
- The Coach tab feels like the main command center for interview prep.
- The UI is responsive and consistent with current design patterns.
- User can understand what to do next within 10 seconds.
- Existing Analysis, Practice, Strategy, and Insights tabs still work.

Run:
- npm run lint
- npm run typecheck
```

CEO approval gate:
This is the first major product-feel review. Ask: “Does this feel like InterviewProof became proactive?”

### Milestone 6: Prep Orchestrator

Prompt Claude Code:

```text
Act as Backend Builder.

Implement the Prep Orchestrator Agent.

Scope:
- Add src/server/agents/prep-orchestrator.ts.
- Load report, latest run, profile, practice history, prep plan, user memory, and opportunities.
- Return structured recommendations.
- Create agent_actions when recommending user-reviewable work.
- Keep deterministic scoring as source of truth.
- Cite evidence from report, resume, JD, or practice history.

Acceptance criteria:
- Orchestrator can answer: “What should I do next?”
- Recommendations change based on practice history.
- Recommendations explain why they matter.
- Agent actions are inspectable and approval-based.

Run:
- npm run lint
- npm run typecheck
```

CEO approval gate:
Confirm recommendations are specific enough to feel premium.

### Milestone 7: Specialist Agents

Build one specialist at a time.

Recommended order:

1. Readiness Coach Agent
2. Mock Interview Agent
3. Answer Feedback Agent
4. Prep Plan Agent
5. Resume Evidence Agent
6. Company Research Agent
7. Recruiter Communication Agent
8. Opportunity Tracker Agent
9. Post-Interview Debrief Agent
10. Application Materials Agent

Prompt template:

```text
Act as Backend Builder.

Implement only the [AGENT NAME].

Purpose:
[one-sentence purpose]

Scope:
- Add the agent module under src/server/agents/.
- Define typed input/output.
- Reuse existing report, scoring, practice, and profile data.
- Persist outputs where appropriate.
- Create agent_actions for user-reviewable outputs.
- Do not implement other agents.
- Do not add external sending/submission.

Acceptance criteria:
- The agent solves its narrow job well.
- Outputs are structured and evidence-backed.
- User approval is required for external-facing drafts.
- Existing flows remain unchanged.

Run:
- npm run lint
- npm run typecheck
```

## Agent List And Business Purpose

### Prep Orchestrator Agent
Coordinates the whole system and decides what the user should do next.

User benefit:
The user stops guessing and gets a clear next action.

### Readiness Coach Agent
Explains risks, progress, and prep priorities.

User benefit:
The diagnostic becomes an active coach instead of a static report.

### Mock Interview Agent
Runs realistic interview simulations with follow-ups.

User benefit:
The user gets pressure-tested practice, not generic questions.

### Answer Feedback Agent
Scores answers, critiques them, and tracks repeated mistakes.

User benefit:
The user knows exactly why an answer works or fails.

### Prep Plan Agent
Creates and updates day-by-day prep plans.

User benefit:
The user gets a living plan that adapts as they improve.

### Resume Evidence Agent
Finds weak proof and improves resume/story evidence.

User benefit:
The user can better prove they are qualified.

### JD Matching Agent
Maps resume evidence to job requirements.

User benefit:
The user understands where they match and where they are exposed.

### Company Research Agent
Creates company-specific interview briefs.

User benefit:
The user sounds prepared, specific, and informed.

### Recruiter Communication Agent
Drafts recruiter replies, follow-ups, thank-yous, and negotiation messages.

User benefit:
The user communicates professionally with less stress.

### Opportunity Tracker Agent
Tracks companies, stages, dates, recruiters, and next actions.

User benefit:
InterviewProof becomes the user’s job-search command center.

### Post-Interview Debrief Agent
Captures what happened after interviews and updates prep.

User benefit:
Every interview makes the next one sharper.

### Application Materials Agent
Creates resume variants, cover letters, brag sheets, and portfolio narratives.

User benefit:
The user can produce stronger role-specific materials quickly.

## Review Workflow

For every milestone, run three review passes.

### 1. Technical Review

Prompt:

```text
Act as Senior Code Reviewer.

Review the changes for:
- correctness
- type safety
- auth
- RLS
- API validation
- regression risk
- consistency with existing code patterns

Output findings first, ordered by severity.
Do not rewrite code unless asked.
```

### 2. Security And Trust Review

Prompt:

```text
Act as Security Reviewer.

Review the changes for:
- user data isolation
- RLS correctness
- approval boundary enforcement
- risk of hidden autonomous actions
- sensitive data exposure
- unsafe external action behavior

The product rule is:
Agents may draft, plan, research, score, and organize.
Agents may not send, submit, schedule, message, join interviews, or impersonate without explicit user approval.
```

### 3. Product Quality Review

Prompt:

```text
Act as Product QA Reviewer for a world-class interview-prep product.

Review whether this feature:
- helps the user get interview-ready faster
- feels specific rather than generic
- explains why actions matter
- builds user trust
- reduces user cognitive load
- supports the CEO vision of InterviewProof as an interview-readiness operating system

Output:
- what feels premium
- what feels generic
- what is missing
- what should be improved before merge
```

## CEO Approval Checklist

Before approving any milestone, ask:

- Does this move InterviewProof from report to active prep operator?
- Is the user’s next action clearer than before?
- Is memory being created in a useful way?
- Are recommendations evidence-backed?
- Is deterministic scoring still protected?
- Are external-facing actions approval-gated?
- Can users understand and trust what the agent did?
- Did lint and typecheck pass?
- Did existing diagnostic and practice flows survive?

## Anti-Patterns To Avoid

Do not let Claude Code:

- Build the entire platform in one pass.
- Create vague “AI chat” without memory or actions.
- Replace deterministic scoring with LLM judgment.
- Add external autonomy before approval infrastructure.
- Scatter agent logic inside UI components.
- Store important practice history only in localStorage.
- Add database tables without RLS.
- Create agents with overlapping responsibilities.
- Build UI before backend contracts are stable.
- Merge code without a security and product review.

## Best Final Instruction To Claude Code

Use this when starting actual implementation:

```text
We are building InterviewProof into a world-class agentic interview-readiness platform.

Do not optimize for speed. Optimize for correctness, trust, user value, and maintainable architecture.

Work milestone by milestone.
Before coding each milestone:
1. Restate the goal.
2. List files you expect to touch.
3. Identify risks.
4. Confirm acceptance criteria.

After coding each milestone:
1. Summarize what changed.
2. Explain how it helps the user.
3. List verification commands and results.
4. List remaining risks.
5. Do not proceed to the next milestone until CEO approval.
```

## Assumptions

- The CEO wants full-platform direction, not only a Coach tab MVP.
- The correct autonomy model is draft-and-approve.
- The best implementation strategy is sequential milestones with role-based AI agents.
- Claude Code should be treated as an engineering team with review gates, not a single autonomous builder.
- The current repo already has enough diagnostic, scoring, practice, profile, and Supabase foundations to support this transition.
