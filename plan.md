# Diagnostic Page UI/UX Redesign — Comprehensive Implementation Plan

## Design Philosophy

Transform the diagnostic page from a **long scrollable report** into a **professional intelligence dashboard** — inspired by Chatbase's clean tab-based navigation, modern SaaS analytics dashboards, and FAANG-level polish. The experience should feel like opening a Bloomberg terminal for interviews: data-rich, actionable, and delightful.

**Core Principles:**
- **Visual consistency with existing app** — The redesigned diagnostic page must feel like a natural extension of the landing page, dashboard, upload flow, and results preview. Same CSS variables, same font stack (Source Serif 4 headings, Source Sans 3 body, Source Code Pro mono), same indigo accent palette, same dark-first theming, same card styles, same glassmorphism usage, same spacing rhythm. No new design language — evolve the existing one. Reuse `globals.css` utility classes (`.card-warm`, `.card-hover`, `.strength-signal`, `.risk-signal`, `.section-label`, `.text-gradient`, `.glow-accent`, etc.) and existing UI primitives (`Card`, `GlassCard`, `Badge`, `MetricCard`, `Button`, `ProgressBar`, `Tabs`, etc.) wherever possible. The user should navigate from landing → upload → results → diagnostic with zero visual discontinuity.
- **Progressive disclosure** — Show the essential story first, details on demand
- **Dashboard + Tabs** — Hero overview dashboard at the top, tabbed deep-dive sections below
- **High performance + high polish** — CSS-driven animations, GPU-accelerated transitions, lazy-loaded tab content
- **Radial Fill + Counter** for the hero score with glow on completion
- **Staggered BlurFade** for card entrances within tabs
- **Draw-in on scroll** for all SVG charts (stroke-dasharray animations)
- **Skeleton screens** for all loading states

---

## 1. Page-Level Architecture Redesign

### Current: 13 sections in a single scroll with sidebar nav
### New: Hero Dashboard + 4 Tabbed Sections

```
┌─────────────────────────────────────────────────────┐
│  HEADER (existing)                                  │
├─────────────────────────────────────────────────────┤
│  REPORT TOOLBAR                                     │
│  Company Name · Job Title · Round Type              │
│  [Share] [Download PDF] [Rerun]                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │         HERO DASHBOARD (always visible)      │    │
│  │                                              │    │
│  │  ┌──────┐  ┌────────┐  ┌────────┐  ┌─────┐ │    │
│  │  │Score │  │Conv.   │  │Tech    │  │Hire │ │    │
│  │  │ 87   │  │Likely  │  │Fit     │  │Zone │ │    │
│  │  │/100  │  │72%     │  │High    │  │In   │ │    │
│  │  └──────┘  └────────┘  └────────┘  └─────┘ │    │
│  │                                              │    │
│  │  ┌─ Priority Action ──────────────────────┐  │    │
│  │  │ #1 risk + CTA                          │  │    │
│  │  └────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  TAB BAR                                     │    │
│  │  [Analysis] [Practice] [Strategy] [Insights] │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  TAB CONTENT (lazy-loaded)                   │    │
│  │  ... varies by active tab ...                │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  FOOTER (existing)                                  │
└─────────────────────────────────────────────────────┘
```

### Tab Grouping (13 sections → 4 tabs)

| Tab | Label | Contains (from original 13) | Icon |
|-----|-------|-----------------------------|------|
| 1 | **Analysis** | Signal Strength, Hire Zone, Competency Map, Red Flags, Strengths & Risks | BarChart3 |
| 2 | **Practice** | Questions, Execution Roadmap, Practice Intel | BookOpen |
| 3 | **Strategy** | Coaching, Priority Actions, Cognitive Map | Target |
| 4 | **Insights** | Recruiter View, Executive Summary (detailed), Trajectory | Eye |

**Rationale:** Groups by user intent — "How do I score?" → Analysis, "What do I practice?" → Practice, "What's my strategy?" → Strategy, "How do others see me?" → Insights.

---

## 2. Hero Dashboard (Always-Visible Top Section)

This replaces the current Executive Summary as the first thing users see. It's a compact, high-impact dashboard strip.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌────────────┐    ┌──────────────────────────────────┐ │
│  │            │    │  Metric Cards (3 across)         │ │
│  │   RADIAL   │    │ ┌──────┐ ┌──────┐ ┌──────┐     │ │
│  │   SCORE    │    │ │Conv. │ │Tech  │ │Hire  │     │ │
│  │    87      │    │ │Likl. │ │Fit   │ │Zone  │     │ │
│  │   /100     │    │ │ 72%  │ │High  │ │ In   │     │ │
│  │            │    │ └──────┘ └──────┘ └──────┘     │ │
│  │ ● Low Risk │    │                                  │ │
│  └────────────┘    │  Risk Snapshot                   │ │
│                    │  "3 critical risks identified"    │ │
│                    │  ▸ View in Analysis tab           │ │
│                    └──────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ #1 Priority: "Strengthen system design examples     ││
│  │  with quantified impact metrics" → Go to Strategy   ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Components & Animations

