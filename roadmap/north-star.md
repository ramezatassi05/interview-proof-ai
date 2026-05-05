# InterviewProof.ai — North Star

> **This file is the shared strategic context every Command Center agent reads at the start of every session.** Domain CSVs (`product.csv`, `marketing.csv`, `finance.csv`) describe *what* to do. This file describes *why*, *what stage we are at*, and *what we will not do right now*. If something here conflicts with a domain CSV, this file wins.

_Last updated: 2026-05-05_

---

## Mission

InterviewProof.ai gives job-seekers a brutally honest, diagnostic-first read on how they will perform in real interviews — and a plan to close the gap before they walk in.

## Current Stage

**Pre-launch.** ~0 active signups. The product exists end-to-end (onboarding, diagnostic pipeline, full report) but has not been put in front of real users yet. We are in **build & polish**, not **optimize & scale**.

## This Quarter's Top 3 Priorities

1. **Ship a sharable product launch video** that captures the diagnostic-first hook in under 90 seconds.
2. **Finish F-001 Seamless Onboarding** so first-impression flow does the product justice when traffic arrives.
3. **Close the Command Center loop** — agents reading this north star, proposing aligned tasks, executing approved work autonomously.

## Constraints

- **Team size**: 1 (solo founder).
- **Budget**: bootstrapped. Burn must stay near zero. Anything over $50/mo recurring needs explicit approval.
- **Stack**: Next.js App Router, Supabase, Vercel, Anthropic Claude. Do not propose stack changes without strong justification.
- **Time horizon**: focus on what ships in the next 2–6 weeks. Anything longer goes in the backlog, not the active queue.

## What NOT to Do Right Now (Anti-Priorities)

The agents must avoid proposing these until the company is in a different stage:

- ❌ **Funnel / conversion analytics work** — we have ~0 signups; there is nothing to analyze yet.
- ❌ **Paid acquisition / ad spend planning** — we have no organic baseline yet.
- ❌ **Enterprise / B2B sales motion** — we are pre-product-market-fit on B2C.
- ❌ **Hiring / org-design proposals** — team is 1 person.
- ❌ **Refactors of working code without a concrete user-facing benefit** — keep building, not polishing internals.
- ❌ **New auth providers, new databases, new frameworks** — stack is locked for this quarter.

When in doubt, the agent should **propose nothing** rather than propose something off-priority.

## Brand Voice (for marketing-facing work)

- **Tone**: confident, direct, grown-up. We are not cute. We do not infantilize.
- **Stance**: diagnostic-first — we tell the truth about how someone will perform, then help them improve. We are not a hype tool.
- **Avoid**: motivational filler, vague "AI-powered" language, generic SaaS copy.
