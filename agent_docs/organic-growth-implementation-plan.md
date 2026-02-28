# Organic Growth — Code Implementation Plan

> Code-level implementation plan for the organic growth marketing strategy.
> Covers all in-product changes that support organic discovery, sharing, and conversion.

---

## Positioning Updates

### Updated One-Liner
**"Find what will get you rejected — then walk in with the answers, coaching, and practice to turn every weakness into your edge."**

### Audience Segments (Updated Order)
- **A** — The Anxious Intern Applier (primary)
- **B** — The Serial Interviewer (keeps reaching final rounds, can't convert)
- **C** — The Career Switcher (bootcamp grads, career changers)
- **D** — The Anxious Mid-Level (imposter syndrome, level jump)

---

## Implementation Tasks

### 1. Update Landing Page Hero Copy
**Files:** `src/app/page.tsx`

**Current:**
- H1: "Know Exactly What Will **Sink You**"
- Subheadline: "Upload your resume. See exactly what recruiters will reject you for — before the interview."
- Steps: 1. Upload your resume → 2. Get your risk score → 3. Fix hidden red flags

**New:**
- H1: "Find What Will **Get You Rejected** — Then **Walk In Ready**"
- Subheadline: "Upload your resume and job description. Get your rejection risks, personalized answers, AI coaching, and a fix plan — in 60 seconds."
- Steps: 1. Upload resume + JD → 2. See your rejection risks → 3. Get answers, coaching & a fix plan

**Also update:**
- Footer CTA section (line ~522): H2 "Ready to Find Your Gaps?" → "Ready to Turn Your Gaps Into Strengths?"
- Footer CTA paragraph: update to emphasize answers + coaching + practice, not just diagnostic
- Pricing line (line ~111): keep "Free preview. Full diagnostic for $15." as-is

---

### 2. Add Open Graph & Twitter Card Meta Tags
**Files:** `src/app/layout.tsx`

**Current:** Only `title` and `description` in metadata. No OG, no Twitter cards, no `metadataBase`.

**Add:**
```typescript
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://interviewproof.com'),
  title: {
    default: 'InterviewProof — Find What Will Get You Rejected, Then Walk In Ready',
    template: '%s | InterviewProof',
  },
  description:
    'Upload your resume. Get your rejection risks, personalized answers, AI coaching, and a fix plan — in 60 seconds. Built from 50+ real recruiter rubrics.',
  openGraph: {
    type: 'website',
    siteName: 'InterviewProof',
    title: 'InterviewProof — Find What Will Get You Rejected, Then Walk In Ready',
    description:
      'Upload your resume. Get your rejection risks, personalized answers, AI coaching, and a fix plan — in 60 seconds.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'InterviewProof' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InterviewProof — Find What Will Get You Rejected, Then Walk In Ready',
    description:
      'Upload your resume. Get your rejection risks, personalized answers, AI coaching, and a fix plan — in 60 seconds.',
    images: ['/og-image.png'],
  },
};
```

**Also needed:** Create a static OG image at `public/og-image.png` (1200x630px) with:
- InterviewProof logo/branding
- The one-liner text
- A sample score (e.g., "73/100 — Medium Risk")
- Dark background matching the app theme

---

### 3. Add Dynamic OG Tags for Shared Reports
**Files:** `src/app/s/[token]/page.tsx` → needs to be split into a server layout + client component

**Current:** Fully client-side (`'use client'`), no server metadata. When shared on social, shows generic preview.

**Implementation approach:**
1. Create `src/app/s/[token]/layout.tsx` (server component) that fetches report metadata and returns dynamic OG tags
2. Move the existing page content into a client component
3. Dynamic metadata example:

```typescript
// src/app/s/[token]/layout.tsx
export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  // Fetch minimal report data server-side
  const report = await getSharedReportMetadata(params.token);
  if (!report) return {};

  const title = report.companyName
    ? `${report.readinessScore}/100 Readiness for ${report.companyName}`
    : `${report.readinessScore}/100 Interview Readiness Score`;

  return {
    title,
    description: `${report.riskBand} Risk — ${report.totalRisks} rejection risks identified. See the full diagnostic on InterviewProof.`,
    openGraph: {
      title,
      description: `${report.riskBand} Risk — ${report.totalRisks} rejection risks identified.`,
      images: [{ url: '/og-image.png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: `${report.riskBand} Risk — ${report.totalRisks} rejection risks identified.`,
    },
  };
}
```

4. Add a helper function in `src/app/api/report/shared/` or `src/lib/` that queries report metadata by share token (score, company, risk band, risk count) without loading the full report.

---

### 4. Add Twitter/X and LinkedIn Share Buttons to ShareModal
**Files:** `src/components/share/ShareModal.tsx`

**Current:** Copy link + Email only. No social share buttons, no viral share text.

**Add after the email button (inside the `shareEnabled && shareUrl` block):**

```tsx
{/* Social share buttons */}
<div className="flex gap-2">
  <button onClick={handleShareTwitter} className="...">
    <XIcon /> Share on X
  </button>
  <button onClick={handleShareLinkedIn} className="...">
    <LinkedInIcon /> Share on LinkedIn
  </button>
</div>
```

**Share handlers with pre-composed viral text:**
```typescript
const handleShareTwitter = useCallback(() => {
  const scoreText = readinessScore != null ? `I scored ${readinessScore}/100` : 'I just ran my interview diagnostic';
  const companyText = companyName ? ` for ${companyName}` : '';
  const text = `${scoreText}${companyText} on InterviewProof — it shows your exact rejection risks and how to fix them.\n\nGet yours free:`;
  window.open(
    `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
    '_blank'
  );
}, [shareUrl, readinessScore, companyName]);