| Element | Component | Animation |
|---------|-----------|-----------|
| Readiness Score | `RadialScoreIndicator` (radial mode, size xl) | SVG stroke fills clockwise 0→score (800ms ease-out), `NumberTicker` counts inside, brief glow pulse on completion |
| Risk Band Badge | `Badge` (variant mapped by RiskBand) | Fades in after score lands (200ms delay) |
| Metric Cards (3) | `MetricCard` with custom colored left border | Staggered `BlurFade` (delay 100ms, 160ms, 220ms) |
| Priority #1 Action | Custom card with `BorderBeam` effect | `BlurFade` with 300ms delay, beam animates continuously |
| Risk Snapshot | Compact inline with icon + count | `NumberTicker` for risk count |
| Prior Employment | Conditional `Badge` ("Prior: {company}") | Shimmer via `AnimatedShinyText` |

### Mobile Adaptation
- Score radial stacks above metric cards (full width)
- Metric cards become a horizontal scroll row (snap points)
- Priority action card is full-width below

---

## 3. Tab Navigation Bar

### Desktop
- Horizontal tab bar pinned below the hero dashboard
- **Sticky positioning** — sticks to top when hero scrolls out of view
- Each tab: icon + label + subtle count badge (e.g., "Red Flags (5)")
- Active tab: gradient background (indigo→purple), inactive: ghost style with hover
- Use existing `Tabs` component with enhanced styling
- Smooth `transition-all 200ms` on active indicator

### Mobile
- Same horizontal tab bar but scrollable (overflow-x-auto with snap)
- Icons only on mobile (labels hidden, shown on active tab only)
- No bottom navigation bar — keep it in the content area
- Tab bar becomes sticky at top of viewport

### Tab Switching Animation
- Content uses `BlurFade` with `key={activeTab}` to trigger re-animation
- Cards within each tab stagger with 60ms intervals
- Tab content is **lazy-loaded** — only render when tab is first activated, then keep mounted (avoid re-renders)

---

## 4. Tab 1: Analysis

Contains: Signal Strength, Hire Zone, Competency Map, Red Flags, Strengths & Risks

### 4.1 Signal Strength (Score Breakdown)

**Current:** Collapsible cards showing 5 weighted categories with progress bars
**Redesigned:**

```
┌─────────────────────────────────────────────┐
│ Signal Strength                              │
│                                              │
│ ┌─────────────────────────────────────────┐  │
│ │ Hard Match          35%w    ████████░░ 82│  │
│ │ Evidence Depth      25%w    ██████░░░░ 65│  │
│ │ Round Readiness     20%w    █████████░ 91│  │
│ │ Clarity             10%w    ███████░░░ 74│  │
│ │ Company Proxy       10%w    ██████░░░░ 68│  │
│ └─────────────────────────────────────────┘  │
│                                              │
│ Each bar expandable → detail card            │
└─────────────────────────────────────────────┘
```

- **Component:** `Card` (default) wrapping 5 rows
- **Each row:** Label + weight badge (`Badge` mono) + `ProgressBar` (animated, auto-color) + score (`NumberTicker`)
- **Expand:** Click row → `Collapsible` opens with sub-scores, evidence quotes, and contributing factors
- **Animation:** Progress bars draw-in staggered (100ms between each), numbers count up simultaneously
- **Mobile:** Same layout, full-width, larger touch targets on expand

### 4.2 Hire Zone

**Current:** Basic SVG gauge with bands
**Redesigned:**

```
┌───────────────────────────────────────────┐
│ Hire Zone                                  │
│                                            │
│        Reject   Maybe   Likely   Strong    │
│        ░░░░░░░░░████████████░░░░░░░░░░    │
│                      ▲                     │
│                   You: 74                  │
│                                            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ Gap:     │ │ Gap:     │ │ Gap:     │   │
│ │ Tech -12 │ │ Comm +5  │ │ Lead -8  │   │
│ └──────────┘ └──────────┘ └──────────┘   │
└───────────────────────────────────────────┘
```

- **Gauge:** Horizontal bar with 4 color zones (red→orange→green→bright green)
- **Marker:** Animated pointer that slides from left to position (600ms spring animation)
- **Score label:** Appears after marker lands
- **Gap cards:** 3 `MetricCard` components with trend arrows showing category-level gaps
- **Animation:** Zone bar fades in, then marker slides to position with slight overshoot (spring physics)
- **Mobile:** Gauge full-width, gap cards stack vertically

### 4.3 Competency Map

**Current:** HTML table with domains, levels, targets, gaps
**Redesigned:** Card grid with visual indicators

```
┌────────────────────────────────────────────────┐
│ Competency Map                                  │
│                                                 │
│ ┌──────────────┐ ┌──────────────┐              │
│ │ System Design│ │ Algorithms   │              │
│ │              │ │              │              │
│ │ Level: ████░ │ │ Level: ███░░ │              │
│ │ Target: ████ │ │ Target: ████ │              │
│ │ Gap: -1 ▼    │ │ Gap: -2 ▼▼   │              │
│ └──────────────┘ └──────────────┘              │
│ ┌──────────────┐ ┌──────────────┐              │
│ │ Leadership   │ │ Communication│              │
│ │              │ │              │              │
│ │ Level: ████░ │ │ Level: █████ │              │
│ │ Target: ████ │ │ Target: ████ │              │
│ │ Gap: 0  ━    │ │ Gap: +1 ▲    │              │
│ └──────────────┘ └──────────────┘              │
└────────────────────────────────────────────────┘
```

