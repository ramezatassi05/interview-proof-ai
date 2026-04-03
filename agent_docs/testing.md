# Testing Strategy

- **Unit Tests:** Minimal (scoring logic)
- **E2E:** One smoke test (upload → analyze → paywall)
- **Manual Checks:**
  - Same inputs → same score
  - Free vs paid gating works
  - Rerun delta displays correctly
  - Onboarding: complete all 7 steps → profile saved to DB
  - Onboarding: refresh mid-flow → draft restored from localStorage
  - Onboarding: upload PDF resume → text extracted, stored in profile
  - Onboarding: Aha score displayed correctly (20-75 range, never outside bounds)
  - Onboarding: career stage selection auto-advances to next step
  - Onboarding: role autocomplete filters 100+ roles correctly
  - Onboarding: location multi-select works for countries and cities
  - Onboarding: "Get Started" on landing page navigates to /onboarding
  - Onboarding: light theme applies correctly in onboarding layout
- **Pre-commit Hooks:** lint + typecheck
- **Verification Loop:** Fix failures immediately
