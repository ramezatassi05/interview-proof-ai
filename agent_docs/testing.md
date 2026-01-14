# Testing Strategy

- **Unit Tests:** Minimal (scoring logic)
- **E2E:** One smoke test (upload → analyze → paywall)
- **Manual Checks:**
  - Same inputs → same score
  - Free vs paid gating works
  - Rerun delta displays correctly
- **Pre-commit Hooks:** lint + typecheck
- **Verification Loop:** Fix failures immediately