- **Component:** 2-column grid of `Card` (elevated variant)
- **Each card:** Domain name, dual `ProgressBar` (current level vs target), gap indicator with trend icon
- **Color coding:** Gap > 0 = green border, Gap = 0 = neutral, Gap < 0 = orange/red border (use `strength-signal` / `risk-signal` utility classes)
- **Animation:** Staggered `BlurFade` on cards, progress bars draw-in
- **Mobile:** Single column stack

### 4.4 Red Flags

**Current:** Simple list of risks with badges
**Redesigned:**

```
┌────────────────────────────────────────────────┐
│ Red Flags (5)                     [Filter ▾]   │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ ● Critical                                │   │
│ │ "No quantified impact in system design    │   │
│ │  experience — recruiters need numbers"    │   │
│ │                                            │   │
│ │ Evidence: "Designed microservices arch..." │   │
│ │ Fix: Add metrics like "reduced latency    │   │
│ │      by 40%" → Go to Strategy             │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ ● High                                    │   │
│ │ ...                                        │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│  Showing 3 of 5  [Show all]                     │
└────────────────────────────────────────────────┘
```

- **Component:** `Card` (bordered variant) with left-border color coding by severity
- **Progressive disclosure:** Show top 3 by default, "Show all" expands
- **Severity filter:** Dropdown to filter by Critical/High/Medium/Low
- **Evidence:** Collapsible within each card, shows highlighted quote from resume/JD
- **Fix link:** Links to relevant Strategy tab section
- **Animation:** Staggered `BlurFade`, severity badge uses `Badge` component
- **Mobile:** Full-width cards, collapsible evidence section

### 4.5 Strengths & Risks Summary

**Current:** Score breakdown preview + top 4 risks
**Redesigned:** Two-column layout — Strengths (left) + Risks (right)

```
┌──────────────────────┬──────────────────────┐
│ ✓ Strengths          │ ✕ Risks              │
│                      │                      │
│ • Strong system...   │ • Missing quant...   │
│ • Clear communi...   │ • No leadership...   │
│ • Prior {company}... │ • Gap in algo...     │
│                      │                      │
│ [3 strengths]        │ [5 risks]            │
└──────────────────────┴──────────────────────┘
```

- **Component:** Two `Card` components side-by-side — left with green left-border (`strength-signal`), right with red left-border (`risk-signal`)
- **Items:** Compact list items, max 4 each, with "Show all" toggle
- **Animation:** Both cards fade in simultaneously, items stagger within each
- **Mobile:** Stack vertically (strengths above risks)

---

## 5. Tab 2: Practice

Contains: Questions, Execution Roadmap, Practice Intel

### 5.1 Interview Questions

**Current:** Accordion-style Q&A with localStorage answer persistence, 8 at a time with load-more
**Redesigned:**

```
┌────────────────────────────────────────────────┐
│ Practice Questions (24)        [Filter ▾]      │
│                                                 │
│ Progress: ████████░░░░░░ 8/24 answered          │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ Q1 · Behavioral                           │   │
│ │ "Tell me about a time you led a cross-    │   │
│ │  functional team through a technical      │   │
│ │  decision..."                              │   │
│ │                                            │   │
│ │ ┌─ Your Answer ─────────────────────────┐ │   │
│ │ │ [textarea with saved draft]            │ │   │
│ │ └───────────────────────────────────────┘ │   │
│ │                                            │   │
│ │ [Get AI Feedback] [Show Best Answer]       │   │
│ │                                            │   │
│ │ AI Score: ████████░░ 78/100               │   │
│ │ Feedback: "Good structure, but add..."    │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ Q2 · Technical                 [Answered ✓]│   │
│ │ "Design a rate limiter for..."            │   │
│ │ ▸ Expand to see answer & feedback         │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ [Load 8 more questions]                         │
└────────────────────────────────────────────────┘
```

- **Component:** `Accordion` (Radix-based) for each question
- **Progress bar:** `ProgressBar` (accent variant) showing answered/total with `NumberTicker`
- **Question card:** `Card` (default) with category `Badge`, expand/collapse
- **Answer area:** `Textarea` with character counter, auto-save indicator
- **AI Feedback:** Loads via API, score shown as `ProgressBar`, feedback as styled text
- **Best Answer:** Collapsible section with highlighted comparison
- **Filter:** By category (Behavioral/Technical/System Design/etc.) using dropdown
- **Animation:** Questions stagger in with `BlurFade`, feedback slides down on load
- **Mobile:** Full-width, textarea takes full width, buttons stack

### 5.2 Execution Roadmap (Study Plan)

**Current:** Day-by-day checkboxes
**Redesigned:** Timeline with progress tracking