const handleShareLinkedIn = useCallback(() => {
  window.open(
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    '_blank'
  );
}, [shareUrl]);
```

**SVG icons:** Inline small X (Twitter) and LinkedIn SVG icons. No external dependency needed.

---

### 5. Add Share CTA on Free Results Page (Post-Score)
**Files:** `src/app/r/[id]/page.tsx`

**Current:** Shows ScoreCard → Top 3 Risks → Competency Heatmap Preview → PaywallCTA. No share mechanism.

**Add a share prompt after the ScoreCard** (highest-emotion moment — user just saw their score):

```tsx
{/* Share your score */}
<div className="flex items-center justify-between rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
  <div>
    <p className="text-sm font-medium text-[var(--text-primary)]">
      Know someone interviewing soon?
    </p>
    <p className="text-xs text-[var(--text-muted)]">
      Share your score — they&apos;ll thank you later.
    </p>
  </div>
  <button onClick={handleShareScore} className="...">
    Share Score
  </button>
</div>
```

**Implementation:**
- The share on the free results page should use `navigator.share()` (Web Share API) where available, with a fallback to copying a link
- The share text: "I scored {score}/100 on my interview readiness diagnostic for {company}. Find your rejection risks before your next interview → {appUrl}/new"
- No need for the full ShareModal here — this is a lightweight prompt. The full modal lives on `/r/[id]/full`.

---

### 6. Update PDF Template Branding
**Files:** `src/server/pdf/template.tsx`

**Current footer (3 pages):**
```
InterviewProof - Know What Will Sink You | interviewproof.com
```

**New footer:**
```
InterviewProof — Find your rejection risks. Fix them before you walk in. | interviewproof.com
```

**Also:**
- Replace hardcoded `interviewproof.com` with `process.env.NEXT_PUBLIC_APP_URL` (strip protocol)
- Add a small CTA line on the last page above the footer:
  ```
  Know someone interviewing soon? Share InterviewProof — interviewproof.com
  ```

---

### 7. Add Social Links to Footer
**Files:** `src/components/layout/Footer.tsx`

**Current:** Logo + tagline, Privacy/Terms/Contact links (all `href="#"`), trust badges. No social links.

**Add social icon links** in the top row next to the logo/tagline:

```tsx
<div className="flex items-center gap-3">
  <a href="https://x.com/interviewproof" target="_blank" rel="noopener noreferrer"
     className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
    {/* X/Twitter SVG icon */}
  </a>
  <a href="https://linkedin.com/company/interviewproof" target="_blank" rel="noopener noreferrer"
     className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
    {/* LinkedIn SVG icon */}
  </a>
