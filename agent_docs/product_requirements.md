# Product Requirements

## Must-Have Features
1. Resume + Job Description ingestion
2. Interview round selection
3. Readiness score (0–100) + risk band
4. Ranked rejection risks (top 3 free, 10–15 paid)
5. Credits-based unlock ($15 = 1 credit)
6. One rerun per paid report + delta tracking
7. Downloadable PDF report

## NOT in MVP (Delivered Post-MVP)
- ~~Pass probability~~ → Delivered as "Interview Conversion Likelihood" (Phase 7b)

## Not Yet Implemented
- Live interview copilot
- Unlimited reruns
- Subscription billing

## Post-MVP Features (Delivered)

### F-001: Seamless Onboarding UI/UX
- 7-step guided onboarding flow (`/onboarding`)
- Resume PDF upload with text extraction
- Career stage, role, domain, location, urgency collection
- Deterministic "Aha moment" readiness estimate (score 20-75)
- Focus area recommendations based on profile signals
- Profile persistence to `user_profiles` table
- localStorage draft persistence (survives page refresh before completion)
- Landing page "Get Started" CTA links to `/onboarding`

### Phase 7: Career Intelligence Engine
- Interview archetype profiling
- Round pass probability forecasting (Interview Conversion Likelihood)
- Interactive practice intelligence (sync, Rx, pressure, momentum)
- ProofCredits system with referrals
- Three-layer layout with sidebar navigation

### Phase 8: Interactive Practice, HireZone & Evidence
- Evidence-backed claims with data citations
- HireZone scoring + visualization
- Interactive interview practice (questions, feedback, best answers)
- Coaching Hub redesign
- Landing page with aggregate insights

## Success Metrics
- Paid conversion rate
- Rerun usage per paid user
- Onboarding completion rate + drop-off by step

## UI / UX
- Clean, serious, diagnostic
- Evidence-backed, blunt tone
- Desktop-first, mobile supported
- Onboarding defaults to light mode