```
┌────────────────────────────────────────────────┐
│ Execution Roadmap                               │
│                                                 │
│ Overall: ██████░░░░ 60% complete                │
│                                                 │
│ Day 1 ─────────────────────── ✓ Complete        │
│ │ ☑ Review system design fundamentals           │
│ │ ☑ Practice 2 behavioral questions             │
│ │ ☑ Read company engineering blog               │
│                                                 │
│ Day 2 ─────────────────────── ◐ In Progress     │
│ │ ☑ Mock interview with peer                    │
│ │ ☐ Prepare STAR stories for leadership         │
│ │ ☐ Review rate limiting architectures          │
│                                                 │
│ Day 3 ─────────────────────── ○ Upcoming        │
│ │ ☐ Full mock technical round                   │
│ │ ☐ Review feedback, iterate                    │
└────────────────────────────────────────────────┘
```

- **Component:** Custom timeline with vertical line + day markers
- **Day header:** Bold label + status badge (Complete/In Progress/Upcoming)
- **Tasks:** Checkbox list with strikethrough on complete, persistent to localStorage
- **Overall progress:** `ProgressBar` (accent variant with gradient) + percentage `NumberTicker`
- **Day collapse:** Completed days auto-collapse, current day expanded
- **Personalized plan:** If `personalizedStudyPlan` exists, render it in a separate `GlassCard` above the timeline
- **Animation:** Timeline draws in vertically (border-left animates height), day cards stagger
- **Mobile:** Same layout, full-width, larger checkboxes (44px touch targets)

### 5.3 Practice Intelligence

**Current:** Multiple metric displays for sync, prescriptions, pressure, momentum
**Redesigned:**

```
┌────────────────────────────────────────────────┐
│ Practice Intelligence                           │
│                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ Sync     │ │ Pressure │ │ Momentum │        │
│ │ Score    │ │ Index    │ │          │        │
│ │  82%     │ │  High    │ │  Rising  │        │
│ │ ████░    │ │          │ │   ↗      │        │
│ └──────────┘ └──────────┘ └──────────┘        │
│                                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ Prescriptions                              │   │
│ │ • Focus on system design depth            │   │
│ │ • Practice under time pressure            │   │
│ │ • Record and review mock answers          │   │
│ └───────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘
```

- **Metric cards:** 3x `MetricCard` in a row with trend indicators
- **Sync Score:** `ProgressBar` + `NumberTicker`
- **Pressure Index:** `Badge` (critical/high/medium/low variant mapped)
- **Momentum:** Trend arrow (↗ rising, → stable, ↘ declining) with color
- **Prescriptions:** `Card` (bordered) with ordered list
- **Animation:** Metrics count up via `NumberTicker`, cards stagger via `BlurFade`
- **Mobile:** Metric cards in horizontal scroll row, prescriptions full-width below

---

## 6. Tab 3: Strategy

Contains: Coaching, Priority Actions, Cognitive Map

### 6.1 Priority Actions

**Current:** Numbered action cards
**Redesigned:**

```
┌────────────────────────────────────────────────┐
│ Priority Actions                                │
│                                                 │
│ ┌─ #1 ─────────────────────────────────────┐   │
│ │ Strengthen system design examples with    │   │
│ │ quantified impact metrics                 │   │
│ │                                            │   │
│ │ Impact: ●●●●○  Effort: ●●○○○             │   │
│ │ Category: Resume · Affects: Hard Match    │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ ┌─ #2 ─────────────────────────────────────┐   │
│ │ Prepare 3 STAR stories for leadership     │   │
│ │ questions                                  │   │
│ │                                            │   │
│ │ Impact: ●●●○○  Effort: ●●●○○             │   │
│ │ Category: Behavioral · Affects: Clarity   │   │
│ └───────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘
```

- **Component:** `Card` (default) with numbered badge, the #1 card gets `BorderBeam` effect
- **Impact/Effort:** Dot indicators (filled/unfilled circles) for quick visual scanning
- **Category badge:** `Badge` component for the action category
- **Affects:** Links to which scoring dimension is impacted
- **Animation:** Staggered `BlurFade` with 80ms intervals
- **Mobile:** Full-width cards, same layout

### 6.2 Coaching Hub

**Current:** Archetype profile, trajectory chart, round coaching, tips all in one component
**Redesigned:** Sub-tabbed layout within the Strategy tab

```
┌────────────────────────────────────────────────┐
│ Coaching Hub                                    │
│                                                 │
│ [Profile] [Round Prep] [Trajectory] [Tips]      │
│                                                 │
│ ┌─── Profile ──────────────────────────────┐    │
│ │                                           │    │
│ │ Your Archetype: "The Technical Leader"    │    │
│ │                                           │    │
│ │ You combine deep technical expertise      │    │
│ │ with emerging leadership skills...        │    │
│ │                                           │    │
│ │ Strengths: Technical depth, system        │    │
│ │ thinking, clear communication             │    │
│ │                                           │    │
│ │ Growth Areas: Quantifying impact,         │    │
│ │ executive presence, strategic vision      │    │
│ └───────────────────────────────────────────┘    │
│                                                 │
│ ┌─── Company Context ──────────────────────┐    │
│ │ Difficulty: FAANG+ (1.3x multiplier)     │    │
│ │ Focus: System design emphasis, bar raiser │    │
│ └───────────────────────────────────────────┘    │
└────────────────────────────────────────────────┘
```