</div>
```

**Update tagline:** "InterviewProof - Know what will sink you." → "InterviewProof — Find your rejection risks. Walk in ready."

**Note:** The social URLs (X handle, LinkedIn company page) need to be created first. Use placeholder hrefs until they exist.

---

### 8. Update Shared Report CTA with Referral Tracking
**Files:** `src/app/s/[token]/page.tsx`

**Current CTA (line ~387):**
```tsx
<Link href="/new">Get started free</Link>
```

**Updated CTA:**
- Link to `/new?ref=shared` to track organic traffic from shared reports
- More compelling copy:

```tsx
<div className="mt-12 rounded-xl border border-[var(--border-accent)] bg-[var(--color-accent)]/5 p-8 text-center">
  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
    Want to know your rejection risks?
  </h3>
  <p className="mt-2 text-sm text-[var(--text-secondary)]">
    Upload your resume and job description — get your score, personalized answers,
    AI coaching, and a fix plan in 60 seconds.
  </p>
  <Link href="/new?ref=shared" className="...">
    Run my free diagnostic
  </Link>
</div>
```

---

### 9. Update FAQ Copy
**Files:** `src/components/landing/FAQ.tsx`

**Update "What is InterviewProof?" answer** to lead with the new positioning:

> "InterviewProof is an interview intelligence platform that finds your exact rejection risks for a specific role — then gives you personalized answers, AI coaching, and a prioritized fix plan to turn every weakness into a strength. Built from 50+ real recruiter rubrics, not generic advice."

**Update "How does InterviewProof compare to mock interviews or coaching?" answer** to emphasize the full value prop (answers, coaching, practice) more prominently.

---

### 10. Surface Referral Code on High-Emotion Pages
**Files:**
- `src/app/r/[id]/page.tsx` (after PaywallCTA)
- `src/app/r/[id]/full/page.tsx` (after PDF download / at bottom)

**Current:** Referral code only visible in `/wallet`. Not surfaced anywhere high-traffic.

**Add a subtle referral nudge** on both results pages:

```tsx
{/* Referral nudge */}
<div className="mt-6 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-4 text-center">
  <p className="text-sm text-[var(--text-secondary)]">
    Know someone interviewing soon?{' '}
    <Link href="/wallet" className="font-medium text-[var(--accent-primary)] hover:underline">
      Share your referral code
    </Link>
    {' '}— you both get 3 free credits.
  </p>
</div>
```

This is lightweight and doesn't require loading the referral code on these pages — it just links to the wallet where the code is already displayed.

---

## Implementation Order (Recommended)

| Priority | Task | Impact | Effort |
|----------|------|--------|--------|
| 1 | Landing page hero copy (#1) | High — first impression | Low |
| 2 | Open Graph meta tags (#2) | High — every shared link benefits | Low |
| 3 | Social share buttons in ShareModal (#3) | High — enables viral sharing | Low |
| 4 | Share CTA on free results page (#5) | High — highest-emotion moment | Low |
| 5 | Footer social links + tagline (#7) | Medium — brand presence | Low |
| 6 | Dynamic OG for shared reports (#3) | High — shared links look great | Medium |
| 7 | Shared report CTA with tracking (#8) | Medium — referral tracking | Low |
| 8 | PDF branding update (#6) | Medium — every PDF is a marketing asset | Low |
| 9 | FAQ copy update (#9) | Low — supports positioning | Low |
| 10 | Referral nudge on results pages (#10) | Medium — surfaces buried feature | Low |

---

## Assets Needed (Non-Code)

These are required but not code tasks:

1. **OG image** (`public/og-image.png`, 1200x630px) — branded social preview card
2. **Twitter/X account** — create `@interviewproof` (or similar available handle)
3. **LinkedIn company page** — create InterviewProof company page
4. **Social profile bios** — use the one-liner as the bio

---

## Not In Scope (Strategic, Not Code)

These items from the marketing plan are strategic/content tasks, not code changes:

- SEO blog content creation (articles, keywords)
- Social media posting cadence (Twitter, LinkedIn, Reddit, TikTok)
- Community building (Discord)
- University/bootcamp partnerships
- Newsletter sponsorships
- Podcast appearances
- Product Hunt / HN launch
- Startup directory listings
- Email drip sequences (requires email service integration — Resend, Loops, etc.)
- Interview Readiness Index (aggregate data report — requires new API + public page)
- Campus Ambassador program
