# Codebase Changes For Agentic Application

## Executive Summary

InterviewProof is moving from a diagnostic report product into an agentic interview-readiness platform.

Today, the app helps users understand why they may get rejected. The agentic version should help users actively fix those rejection risks through persistent coaching, practice loops, company research, recruiter communication drafts, resume evidence improvement, and opportunity tracking.

The product direction is:

```text
Static diagnostic → Persistent interview coach → Job-search operating system
```

The core loop becomes:

```text
Diagnose → Plan → Practice → Evaluate → Adapt → Repeat
```

InterviewProof should remain evidence-backed. Agents can interpret, coach, draft, and recommend, but deterministic scoring should remain the authority for readiness scores, risk bands, HireZone status, and progress tracking.

## Codebase Direction

The main codebase change is adding an agent layer on top of the existing diagnostic engine.

The existing system already has strong foundations:

- Resume and JD parsing
- RAG-based analysis
- Deterministic scoring
- HireZone analysis
- Recruiter red flags
- Practice questions
- AI answer feedback
- Best-answer generation
- Profile and onboarding data
- Supabase persistence

The agentic version should reuse those foundations rather than replacing them.

New code should add:

- Server-side agent orchestration
- Persistent agent memory
- Server-backed practice history
- Agent actions with approval states
- Opportunity tracking
- Company research cache
- Coach UI inside the diagnostic experience
- Approval flows for drafts and external-facing actions

## Major Codebase Changes

### 1. Agent Core

Add a new server-side agent layer under:

```text
src/server/agents/
```

This layer should contain a central orchestrator and specialist agents.

The orchestrator decides what the user needs next. The specialist agents perform focused tasks.

Example:

```text
User: I have a Google technical interview in 5 days.

Prep Orchestrator:
1. Reads the diagnostic report.
2. Checks weakest areas.
3. Builds a 5-day plan.
4. Starts a mock technical drill.
5. Scores the answer.
6. Updates memory.
7. Adjusts tomorrow’s prep.
```

### 2. Persistent Memory

InterviewProof should move from session-level coaching to long-term user memory.

New persisted data should include:

- Agent conversations
- Agent actions
- Practice sessions
- Practice answers
- Weak areas
- Prep plans
- Prep task completion
- Opportunity pipeline
- Company research briefs
- User coaching preferences

This is what turns the product from “chat” into a real agentic system.

### 3. Agent APIs

Add APIs for:

- Creating or resuming agent sessions
- Sending messages to the coach
- Creating agent actions
- Approving or rejecting actions
- Saving practice sessions
- Saving scored answers
- Updating prep plans
- Managing opportunities
- Generating company research briefs

The most important concept is `agent_actions`.

An agent action is something the agent did or wants to do, such as:

- Draft a recruiter reply
- Generate a mock interview
- Rewrite resume bullets
- Build a 3-day prep plan
- Create a company research brief
- Suggest a follow-up email

Each action should have a status:

```text
drafted
awaiting_approval
approved
rejected
completed
failed
```

### 4. Product UI

Add a new `Coach` surface.

This can start as a new tab inside the full diagnostic page, beside:

```text
Analysis
Practice
Strategy
Insights
Coach
```

The Coach tab should show:

- A chat-style agent interface
- Today’s highest-impact prep task
- Current weakest areas
- Active prep plan
- Recent practice performance
- Pending drafts requiring approval
- Progress since last session

The Practice tab should also become server-backed instead of relying mainly on localStorage.

## Agents Being Added

### 1. Prep Orchestrator Agent

**Purpose**

This is the main coordinating agent.

It decides what should happen next for the user based on their report, interview timeline, weak areas, practice history, and opportunities.

**Used For**

- Choosing the next best action
- Routing work to specialist agents
- Maintaining the prep loop
- Updating the plan after practice
- Explaining priorities to the user

**How It Helps The User**

The user no longer has to figure out what to do next. InterviewProof becomes proactive and says:

> “Your biggest risk is weak evidence depth. Today, we’re fixing that with one STAR story drill and one resume evidence rewrite.”

---

### 2. Readiness Coach Agent

**Purpose**

This is the user-facing interview coach.

It explains diagnostic results, translates risks into action, and helps the user improve over time.

**Used For**

- Explaining red flags
- Building prep plans
- Recommending drills
- Reviewing progress
- Keeping the user focused on high-impact work

**How It Helps The User**

The diagnostic becomes actionable. Instead of reading a report and leaving, the user has a coach that tells them exactly how to improve.

---

### 3. Mock Interview Agent

**Purpose**

This agent conducts realistic mock interviews.

**Used For**

- Asking interview questions
- Asking adaptive follow-ups
- Simulating pressure
- Running technical, behavioral, product, design, or data interviews
- Producing post-interview debriefs

**How It Helps The User**