- **Sub-tabs:** Nested `Tabs` component (pill style) for Profile / Round Prep / Trajectory / Tips
- **Archetype card:** `GlassCard` with archetype name as heading, description, strengths/growth areas as lists
- **Round Prep:** Per-round `Collapsible` panels with specific coaching advice
- **Trajectory chart:** SVG line chart with draw-in animation, shows where you are vs. target over time
- **Tips:** Numbered cards with `Accordion` for each tip
- **Company context:** `Card` (elevated) with difficulty `Badge` and adjustment note
- **Animation:** Sub-tab content uses `BlurFade`, trajectory chart draws in on view
- **Mobile:** Sub-tabs become horizontal scroll, full-width cards

### 6.3 Cognitive Map

**Current:** Pentagon radar chart with 5 dimensions
**Redesigned:**

```
┌────────────────────────────────────────────────┐
│ Cognitive Risk Map                              │
│                                                 │
│              Technical                          │
│                 ▲                                │
│                / \                               │
│               /   \                              │
│    Problem   /     \  Communication              │
│    Solving  ●───────●                            │
│              \     /                             │
│               \   /                              │
│                \ /                               │
│     Adapt.  ────●──── Leadership                 │
│                                                 │
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐       │
│ │Tech   │ │Problem│ │Comms  │ │Leader │       │
│ │  85   │ │  72   │ │  78   │ │  65   │       │
│ │ ████░ │ │ ███░░ │ │ ███░░ │ │ ██░░░ │       │
│ └───────┘ └───────┘ └───────┘ └───────┘       │
└────────────────────────────────────────────────┘
```

- **Radar chart:** SVG pentagon with animated polygon fill (morphs from center point outward, 800ms)
- **Grid lines:** Subtle concentric pentagons for scale reference
- **Dimension cards:** Row of compact `MetricCard` components below the radar with `ProgressBar` + `NumberTicker`
- **Color:** Polygon fill uses gradient (indigo→purple) with 20% opacity, stroke solid
- **Hover:** Highlight dimension on radar when hovering corresponding card (and vice versa)
- **Animation:** Grid draws in first (200ms), then polygon morphs from center (800ms), then dimension cards stagger (100ms each)
- **Mobile:** Radar chart scales to viewport width, dimension cards become 2-column grid

---

## 7. Tab 4: Insights

Contains: Recruiter View, Executive Summary (detailed), Trajectory

### 7.1 Recruiter View

**Current:** First impression, red flags, hidden strengths, screen time sections
**Redesigned:**

```
┌────────────────────────────────────────────────┐
│ Recruiter View                                  │
│ "How a recruiter sees your application"         │
│                                                 │
│ ┌──────────────────────────────────────────┐    │
│ │ First Impression                          │    │
│ │ ⏱ Screen Time: ~45 seconds               │    │
│ │                                            │    │
│ │ "Strong technical background with clear   │    │
│ │  progression, but missing quantified      │    │
│ │  impact data that recruiters scan for"    │    │
│ └──────────────────────────────────────────┘    │
│                                                 │
│ ┌──────────────┐    ┌──────────────┐           │
│ │ Red Flags    │    │ Hidden       │           │
│ │ Recruiter    │    │ Strengths    │           │
│ │ Sees (3)     │    │ Missed (4)   │           │
│ │              │    │              │           │
│ │ • No impact  │    │ • Cross-func │           │
│ │ • Gap in...  │    │ • Prior co.  │           │
│ │ • Missing... │    │ • Patent...  │           │
│ └──────────────┘    └──────────────┘           │
└────────────────────────────────────────────────┘
```

- **First Impression:** `GlassCard` with the recruiter's perspective quote, screen time as `Badge` (mono)
- **Two columns:** Red Flags (left, `risk-signal` border) + Hidden Strengths (right, `strength-signal` border)
- **Screen time:** Prominent metric with clock icon
- **Animation:** First impression card fades in first, then two columns stagger
- **Mobile:** Stack vertically — first impression, then flags, then strengths

### 7.2 Executive Summary (Detailed)

This is the expanded version of the hero dashboard — full evidence context, all scores, detailed breakdown.

- **Component:** Multiple `Card` sections with:
  - Full score breakdown table
  - Evidence context quotes in `Collapsible` panels
  - Prior employment signal details
  - Score version and methodology note
- **This is for power users** who want to see all the raw data
- **Animation:** Standard `BlurFade` stagger

---

## 8. Navigation & Chrome

### 8.1 Report Toolbar (Sticky)

```
┌─────────────────────────────────────────────────────┐
│ Google · Senior SWE · Technical Round               │
│                                        [↗] [⬇] [↻] │
└─────────────────────────────────────────────────────┘
```

