# Technical Design Document: InterviewProof MVP

**System:** InterviewProof  
**Goal:** Job candidates upload resume + job description, select interview round, get a reproducible Readiness Score + ranked rejection risks; pay 1 credit ($15) to unlock full diagnostic + PDF + 1 rerun + delta tracking.  
**Target timeline:** 1–2 weeks demo-ready MVP  
**Non-negotiables:** No “pass probability”; deterministic scoring; explainable/auditable outputs; LLM is analyst, not authority.

---

## 1) Product Requirements → Technical Translation

### Must-have features (MVP)
1. Resume + Job Description ingestion → structured facts
2. Interview round selection (technical / behavioral / case / finance)
3. Readiness Score (0–100) + Risk Band (Low/Medium/High), reproducible
4. Ranked rejection risks (top 3 free, 10–15 paid)
5. Paid unlock via credits ($15 = 1 credit)
6. Rerun once per paid report + delta tracking
7. Downloadable PDF report (paid)

### Performance goals
- Page load < 3 seconds
- API responses < 300ms p95 (for non-LLM endpoints; LLM endpoints will be slower but should be UX-managed)

### Security posture
- Resume data is sensitive
- No training on user data
- Access controls on storage & data
- Avoid overclaiming (diagnostic not “guarantee”)

---

## 2) Recommended MVP Stack (Primary + Alternatives)

### Primary Recommendation (Best for your PRD constraints)
**Next.js + Supabase (Postgres + Auth + Storage + pgvector) + Stripe + 1 LLM + 1 embeddings API**

**Why this is best for InterviewProof MVP**
- Minimal moving parts: auth, DB, vector, storage in one place
- Easy deploy + fast iteration
- Makes “vertical AI” defensible: retrieval + deterministic scoring + auditable evidence chain
- Supports credits/paywall cleanly and cheaply

### Alternatives (2–3 options)

| Option | Pros | Cons | When to choose |
|---|---|---|---|
| **A) Next.js + Supabase (pgvector)** (Recommended) | Fastest MVP, integrated auth/storage/db, easy RAG | Supabase limits on free tier; some vendor coupling | MVP + first 100–1k users |
| **B) Next.js + Firebase + Pinecone** | Great DX, scalable storage/auth, Pinecone strong vector search | More services to manage + higher cost | If you already know Firebase and want Pinecone |
| **C) Next.js + Postgres (Neon) + Upstash Vector/Redis** | Flexible, best-of-breed components | More glue code; higher ops burden | When you outgrow Supabase patterns |

---

## 3) Architecture Overview

### High-level system flow
1. User uploads resume + pastes job description
2. System extracts structured facts (resume facts + JD requirements)
3. System retrieves relevant rubric chunks + question archetypes from vector DB
4. LLM produces structured JSON analysis (NOT final score authority)
5. Deterministic scoring engine computes final score + risk band (reproducible)
6. Explainability layer ties each risk to:
   - Resume evidence (missing/weak)
   - JD requirement
   - Retrieved rubric chunk(s)
7. Free view: score + top 3 risks
8. Paid: unlock full 10–15 risks + question set + study plan + PDF + rerun + delta

