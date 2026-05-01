# AI-Agent Implementation Strategy For InterviewProof Agentic Platform

## Summary

The best way to implement this with Claude Code or similar AI coding agents is **not** to ask one agent to “build the agentic platform.”

That is too large, too ambiguous, and too risky.

Instead, turn the vision into a sequence of small, decision-complete engineering packets. Each packet should have:

- Clear goal
- Exact files or subsystem ownership
- Database/API contract
- UI behavior
- Acceptance criteria
- Verification commands
- “Do not touch” boundaries

The winning approach is:

```text
Architecture spec → Data layer → Agent action system → Practice persistence → Coach tab → Specialist agents → Operator features
```

## Recommended Implementation Order

### 1. Create A Source-Of-Truth Agentic Spec

Before coding, create one internal implementation doc in `agent_docs/`.

Recommended file:

```text
agent_docs/agentic-platform-implementation.md
```

This doc should define:

- Product goal
- Agent list
- Agent responsibilities
- Autonomy boundary
- Data model
- API routes
- UI surfaces
- Test requirements
- Rollout order

This becomes the instruction manual for Claude Code, Cursor, Codex, or future engineers.

### 2. Build The Data Foundation First

Give the first AI coding agent only the persistence layer.

Task:

- Add Supabase migrations for:
  - `agent_sessions`
  - `agent_messages`
  - `agent_actions`
  - `practice_sessions`
  - `practice_answers`
  - `user_memory`
  - `prep_plans`
  - `prep_plan_tasks`
  - `opportunities`
  - `company_research_cache`
- Add RLS policies.
- Add TypeScript types in `src/types`.
- Do not build UI yet.

Why this matters:

The whole agentic product depends on memory, action logs, and practice history. Without this, the product is just chat.

### 3. Build The Agent Action System

Next, implement the core action model.

This is the backbone of the platform.

An `agent_action` should represent anything the agent does or proposes:

```text
draft recruiter reply
generate prep plan
start mock interview
rewrite resume bullets
create company research brief
suggest follow-up email
```

Statuses:

```text
drafted
awaiting_approval
approved
rejected
completed
failed
```

This lets InterviewProof become trustworthy because the user can inspect and approve important actions.

### 4. Move Practice History Server-Side

The current practice experience uses localStorage heavily.

For an agentic product, practice answers and scores need to live in Supabase.

Implement:

- `practice_sessions`
- `practice_answers`
- saved feedback
- score history
- attempt tracking
- mapped risk IDs
- progress summaries

Keep localStorage only as a draft/offline fallback.

This gives agents real memory of what the user struggles with.

### 5. Add The Coach Tab

Once persistence exists, build the first user-facing agent surface.

Add a new diagnostic tab:

```text
Analysis | Practice | Strategy | Insights | Coach
```

The Coach tab should show:

- Chat interface
- Today’s recommended action
- Weakest areas
- Active prep plan
- Recent practice trend
- Pending approvals
- Suggested next drill

The first version does not need to do everything. It needs to feel like the app is now actively guiding the user.

### 6. Add The Prep Orchestrator

After the Coach UI exists, implement:

```text
src/server/agents/prep-orchestrator.ts
```

The orchestrator should:

- Load report context
- Load latest run
- Load profile
- Load practice history
- Load prep plan
- Decide next best action
- Return a structured response
- Create agent actions when needed

Do not let it replace deterministic scoring.

It should use existing scores and risks as input.

### 7. Add Specialist Agents One By One

Add agents in this order:

1. **Readiness Coach Agent**
   - Explains risks and recommends next steps.

2. **Mock Interview Agent**
   - Runs adaptive interview practice.

3. **Answer Feedback Agent**
   - Reuses existing answer feedback logic, but persists results.

4. **Prep Plan Agent**
   - Creates and updates day-by-day plans.

5. **Resume Evidence Agent**
   - Rewrites bullets and builds STAR stories.

6. **Company Research Agent**
   - Creates company-specific prep briefs.

7. **Recruiter Communication Agent**
   - Drafts emails and recruiter replies.

8. **Opportunity Tracker Agent**
   - Manages roles, stages, dates, and next actions.

Each agent should be implemented as a focused module with typed inputs and outputs.

## How To Prompt Claude Code

Use small prompts like this:

```text
Implement only the persistence layer for the agentic platform.

Scope:
- Add Supabase migration for agent_sessions, agent_messages, agent_actions.
- Add RLS policies matching existing user-owned data patterns.
- Add TypeScript types in src/types.
- Do not modify UI.
- Do not implement agent logic yet.

Verification:
- npm run lint
- npm run typecheck
```

Avoid prompts like:

```text
Build the full agentic platform.
```

That will produce scattered changes and weak architecture.

## Best AI-Agent Workflow

Use one agent per milestone.

Recommended workflow:

1. **Explorer agent**
   - Reads existing report, practice, profile, and Supabase patterns.
   - Produces a file/path map.

2. **Builder agent**
   - Implements one milestone only.

3. **Reviewer agent**
   - Reviews for RLS, auth, type safety, product boundary, and regression risk.

4. **Tester agent**
   - Runs lint/typecheck and targeted manual scenarios.

For every task, tell the AI agent:

- Which files it owns
- Which files it must not modify
- Which behavior must remain unchanged
- Which commands must pass
- What acceptance criteria prove success

## Recommended Milestones

### Milestone 1: Agent Persistence

Deliverable:

- Database tables
- RLS policies
- Types
- No UI

Success:

- User-owned agent data is secure.
- Typecheck passes.

### Milestone 2: Agent APIs

Deliverable:

- `/api/agent/session`
- `/api/agent/message`
- `/api/agent/action`
- `/api/agent/memory`

Success:

- Authenticated users can create sessions and actions.
- Users cannot access another user’s data.

### Milestone 3: Practice Persistence

Deliverable:

- Server-backed practice sessions and answers.
- Existing practice UI still works.
- localStorage becomes fallback, not source of truth.

Success:

- Feedback persists across devices and sessions.

### Milestone 4: Coach Tab MVP

Deliverable:

- New Coach tab.
- Report-aware chat.
- Suggested next action.
- Pending action cards.

Success:

- User can ask what to do next and receive report-grounded guidance.

### Milestone 5: Orchestrator

Deliverable:

- Prep orchestrator reads report, profile, memory, and practice history.
- Creates structured recommended actions.

Success:

- Coach recommendations adapt after practice.

### Milestone 6: Specialist Agents

Deliverable:

- Mock Interview Agent
- Resume Evidence Agent
- Company Research Agent
- Recruiter Communication Agent
- Opportunity Tracker Agent

Success:

- Each agent has a clear bounded job and persists useful outputs.

## Guardrails For AI Coding Agents

Every implementation prompt should include these rules:

- Do not change deterministic scoring authority.
- Do not bypass RLS.
- Do not send or submit anything externally.
- Do not make hidden autonomous actions.
- Do not replace existing practice/question APIs unless explicitly required.
- Preserve existing report flow.
- Use Zod validation for new API inputs.
- Keep user approval required for external-facing actions.
- Run `npm run lint` and `npm run typecheck`.

## CEO-Level Implementation Principle

The product should not become “ChatGPT inside InterviewProof.”

It should become:

```text
A memory-backed interview operating system that knows the user,
knows the role, knows the risks, runs practice, drafts next steps,
and keeps adapting until the user is interview-ready.
```

For AI coding agents, the best path is disciplined sequencing: build the memory and action system first, then the Coach surface, then the specialist agents.