- Sits between Header and Hero Dashboard
- Shows company + job title + round type
- Action buttons: Share, Download PDF, Rerun (if available)
- **Sticky on scroll** — stays visible when scrolling past hero
- Uses `GlassCard` styling with backdrop blur for floating effect
- Delta view (rerun comparison) renders as a `Dialog` modal instead of inline

### 8.2 Tab Bar (Sticky below toolbar when scrolled)

```
┌─────────────────────────────────────────────────────┐
│  📊 Analysis    📖 Practice    🎯 Strategy    👁 Insights│
└─────────────────────────────────────────────────────┘
```

- Uses existing `Tabs` component with enhanced styling
- Active tab: `gradient-accent` background, `glow-accent` shadow
- Inactive tabs: ghost style with count badges
- Count badges show: Risk count (Analysis), Question count (Practice), Action count (Strategy), section count (Insights)
- Becomes sticky when it reaches top of viewport during scroll
- **Mobile:** Horizontally scrollable with overflow-x-auto, snap-x

### 8.3 Mobile Navigation

- **No floating button** — remove the current mobile FAB
- Tab bar is always visible and scrollable
- Each tab's content scrolls naturally
- Bottom safe area padding for iOS
- Pull-to-refresh gesture triggers data reload

---

## 9. Visual Design Language

### 9.1 Card Hierarchy

| Level | Component | Usage | Style |
|-------|-----------|-------|-------|
| **Primary** | `GlassCard` (elevated) | Hero score, first impression, archetype | Glass blur + accent border + glow |
| **Secondary** | `Card` (default) | Section containers, question cards, risk cards | Standard bg-card + border |
| **Tertiary** | `Card` (elevated) | Metric cards, gap cards, sub-items | bg-elevated, no visible border |
| **Interactive** | `Card` + `BorderBeam` | #1 priority action, highlighted items | Animated border beam effect |
| **Expandable** | `Collapsible` or `Accordion` | Evidence details, Q&A, day tasks | Smooth height animation |

### 9.2 Color System for Severity/Status

| State | Border Color | Badge Variant | Text Color |
|-------|-------------|---------------|------------|
| Critical | `--color-danger` | `critical` | red |
| High Risk | `--color-danger` (lighter) | `high` | orange-red |
| Medium Risk | `--color-warning` | `medium` | yellow |
| Low Risk | `--color-success` | `low` | green |
| Strength | `--color-success` | `success` | green |
| Neutral | `--border-default` | `default` | muted |
| Accent | `--accent-primary` | `accent` | indigo |

### 9.3 Spacing Rhythm

```
Between sections within a tab:  space-y-8 (32px)
Between cards within a section:  space-y-4 (16px)
Card internal padding:           p-6 (24px)
Tab content padding:             pt-6 (24px from tab bar)
Hero dashboard padding:          p-8 (32px)
Metric card grid gap:            gap-4 (16px)
```

### 9.4 Typography Hierarchy

| Element | Font | Size | Weight | Tracking |
|---------|------|------|--------|----------|
| Page title | Source Serif 4 | text-2xl | bold | tight |
| Tab section title | Source Serif 4 | text-xl | semibold | tight |
| Sub-section title | Source Sans 3 | text-lg | semibold | normal |
| Metric value | Source Code Pro | text-3xl | bold | tight |
| Metric label | Source Sans 3 | text-sm | medium | normal |
| Body text | Source Sans 3 | text-sm | normal | normal |
| Badge/Tag | Source Code Pro | text-xs | medium | tight |
| Muted caption | Source Sans 3 | text-xs | normal | normal |

### 9.5 Glassmorphism Usage (Selective)

Only use glassmorphism for:
- Hero dashboard container
- Report toolbar (when sticky/floating)
- Archetype profile card
- First impression card
- **NOT** for regular content cards (keep those solid for readability)

---

## 10. Animations & Transitions Specification

### 10.1 Page Load Sequence

```
t=0ms:     Skeleton screens render (instant)
t=~500ms:  Data loaded, skeletons replaced:

t=0ms:     Hero dashboard container fades in (200ms)
t=100ms:   Radial score ring starts filling (800ms)
t=100ms:   NumberTicker starts counting (800ms, synced with ring)
t=900ms:   Score glow pulse (300ms)
t=200ms:   Risk band badge fades in
t=300ms:   Metric card 1 BlurFade
t=360ms:   Metric card 2 BlurFade
t=420ms:   Metric card 3 BlurFade
t=500ms:   Priority action card BlurFade + BorderBeam starts
t=700ms:   Tab bar appears (fade-in)
t=800ms:   First tab content begins stagger
```

### 10.2 Tab Switch

```
t=0ms:     Old content opacity → 0 (150ms)
t=150ms:   New content starts rendering
t=200ms:   First card BlurFade (y: 12px, blur: 4px, 400ms)
t=260ms:   Second card BlurFade
t=320ms:   Third card BlurFade
...        60ms stagger per card
```

### 10.3 Chart Draw-In (IntersectionObserver triggered)

**Hire Zone Gauge:**
```
t=0ms:     Background bar fades in (200ms)
t=200ms:   Marker slides from left to position (600ms, spring)
t=800ms:   Score label fades in
```

