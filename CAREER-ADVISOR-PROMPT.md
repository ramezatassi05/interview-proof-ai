# Phase 9: Career Advisor Feature

## What to Build

Add a new "Career Advisor" feature to InterviewProof. This is a Tier 2 premium feature — a personalized career development engine that tells users which skills to learn next based on their resume, their target role, and real job market demand data.

The core concept: every user account stores ONE resume. The LLM reads the parsed resume on every Career Advisor chat interaction so it always "remembers" who the user is — their skills, experience, education, projects, and career goals. The LLM combines this resume memory with labor market data to give personalized "what to learn next" roadmaps grounded in what employers actually want right now.

This extends the existing product. The current diagnostic answers "what will get you rejected for THIS job?" The Career Advisor answers "what should you learn next to get hired for your DREAM role?"

---

## Resume-in-Memory System

### Database

Create a new migration (`supabase/migrations/017_career_advisor.sql`) with three tables:

**`user_resumes`** — One row per user. Stores the user's resume as persistent LLM memory.

- `user_id` (references auth.users, with a UNIQUE constraint so each user has exactly one resume)
- `raw_text` (the full extracted text from their uploaded PDF/DOCX)
- `raw_file_url` (Supabase Storage path to the original file)
- `file_name`, `file_type` (pdf/docx/text)
- `parsed_data` (JSONB — structured resume data extracted by LLM, see below)
- `skills` (TEXT array — flattened list of all skills found anywhere in the resume)
- `skill_ids` (TEXT array — normalized Lightcast skill IDs, can be empty initially)
- `target_role` (what role they're targeting, e.g. "ML Engineer")
- `target_industry` (e.g. "AI/ML", "Fintech")
- `experience_level` (student / new_grad / junior / mid — inferred from resume)
- `graduation_date`
- Standard timestamps + `last_parsed_at` + `parse_version`

Follow the same RLS pattern as the `reports` table — users can only view/insert/update/delete their own resume.

**`skill_demand`** — Tracks which skills are in demand for which roles. Populated by a daily scrape pipeline (built later). Has columns for `skill_name`, `skill_id`, `target_role`, `mention_count`, `scrape_date`. Make it readable by authenticated users (not user-specific data). Also create a `skill_demand_30d` aggregated view that sums mentions over the last 30 days.

**`career_advisor_conversations`** — Optional conversation persistence. `user_id`, `messages` (JSONB array of role/content/timestamp objects). Standard RLS.

### Parsed Resume Structure

When a user uploads their resume, the LLM parses the raw text into structured JSON stored in `parsed_data`. The structure should capture:

- Name, email, location
- Education (institution, degree, graduation date, GPA, relevant courses)
- Experience (company, title, dates, duration in months, skills used, description)
- Projects (name, description, skills used, URL)
- Skills broken into categories (languages, frameworks, tools, databases, concepts)
- Certifications, interests
- Target role (inferred if not stated)
- Years of experience (sum of all job/internship durations)

Add these types to `src/types/index.ts` following the existing naming conventions (PascalCase interfaces, camelCase properties).

### Resume Upload & Parse

Create two API routes:

**`POST /api/resume/parse`** — Accepts a file upload (PDF or DOCX) or pasted text. Extracts raw text (same approach as the existing `/api/parse-pdf` route), then sends it to the LLM for structured JSON extraction. Uses `gpt-4o-mini` via the existing `MODELS.EXTRACTION` constant in `src/lib/openai.ts` — same model and pattern as `extractResumeData` in `src/server/rag/extraction.ts`. Use `response_format: { type: 'json_object' }` and temperature 0.1 for consistency. Upserts into `user_resumes` (the UNIQUE constraint on user_id means uploading a new resume replaces the old one). Upload the original file to Supabase Storage under a `career-resumes/` prefix.

**`GET/DELETE /api/resume`** — Fetch or delete the current user's resume.

Create the server-side parsing logic in `src/server/resume-parser.ts`. Follow the same structure as `src/server/rag/extraction.ts` — a system prompt that demands strict JSON output, a function that calls the LLM and parses the result, and a helper that flattens all skills into a single array.

Add the corresponding API client functions to `src/lib/api.ts` following the existing `apiFetch` wrapper pattern.

### The Critical Part: Resume Memory Injection

**On EVERY Career Advisor chat API call**, the system MUST:

1. Fetch the user's `user_resumes` row
2. If no resume exists, return a message asking them to upload one
3. If resume exists, inject the full `parsed_data` JSON into the LLM system prompt
4. Also fetch the top 20 skills from `skill_demand_30d` for their target role and inject that too

This is how the LLM "remembers" the user. The resume data goes into the system prompt inside `<user_resume>` tags, and the demand data goes into `<skill_demand>` tags. The LLM is instructed to ALWAYS reference the resume when giving advice, never ask for info already in the resume, and personalize everything to this specific user.

---

## Career Advisor Chat

### System Prompt

Create `src/server/career-advisor.ts` with a function that builds the system prompt. It takes the user's resume and demand data as inputs and returns the full system prompt string. The prompt should instruct the LLM to:

- Always reference the user's specific experience, projects, and skills by name
- Identify skill gaps between where they are and their target role
- Prioritize recommendations by market demand (cite data)
- For each recommendation: WHY (market data), HOW (specific free resource), HOW LONG, HOW it connects to interview prep
- Give ordered roadmaps, not dumps of everything
- Only recommend FREE learning resources (freeCodeCamp, The Odin Project, MIT OCW, fast.ai, Full Stack Open, Coursera/edX free audit, Khan Academy, roadmap.sh, Teach Yourself CS, NeetCode, System Design Primer)
- Never give generic advice
- Be direct and actionable

Embed key market stats as static context in the prompt:
- Python +7% YoY (Stack Overflow 2025), JS #1 at 66%, Docker +17%
- AI/big data = #1 fastest-growing skill domain (WEF 2025)
- Cybersecurity +367%, data science +414%, SWE +297% through 2035 (CompTIA)
- 87% tech leaders confident about 2026, 61% plan headcount increases (Robert Half)
- PostgreSQL most admired + desired database
- React + Node.js dominant web framework pairing

### Chat API Route

Create `POST /api/career-advisor/chat`. It receives `{ message, conversationHistory }`. Auth required. Fetches resume + demand data, builds system prompt, calls Claude (`claude-sonnet-4-20250514`) using the existing `ANTHROPIC_API_KEY` — this is the same hybrid LLM strategy documented in `CLAUDE.md` where Claude handles complex reasoning. If Claude causes timeouts (same issue noted in the CLAUDE.md comments about `performAnalysis`), fall back to OpenAI `gpt-4o`.

Returns `{ data: { response: string, requiresResume: boolean } }` following the existing API response shape convention.

---

## Frontend

### Page & Navigation

Create a new page at `src/app/dashboard/career-advisor/page.tsx`. Add a "Career Advisor" item to the sidebar navigation in `src/components/layout/Sidebar.tsx`.

The page has two states:
- **No resume uploaded**: Show a resume upload component (drag-and-drop PDF/DOCX + paste text fallback)
- **Resume exists**: Show a collapsible resume summary on the left/top, and the chat interface as the main content area

### Components

Create in `src/components/career-advisor/`:

- `ResumeUpload.tsx` — Drag-and-drop file upload + paste text option. Validates file type (PDF/DOCX only) and size (max 5MB). Shows upload progress and "Analyzing your resume..." state during LLM parsing.
- `ResumeSummary.tsx` — Displays the parsed resume data: name, target role, skills (as badges), experience entries, education. Has an "Update Resume" button to re-upload.
- `CareerAdvisorChat.tsx` — Chat interface with message history. Sends messages via the chat API. Maintains conversation history in component state (and optionally persists to `career_advisor_conversations` table).
- `StarterPrompts.tsx` — Shows suggested first-time prompts dynamically based on the resume data (e.g., "What skills should I learn next to become a {targetRole}?", "Create a 3-month learning roadmap based on my resume", "What are my biggest skill gaps for top tech companies?").

Follow the existing component patterns — use the UI primitives from `src/components/ui/`, the theme CSS variables, and the same styling conventions as the diagnostic page components.

---

## Knowledge Base & Data Sources

All sources are free ($0/month in new data costs).

### Extend Existing Knowledge Base

Add O*NET occupation data to the existing `rubric_chunks` table. O*NET (onetcenter.org/database.html) is a free U.S. government database with 923 occupations mapped to skills, knowledge, abilities, and "Hot Technologies" — updated quarterly from real job postings. Download their CSV files and ingest them using the existing `scripts/ingest-knowledge.ts` pattern. Set `source_type = 'onet'` (the `source_type` column was added in migration 006). Run `scripts/populate-embeddings.ts` to generate embeddings for the new chunks.

### Live Job Demand Pipeline (Phase 9d — build after core features work)

Set up a daily cron job using GitHub Actions (free tier: 2,000 min/month) that runs a script (`scripts/scrape-job-demand.ts`) which:

1. Uses JobSpy (github.com/speedyapply/JobSpy, MIT license, free) to scrape job postings from Indeed and Google Jobs for target roles (software engineer, ML engineer, frontend dev, backend dev, data engineer, devops)
2. Extracts skill mentions from job descriptions
3. Optionally normalizes skills via the Lightcast Free Skills API (lightcast.io/open-skills — free registration, 33K+ skills)
4. Upserts counts into the `skill_demand` table using the service role Supabase client

This gives the Career Advisor live demand data at zero cost. The `skill_demand_30d` view aggregates it for the system prompt.

### Other Free Data Sources to Reference

These don't need ingestion — they inform the static market intelligence embedded in the system prompt:

- Stack Overflow Developer Survey 2025 (downloadable under ODbL, 49K devs, 314 technologies)
- WEF Future of Jobs Report 2025 (free PDF, skill projections through 2030)
- CompTIA State of Tech Workforce (free report, growth projections)
- Robert Half Salary Guide 2026 (free download, salary ranges by role)
- BLS Occupational Outlook Handbook (public domain, employment projections through 2034)
- CareerOneStop Skill Gaps API (free, DOL-sponsored — compares skills between two occupations)

---

## How This Connects to Existing Architecture

This is NOT a separate product. It extends existing patterns:

- `user_resumes` table follows the same JSONB + RLS pattern as `reports` and `runs`
- Resume parsing uses the same LLM extraction pattern as `rag/extraction.ts` (gpt-4o-mini, strict JSON, temperature 0.1)
- Chat uses Claude for reasoning (same hybrid strategy as `performAnalysis` in `rag/analysis.ts`)
- Credit gating uses the existing `credits_ledger` and ProofCredits system
- Knowledge base extension uses the existing `rubric_chunks` table with `source_type` filtering (migration 006)
- Embedding generation uses existing `scripts/populate-embeddings.ts`
- API routes follow existing auth check → business logic → `{ data?, error? }` response pattern
- API client uses existing `apiFetch` wrapper in `src/lib/api.ts`
- Frontend uses existing UI primitives, theme variables, sidebar navigation pattern

---

## Implementation Order

1. **Phase 9a — Resume System**: Migration, types, resume-parser server logic, upload/fetch API routes, API client functions, ResumeUpload and ResumeSummary components
2. **Phase 9b — Chat**: System prompt builder, chat API route, CareerAdvisorChat component, StarterPrompts component, page route, sidebar nav item
3. **Phase 9c — Knowledge Base**: O*NET ingestion into rubric_chunks, embeddings, Lightcast free API utility
4. **Phase 9d — Live Demand**: JobSpy scrape script, GitHub Actions workflow, wire demand data into system prompt
5. **Phase 9e — Polish**: Credit gating, conversation persistence, resume strength score

Start with Phase 9a. Plan the approach, get approval, then implement one piece at a time. Run `npm run lint && npm run typecheck` after every change.