### Mermaid diagram
```mermaid
graph TB
  U[User] --> W[Next.js Web App]
  W --> A[API Layer - Next.js Route Handlers]
  A --> S[(Supabase Postgres)]
  A --> V[(pgvector - Rubrics/Questions)]
  A --> ST[(Supabase Storage - resumes)]
  A --> LLM[LLM Provider]
  A --> EMB[Embeddings API]
  A --> P[Stripe Payments/Credits]
  A --> PDF[PDF Generator]
  S --> W
4) Data Model (Postgres / Supabase)
Tables
users (managed by Supabase Auth)
Use Supabase Auth default tables; do not build custom auth in MVP.

credits_ledger
Tracks credit purchases & consumption.

id (uuid)

user_id (uuid)

type (enum: purchase, spend, refund, grant)

amount (int, positive for purchase/grant, negative for spend)

stripe_event_id (text, nullable)

created_at (timestamp)

Why ledger: auditable credit accounting, avoids “current_balance” drift.

reports
A “paid diagnostic report” for a specific resume+JD+round.

id (uuid)

user_id (uuid)

round_type (enum: technical, behavioral, case, finance)

resume_file_path (text) OR resume_text (text, if you choose text-only MVP)

job_description_text (text)

created_at (timestamp)

paid_unlocked (boolean)

credit_spend_ledger_id (uuid, nullable)

runs
Every analysis execution (initial + rerun)

id (uuid)

report_id (uuid)

run_index (int) // 0 = initial, 1 = rerun

extracted_resume_json (jsonb)

extracted_jd_json (jsonb)

retrieved_context_ids (jsonb) // ids of rubric chunks/questions retrieved

llm_analysis_json (jsonb) // strict schema

score_breakdown_json (jsonb) // deterministic scoring components + weights

readiness_score (int)

risk_band (enum: Low/Medium/High)

ranked_risks_json (jsonb) // list of 10–15

created_at (timestamp)

rubric_chunks
Curated internal library (your moat)

id (uuid)

domain (enum: swe, ds, finance, general)

round_type (enum)

chunk_text (text)

source_name (text) // internal rubric version tag

version (text) // e.g., v0.1

embedding (vector)

metadata (jsonb) // tags, skill ids, etc.

question_archetypes
Curated question bank

id (uuid)

domain (enum)

round_type (enum)

question_template (text)

tags (jsonb)

embedding (vector)

5) RAG + Deterministic Scoring Design
Why this is “vertical AI” (not wrapper)
A vertical tool is not “vector DB = vertical”. Verticality comes from:

Domain rubric library + ontology

Grounded retrieval

Deterministic scoring on top of structured LLM output

Audit trail: why the system believes X

Pipeline
Step 1 — Ingest (Extraction)
Input: resume (PDF/text), job description, selected round type

Output: structured JSON

Resume:

skills (normalized)

experiences (company, role, dates, achievements)

metrics (numbers, impact)

recency signals

project evidence

JD:

must_have requirements

nice_to_have

keywords

seniority signals

Implementation

MVP approach: accept PDF → extract text server-side (simple PDF text extraction library)

If extraction fails: show user a paste-text fallback

Step 2 — Embed & Retrieve
Embed:

extracted JD requirements summary

extracted resume evidence summary

round_type prompt key

Retrieve top-k:

rubric_chunks (k=6–10)

question_archetypes (k=6–10)

Store retrieved IDs in runs.retrieved_context_ids for auditability.

Step 3 — LLM Analysis (Strict JSON only)
LLM receives:

extracted_resume_json

extracted_jd_json

retrieved rubric chunks + question archetypes

round_type

LLM must return JSON matching a strict schema (no prose). Example fields:

category_scores: { hard_match: 0–1, evidence_depth: 0–1, round_readiness: 0–1, clarity: 0–1, company_proxy: 0–1 }

ranked_risks: [{id, title, severity, rationale, missing_evidence, rubric_refs:[chunk_id], jd_refs:[...]}]

interview_questions: [{question, mapped_risk_id, why}]

study_plan: [{task, time_estimate_minutes, mapped_risk_id}]

If JSON parsing fails: hard fail + return a “retry” error (no silent failures).

Step 4 — Deterministic Scoring (Authority Layer)
Compute readiness score in code (Node/TS) using stable weights.

Suggested MVP weights (tunable)

Hard requirement match: 35%

Evidence depth (metrics/ownership/recency): 25%

Round readiness: 20%

Resume clarity: 10%

Company expectation proxy (optional): 10%

Risk band

0–39: High

40–69: Medium

70–100: Low

Store score_breakdown_json for reproducibility & debugging.

Step 5 — Explainability Layer
For each risk item, show:

What is expected (rubric chunk excerpt)

What was found in resume (evidence snippet or “missing”)

Which JD requirement it maps to

Why it matters for this round

This is where trust comes from.

6) API Design (Next.js Route Handlers)
Auth
Use Supabase Auth:

Email magic link or email/password (magic link is fastest MVP)

Session stored client-side with Supabase JS

Endpoints (MVP)
POST /api/report/create

body: { resumeFile | resumeText, jobDescriptionText, roundType }

creates report + run(0) placeholder

POST /api/report/analyze

body: { reportId }

runs extraction → retrieval → LLM JSON → scoring

returns: { readinessScore, riskBand, top3Risks, paywallState }

POST /api/report/unlock

body: { reportId }

checks credits, spends 1 credit, marks report paid_unlocked=true

GET /api/report/:id

returns summary + free/paid content gating

POST /api/report/rerun

body: { reportId, updatedResumeFile|Text?, updatedJDText? }

only allowed if paid + run_index < 1

returns new run + delta vs prior

GET /api/report/:id/pdf

returns generated PDF (paid only)

Credits + Stripe
Two viable MVP patterns:

Option A (Recommended): Stripe Checkout + Webhook → credits ledger

User buys credits pack

Stripe webhook confirms payment

Create ledger entry purchase +N

Spending credit is a DB transaction:

verify balance >= 1

insert spend -1

mark report unlocked

Option B: Stripe Payment Link (fastest) + manual ledger

Faster to ship, worse automation

Not recommended if you want clean metrics

7) Frontend Architecture (Next.js)
App routes (suggested)
/ Landing

/new Upload + inputs

/r/[reportId] Results summary (score + top 3 risks, paywall CTA)

/r/[reportId]/full Full diagnostic (paid)

/r/[reportId]/history Delta comparison (paid)

/account Credits + purchases

Component structure
css
Copy code
src/
  app/
    new/
    r/[reportId]/
    account/
  components/
    UploadDropzone.tsx
    RoundSelector.tsx
    ScoreCard.tsx
    RiskList.tsx
    PaywallCTA.tsx
    DeltaView.tsx
  lib/
    supabaseClient.ts
    api.ts
    gating.ts
  server/
    scoring/
    rag/
    pdf/
UX rules
The product must feel “serious diagnostic”:

blunt headings

evidence mapping UI

show reproducibility (“same inputs → same score”)

Free output must feel incomplete (score + top 3 only)

Paid unlock must feel like “resolution”: full risks + questions + plan + PDF + rerun

8) PDF Export
Primary recommendation
React PDF generator server-side:

Generate PDF from the same structured report JSON

Store as a file in Supabase Storage OR generate on-demand and stream

Alternatives

HTML → PDF via headless browser (Playwright) (more reliable rendering, heavier infra)

Client-side PDF (fast but less controllable and easier to tamper)

MVP tradeoff

On-demand generation is simplest (no storage cost)

Cached PDF in storage is faster for repeat downloads

9) Determinism & Reproducibility Strategy
Deterministic scoring
All math/weights in code

Store versioned scoring config (e.g. scoring_config_version = "v0.1")

Store breakdown + inputs hash

LLM determinism constraints
LLMs aren’t perfectly deterministic. Mitigation:

Use strict JSON schema

Use low temperature (0–0.2)

Use few-shot examples in prompt

Validate JSON and retry up to 1–2 times max (then fail visibly)

Input hashing
Compute hashes for:

resume_text_hash

jd_text_hash

round_type

rubric_version

Store in runs to confirm reproducibility and for debugging.

10) Security & Privacy
Data handling
Store resumes in Supabase Storage with private bucket

DB row-level security (RLS) so users can only access their rows

Do not log raw resume/JD in server logs

Add a “Delete my data” button (optional MVP, recommended)

LLM provider hygiene
Do not send unnecessary PII; redact emails/phone by regex before LLM call

Clearly state: “We do not train on your data”

Abuse prevention
Basic rate limiting per user/IP on analyze endpoints

File size limit on resume upload

Virus scanning optional (post-MVP)

11) Observability & Analytics (MVP)
What to track (minimum)
Upload started → upload completed

Analyze started → analyze completed

Paywall viewed

Purchase initiated

Credit spent (unlock)

PDF downloaded

Rerun executed

Tools
PostHog (easy) or simple DB events table

Sentry for errors (especially JSON parse failures, webhook failures)

12) Development Workflow (for 2-week MVP)
AI coding setup
You said you use Claude Code CLI in VS Code.
Recommended split:

Architecture & prompts: Claude

Implementation: Claude Code CLI

Debugging: ChatGPT when stuck

Git
Trunk-based

main

feature/* branches

PR merge with minimal checks

Environments
Local

Prod (Vercel)
(Optional staging if you have time)

Minimal checks
Lint + typecheck

One smoke E2E test for main flow (upload → analyze → paywall)

13) Implementation Plan (Two Weeks, 5–10 hours/week)
Week 1 — End-to-end “shockingly real” demo
Next.js skeleton + UI screens

Supabase auth + private storage

Report create + analyze endpoint stub

Extraction (resume text + JD parsing)

Seed rubric_chunks + question_archetypes (small curated set)

Retrieval + LLM JSON + deterministic scoring

Results summary page (score + top 3 risks)

Milestone: Free diagnostic works end-to-end.

Week 2 — Monetization + trust features
Credits ledger + Stripe checkout + webhook

Unlock gating for full diagnostic

PDF export

Rerun + delta tracking (run_index 1)

Analytics + Sentry

Mobile QA + polish

Milestone: Paid loop works end-to-end.

14) Cost Breakdown (MVP)
MVP (0–200 users)
Vercel: $0

Supabase: $0 (likely) → upgrade later

LLM usage: variable (start small; optimize prompts + retrieval)

Embeddings: low cost (only for rubric data + per analysis request)

Stripe: fees per transaction

Where costs can blow up
Long prompts + too many retrieved chunks

Re-embedding too often

Generating PDFs via headless browser (if you choose that approach)

Mitigations:

Keep top-k small (6–10)

Cache embeddings for identical inputs

Keep rubric library curated and versioned

15) Key Trade-offs (Honest)
Trade-off 1: Speed vs “perfect rubric”
MVP rubric must be good enough to feel legitimate

Too much rubric-building delays launch
Decision: start with small, curated rubric + expand weekly.

Trade-off 2: LLM flexibility vs reproducibility
LLM can be inconsistent
Decision: strict JSON + deterministic scoring + stored breakdown for trust.

Trade-off 3: PDF quality vs engineering time
Perfect PDF layout takes time
Decision: generate a clean, minimal PDF from structured JSON; improve later.

16) Definition of Technical Success (MVP)
You have a successful MVP when:

Free: score + top 3 risks reliably generated

Paid: 1 credit unlock shows full risks + questions + plan + PDF

Rerun: once per paid report, delta is shown clearly

Outputs feel diagnostic (evidence mapping), not generic AI advice

No silent failures; errors are visible and recoverable