**Cognitive Radar:**
```
t=0ms:     Grid pentagons draw in (stroke-dasharray, 200ms)
t=200ms:   Data polygon morphs from center (800ms, ease-out)
t=1000ms:  Dimension labels fade in
```

**Progress Bars (all):**
```
t=0ms:     Bar width animates from 0% → value% (700ms ease-out)
t=0ms:     Number counts from 0 → value (700ms, NumberTicker)
```

### 10.4 Micro-interactions

- **Card hover:** `translateY(-1px)` + subtle border-accent transition (150ms)
- **Button press:** `scale(0.98)` feedback (100ms)
- **Checkbox check:** Brief scale bounce (1.0 → 1.15 → 1.0, 200ms)
- **Accordion expand:** Smooth height animation via `grid-template-rows: 0fr → 1fr` (300ms)
- **Badge appear:** Scale from 0.8 → 1.0 with opacity (200ms)
- **Tooltip:** Fade + slight Y offset (150ms)

### 10.5 Performance Strategy

- **All entrance animations:** Use CSS `@keyframes` or `motion` with `will-change: transform, opacity`
- **SVG animations:** Use `stroke-dasharray` + `stroke-dashoffset` (GPU-composited)
- **NumberTicker:** Already uses `useSyncExternalStore` — no re-renders
- **Lazy tab content:** Use `{activeTab === 'analysis' && <AnalysisTab />}` pattern, but keep mounted after first render with `{hasBeenActive.analysis && <AnalysisTab hidden={activeTab !== 'analysis'} />}`
- **IntersectionObserver:** One observer per tab for chart animations, disconnect after triggered
- **No layout shifts:** All skeleton placeholders match final content dimensions
- **Reduced motion:** Respect `prefers-reduced-motion` — skip all animations, show final state

---

## 11. New Components to Build

### 11.1 From Scratch

| Component | Purpose | Location |
|-----------|---------|----------|
| `DiagnosticDashboard` | Hero dashboard with score + metrics + priority CTA | `src/components/diagnostic/DiagnosticDashboard.tsx` |
| `DiagnosticTabs` | Tab container with lazy-loading + sticky behavior | `src/components/diagnostic/DiagnosticTabs.tsx` |
| `AnalysisTab` | Analysis tab content wrapper | `src/components/diagnostic/tabs/AnalysisTab.tsx` |
| `PracticeTab` | Practice tab content wrapper | `src/components/diagnostic/tabs/PracticeTab.tsx` |
| `StrategyTab` | Strategy tab content wrapper | `src/components/diagnostic/tabs/StrategyTab.tsx` |
| `InsightsTab` | Insights tab content wrapper | `src/components/diagnostic/tabs/InsightsTab.tsx` |
| `ReportToolbar` | Sticky toolbar with actions | `src/components/diagnostic/ReportToolbar.tsx` |
| `HorizontalGauge` | Hire zone horizontal bar | `src/components/diagnostic/HireZoneGauge.tsx` |
| `CompetencyCard` | Single competency domain card | `src/components/diagnostic/CompetencyCard.tsx` |
| `TimelineRoadmap` | Timeline-based study plan | `src/components/diagnostic/TimelineRoadmap.tsx` |
| `DiagnosticSkeleton` | Full-page skeleton loading state | `src/components/diagnostic/DiagnosticSkeleton.tsx` |

### 11.2 From shadcn/ui (Install via MCP)

| Component | Usage |
|-----------|-------|
| `Separator` | Visual dividers between sections |
| `Select` | Filter dropdowns (risk severity, question category) |
| `DropdownMenu` | More actions menu on toolbar |
| `ScrollArea` | Smooth scrollable regions within tabs |
| `Progress` | Alternative to custom ProgressBar for consistency |
| `Sheet` | Mobile-friendly slide-up panels if needed |

### 11.3 From Magic UI (Install via MCP)

| Component | Usage |
|-----------|-------|
| `AnimatedCircularProgressBar` | Enhanced version of radial score (if richer than current RadialScoreIndicator) |
| `ShimmerButton` | For primary CTAs (if desired) |
| `Marquee` | Possibly for scrolling insights ticker (optional) |

### 11.4 Custom Hooks

| Hook | Purpose |
|------|---------|
| `useInView` | IntersectionObserver hook for chart draw-in triggers |
| `useLazyTab` | Track which tabs have been activated for lazy-loading |
| `useStickyHeader` | Detect when toolbar/tab bar should become sticky |

---

## 12. Mobile Experience

### 12.1 Breakpoint Strategy

```
< 640px (mobile):
  - Single column for everything
  - Tab bar: icons + abbreviated labels, scroll-x
  - Metric cards: horizontal scroll row with snap
  - Charts: scale to full viewport width
  - Cards: full-width, no grid

640px–1024px (tablet):
  - Two-column grids where applicable
  - Tab bar: full labels
  - Hero dashboard: 2-column (score left, metrics right)

> 1024px (desktop):
  - Full layout as designed
  - Max-width container (max-w-5xl or max-w-6xl)
```

