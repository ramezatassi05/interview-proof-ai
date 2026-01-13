# Product Requirements Document: InterviewProof MVP

## Overview

**Product Name:** InterviewProof  
**Problem Statement:** InterviewProof helps job candidates understand exactly what will cause rejection in a specific interview so they can fix the highest-impact gaps quickly.  
**MVP Goal:** Validate that users will reliably pay for a $15 job-specific interview diagnostic report.  
**Target Launch:** 1–2 weeks (demo-ready MVP)

---

## Target Users

### Primary User Profile
**Who:**  
Job candidates preparing for high-stakes interviews in:
- Software Engineering
- Data Science
- Finance / Case Interviews

**Problem:**  
They lack clear, concrete feedback on *why* they fail interviews and don’t know what to prioritize when preparing under time pressure.

**Current Solution:**  
- ChatGPT (generic, non-auditable advice)
- LeetCode / question banks (practice without diagnosis)
- Mock interviews (expensive, inconsistent, non-scalable)

**Why They’ll Switch:**  
InterviewProof provides an **auditable, role-specific diagnostic** that identifies rejection risks and prioritizes fixes — not generic advice.

---

## User Journey

### The Story
A candidate has an upcoming interview and feels uncertain about readiness. They upload their resume and job description, select the interview round, and receive a readiness score with top rejection risks. After unlocking the full diagnostic, they get a clear, prioritized plan and can rerun the analysis to track improvement.

### Key Touchpoints
1. **Discovery:** Searching for interview prep clarity or referred by peers  
2. **First Contact:** InterviewProof upload page  
3. **Onboarding:** Resume + job description upload, round selection  
4. **Core Loop:** Diagnostic → fix gaps → rerun → compare deltas  
5. **Retention:** Multiple interviews / rounds drive repeat usage

---

## MVP Features

### Core Features (Must Have) ✅

#### 1. Resume + Job Description Ingestion
- **Description:** Parse resume and job description into structured facts (skills, experience, requirements).
- **User Value:** Enables job-specific analysis.
- **Success Criteria:**
  - Resume parsed into skills, projects, metrics
  - JD parsed into must-have vs nice-to-have requirements
- **Priority:** Critical

#### 2. Interview Round Selection
- **Description:** User selects round type (technical, behavioral, case, finance).
- **User Value:** Ensures correct rubric and evaluation logic.
- **Success Criteria:**
  - Round selection affects scoring and risk output
- **Priority:** Critical

#### 3. Readiness Score + Risk Band
- **Description:** Generate a 0–100 readiness score with Low / Medium / High risk band.
- **User Value:** Provides a clear, comparable anchor.
- **Success Criteria:**
  - Score is reproducible for same inputs
- **Priority:** Critical

#### 4. Ranked Rejection Risks
- **Description:** Ordered list of 10–15 rejection risks.
- **User Value:** Shows exactly what will sink the candidate.
- **Success Criteria:**
  - Top 3 risks shown free
  - Full list unlocked via credit
- **Priority:** Critical

#### 5. Rerun + Delta Tracking
- **Description:** Allow one rerun per paid report and show score/risk changes.
- **User Value:** Proves improvement and builds trust.
- **Success Criteria:**
  - Score delta displayed
  - Resolved vs remaining risks highlighted
- **Priority:** Critical

---

## Monetization Model (Credits-Based)

### Free Tier
- Readiness score
- Top 3 rejection risks
- No export
- No rerun
- No delta tracking

### Paid Diagnostic (1 Credit – $15)
Includes:
- Full ranked rejection risks (10–15 items)
- Evidence-backed explanations tied to resume + rubric
- Role-specific interview question set
- Short, time-boxed study plan
- Downloadable PDF report
- One rerun with score + risk delta

### Planned Bundles (Post-MVP)
| Bundle | Price | Details |
|------|------|--------|
| 3 Credits | $29 | 3 interview rounds / roles |
| Urgency Window | $49 | Unlimited reruns for 14 days |

---

## Success Metrics

### Primary Metrics
1. **Paid Conversion Rate**
   - Target: Users reliably purchase $15 credits
   - Measurement: % of users who unlock full report

2. **Rerun Usage**
   - Target: Paid users perform at least one rerun
   - Measurement: Avg reruns per paid user

---

## UI / UX Direction

**Design Feel:**  
Clean, professional, serious, diagnostic

**Tone:**  
Confident, evidence-based, blunt but helpful

### Key Screens
1. Upload / Input Screen  
2. Results Summary (Score + Top 3 Risks)  
3. Paywall / Unlock Screen  
4. Full Diagnostic Report  
5. History / Delta Comparison

---

## Technical Considerations

**Platform:** Web (Next.js)  
**Responsive:** Yes (desktop-first, mobile supported)  

**Performance Goals:**
- Page load < 3 seconds
- API responses < 300ms (p95)

**Security / Privacy:**
- Resume data treated as sensitive
- No training on user data
- Secure storage with access controls

**Scalability:**
- Designed to support bursty usage during hiring seasons
- Vector-based retrieval for rubric and question archetypes

---

## Constraints & Requirements

### Budget
- Minimal
- Supabase (auth, storage, pgvector)
- Single LLM + embeddings API

### Timeline
- MVP build: 1–2 weeks
- Demo-ready with end-to-end flow

### Hard Rules
- No “pass probability” claims
- Diagnostic, not advice or cheating
- Deterministic scoring layer
- Explainable, auditable outputs
- LLM acts as analyst, not authority

---

## Quality Standards

**Code Quality:**
- Deterministic scoring logic in backend
- Structured JSON outputs from LLM
- No silent failures

**Design Quality:**
- No placeholder content
- Clear evidence mapping
- Mobile-tested before launch

**What This Project Will NOT Accept:**
- Generic “AI advice”
- Features outside MVP scope
- Undocumented scoring logic

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|-----|-------|-----------|
| Perceived as GPT wrapper | High | Emphasize scoring + evidence |
| Overclaiming outcomes | High | Avoid probability language |
| Low conversion | Medium | Strong free → paid paywall design |

---

## MVP Completion Checklist

### Development Complete
- [ ] All core features functional
- [ ] Deterministic scoring verified
- [ ] Rerun + delta works

### Launch Ready
- [ ] Analytics configured
- [ ] PDF export working
- [ ] Payment + credit redemption tested

### Quality Checks
- [ ] End-to-end user flow tested
- [ ] No critical bugs
- [ ] Outputs feel “diagnostic,” not advisory

---

## Next Steps

1. Approve this PRD (done ✅)
2. Create **Technical Design Document (Part III)**
3. Set up development environment
4. Implement MVP
5. Test with 5–10 real candidates
6. Launch 🚀

---
*Created: January 2026*  
*Status: Ready for Technical Design*