The user gets realistic practice instead of static question lists. The agent can challenge vague answers and push for stronger evidence.

---

### 4. Answer Feedback Agent

**Purpose**

This agent scores and critiques user answers.

It can build on the current answer feedback API, but should persist feedback and update memory.

**Used For**

- Scoring answers
- Highlighting strong and weak parts
- Suggesting better structure
- Tracking repeated mistakes
- Updating readiness trends

**How It Helps The User**

Users see exactly why an answer is weak and how to improve it on the next attempt.

---

### 5. Resume Evidence Agent

**Purpose**

This agent improves the proof behind the candidate’s application.

**Used For**

- Finding weak resume evidence
- Rewriting bullets for a target role
- Creating STAR stories
- Asking follow-up questions to uncover stronger examples
- Building a reusable story bank

**How It Helps The User**

Many candidates are not actually unqualified; they just fail to prove their fit. This agent helps them surface and communicate stronger evidence.

---

### 6. JD Matching Agent

**Purpose**

This agent compares the candidate against the job description.

**Used For**

- Mapping resume evidence to job requirements
- Identifying must-have gaps
- Separating real gaps from communication gaps
- Creating targeted prep priorities

**How It Helps The User**

The user understands exactly where they match the role and where they are exposed.

---

### 7. Company Research Agent

**Purpose**

This agent researches the target company and turns that research into interview prep.

**Used For**

- Company briefings
- Product and business model summaries
- Recent news summaries
- Competitor context
- “Why this company?” talking points
- Interviewer questions
- Company-specific interview themes

**How It Helps The User**

The user walks into interviews sounding prepared, specific, and commercially aware.

---

### 8. Recruiter Communication Agent

**Purpose**

This agent drafts recruiter and hiring-team messages.

**Used For**

- Recruiter replies
- Thank-you notes
- Follow-up emails
- Reschedule messages
- Compensation expectation responses
- Status check messages

**How It Helps The User**

Users communicate professionally without staring at a blank page. The agent drafts, but the user approves before anything is sent.

---

### 9. Opportunity Tracker Agent

**Purpose**

This agent manages the user’s interview pipeline.

**Used For**

- Tracking companies
- Tracking roles
- Tracking interview stages
- Tracking interview dates
- Recommending prep based on upcoming interviews
- Detecting stale opportunities

**How It Helps The User**

InterviewProof becomes a lightweight job-search CRM. The user knows what is happening, what is next, and what to prepare for.

---

### 10. Prep Plan Agent

**Purpose**

This agent creates and updates the user’s preparation roadmap.

**Used For**

- Day-by-day prep plans
- Task prioritization
- Adjusting based on answer scores
- Compressing plans when interview dates are close
- Balancing technical, behavioral, and company prep

**How It Helps The User**

The user gets a dynamic plan instead of a static checklist.

---

### 11. Post-Interview Debrief Agent

**Purpose**

This agent captures what happened after an interview and converts it into next steps.

**Used For**

- Logging questions asked
- Identifying weak answers
- Drafting follow-up emails
- Updating risk profile
- Preparing for the next round

**How It Helps The User**

The product keeps learning after every interview. Each interview makes the next round preparation sharper.

---

### 12. Application Materials Agent

**Purpose**

This agent helps users create job-specific materials.

**Used For**

- Resume variants
- Cover letters
- Recruiter summaries
- Brag sheets
- Portfolio copy
- Role-specific project narratives

**How It Helps The User**

The user can quickly create sharper materials for each opportunity without starting from scratch.

## Product Boundary

InterviewProof should use a “draft and approve” autonomy model.

Agents can:

- Research
- Draft
- Plan
- Fill
- Score
- Recommend
- Save
- Organize

Agents should not automatically:

- Submit applications
- Send emails
- Schedule meetings
- Message recruiters
- Join live interviews
- Impersonate the user

Anything external-facing should require explicit user approval.

## Why This Can Be Best In Class

The strongest version of InterviewProof is not another AI chat coach.

The advantage is combining:

- Evidence-backed diagnostics
- Deterministic scoring
- Persistent memory
- Adaptive practice
- Company-specific research
- Recruiter-perspective simulation
- User-approved action execution

Most interview tools stop at generic practice questions.

InterviewProof can become the system that knows:

- What role the user wants
- Why they are at risk
- What evidence they are missing
- What they practiced
- Whether they improved
- What interview is next
- What action matters today

The world-class product promise becomes:

> “InterviewProof gets you interview-ready by doing the thinking, planning, practicing, and drafting with you.”

## Implementation Assumptions

- The first autonomy model is draft-and-approve.
- Existing deterministic scoring remains the source of truth.
- Existing question generation and feedback APIs should be reused.
- Practice history should move from localStorage to Supabase.
- Agents should cite report, resume, JD, or practice evidence when making claims.
- Browser automation and external integrations should come after the approval and audit model is strong.