### 12.2 Mobile-Specific Patterns

- **Horizontal scroll rows** for metric cards (scroll-snap-type: x mandatory)
- **Touch targets:** Minimum 44px height for all interactive elements
- **Collapsible sections:** All sub-sections within tabs are collapsible on mobile
- **Reduced chart size:** Radar scales to 280px diameter, gauge to full width
- **Bottom safe area:** `pb-safe` padding for iOS home indicator
- **No hover states:** Replace hover effects with active/pressed states on mobile

### 12.3 Mobile Tab Interaction

```
┌─────────────────────────────┐
│ [📊] [📖 Practice] [🎯] [👁] │  ← scrollable, active shows label
├─────────────────────────────┤
│                             │
│  [Tab content, full width]  │
│                             │
└─────────────────────────────┘
```

---

## 13. Implementation Order

### Phase 1: Foundation (2-3 days)
1. Create `DiagnosticSkeleton` component
2. Build `ReportToolbar` component
3. Build `DiagnosticDashboard` (hero section)
4. Set up `DiagnosticTabs` with lazy-loading infrastructure
5. Create the 4 tab wrapper components (empty shells)
6. Rewire `page.tsx` to use new architecture

### Phase 2: Analysis Tab (2-3 days)
7. Redesign `ScoreBreakdown` with animated progress bars
8. Redesign `HireZoneChart` → horizontal gauge with spring marker
9. Redesign `CompetencyHeatmap` → card grid with visual indicators
10. Redesign `RiskList` → progressive disclosure + severity filter
11. Redesign `StrengthsAndRisks` → two-column layout

### Phase 3: Practice Tab (1-2 days)
12. Redesign `InterviewQuestions` with progress bar, category filter
13. Redesign `StudyPlan` → timeline roadmap with progress tracking
14. Redesign `PracticeIntelligencePanel` with metric cards

### Phase 4: Strategy Tab (1-2 days)
15. Redesign `PriorityActions` with impact/effort indicators + BorderBeam
16. Redesign `CoachingHub` with sub-tabs
17. Redesign `CognitiveRadar` with animated polygon + dimension cards

### Phase 5: Insights Tab (1 day)
18. Redesign `RecruiterView` with glass card + two-column layout
19. Add detailed executive summary view

### Phase 6: Polish (1-2 days)
20. Add all IntersectionObserver-based chart animations
21. Implement staggered BlurFade for all card entrances
22. Add skeleton loading states per tab
23. Mobile responsive testing + fixes
24. Accessibility audit (focus states, ARIA labels, reduced motion)
25. Performance testing (Lighthouse, bundle size check)

---

## 14. Files to Modify

### Modified (existing files)
- `src/app/r/[id]/full/page.tsx` — Complete restructure to dashboard + tabs
- `src/components/diagnostic/ScoreBreakdown.tsx` — Animated progress bars
- `src/components/diagnostic/HireZoneChart.tsx` — Horizontal gauge redesign
- `src/components/diagnostic/CompetencyHeatmap.tsx` — Card grid redesign
- `src/components/diagnostic/InterviewQuestions.tsx` — Progress + filters
- `src/components/diagnostic/StudyPlan.tsx` — Timeline redesign
- `src/components/diagnostic/PracticeIntelligencePanel.tsx` — Metric cards
- `src/components/diagnostic/PriorityActions.tsx` — Impact/effort + BorderBeam
- `src/components/diagnostic/CoachingHub.tsx` — Sub-tabs
- `src/components/diagnostic/CognitiveRadar.tsx` — Animated polygon + cards
- `src/components/diagnostic/RecruiterView.tsx` — Glass card redesign
- `src/components/results/ExecutiveSummary.tsx` — Adapt for hero dashboard
- `src/components/results/RiskList.tsx` — Progressive disclosure + filter
- `src/components/results/StrengthsAndRisks.tsx` — Two-column layout
- `src/components/diagnostic/ReportSidebar.tsx` — Remove (replaced by tabs)
- `src/components/diagnostic/SectionHeader.tsx` — Simplify or remove

### New files
- `src/components/diagnostic/DiagnosticDashboard.tsx`
- `src/components/diagnostic/DiagnosticTabs.tsx`
- `src/components/diagnostic/DiagnosticSkeleton.tsx`
- `src/components/diagnostic/ReportToolbar.tsx`
- `src/components/diagnostic/tabs/AnalysisTab.tsx`
- `src/components/diagnostic/tabs/PracticeTab.tsx`
- `src/components/diagnostic/tabs/StrategyTab.tsx`
- `src/components/diagnostic/tabs/InsightsTab.tsx`
- `src/components/diagnostic/CompetencyCard.tsx`
- `src/components/diagnostic/TimelineRoadmap.tsx`
- `src/components/diagnostic/HireZoneGauge.tsx`
- `src/hooks/useInView.ts`
- `src/hooks/useLazyTab.ts`
- `src/hooks/useStickyHeader.ts`

### Delete
- `src/components/diagnostic/ReportSidebar.tsx` (replaced by tabs)
- `src/hooks/useActiveSection.ts` (no longer needed with tabs)
