---
name: carousel-script-generator
description: Generate viral carousel scripts (6-8 slides) for InterviewProof.ai using the Three C's hook framework and ABT storytelling method. Use this skill whenever the user asks to write carousel copy, draft carousel scripts, create slide-by-slide carousel text, plan carousel content, or write hooks and scripts for social media carousels. Also trigger when the user says things like "write me a carousel", "script a carousel", "draft carousel slides", "carousel copy for [topic]", "plan a carousel about [topic]", or wants to brainstorm carousel content before designing it. This skill generates the TEXT and COPY only — it does not produce visual carousels (use the TikTok or LinkedIn carousel generator skills for that). Think of this as the scriptwriting step that comes before visual design.
---

# Carousel Script Generator — InterviewProof.ai Edition

## Purpose

This skill generates viral-optimized carousel scripts — the slide-by-slide text content for social media carousels promoting **InterviewProof.ai**. Each script contains 6, 7, or 8 slides and follows a proven virality framework derived from the Three C's (Cliffhanger, Credibility, Completion) and the ABT (And, But, Therefore) storytelling method.

All carousel scripts are tailored for InterviewProof.ai's audience (college students and new grads 18-26 preparing for competitive interviews), credibility proof points, product features, and organic growth strategy. **Read `references/interviewproof-brand.md` before writing any script** to load the brand context, credibility stats, content pillars, and CTA templates.

The output is **text/copy only**. To turn scripts into visual carousels, the user can feed the output into the TikTok or LinkedIn carousel generator skills.

## When to Use

- User wants to write carousel content/copy before designing
- User asks for carousel scripts, outlines, or slide-by-slide text
- User wants to brainstorm carousel angles for a topic
- User says "write a carousel about [topic]"
- User wants to batch-create multiple carousel scripts
- User provides a topic, blog post, video transcript, or newsletter and wants carousel scripts derived from it

## Instructions

### Step 1: Determine the Topic and Angle

If the user provides a topic, identify the best carousel angle. If the topic is broad, suggest 2-3 angle options before proceeding.

**Angle types** (pick the one that fits the content best):

| Angle | Description | InterviewProof Example |
|-------|-------------|------------------------|
| Mistakes | "X mistakes that [cause problem]" | "5 resume mistakes that get you rejected before a human sees you" |
| Steps | "How to [achieve result] in X steps" | "How to prep for your Google interview in 7 days" |
| Myths | "X myths about [topic] debunked" | "4 interview prep myths that are wasting your time" |
| Lessons | "X lessons I learned from [experience]" | "I tested my resume against Amazon's SDE role — here's what I learned" |
| Secrets | "X things [experts] won't tell you about [topic]" | "5 things recruiters will never tell you about why you got rejected" |
| Comparison | "[Option A] vs [Option B]: the truth" | "LeetCode grinding vs knowing your actual gaps — which works?" |
| Framework | "The [name] framework for [result]" | "The 60-second diagnostic that replaces 3 months of blind prep" |
| Stats/Shock | "The shocking truth about [topic]" | "250 people applied. Only 4 got interviews. Here's why." |

**Also map each topic to an InterviewProof content pillar** from `references/interviewproof-brand.md` — this ensures carousels stay on-brand across batches.

### Step 2: Determine Slide Count

Choose 6, 7, or 8 slides based on content density:

- **6 slides**: Tight, punchy topics with 3-4 key points. Good for simple frameworks or comparisons.
- **7 slides**: The sweet spot for most topics. 4-5 content slides with room to breathe.
- **8 slides**: Content-rich topics with 5-6 distinct points. Use when each point needs its own slide.

Vary slide counts across batches so not every carousel feels identical.

### Step 3: Write the Script Using the Framework

Every carousel script follows this structure:

---

#### SLIDE 1 — The Hook (Cliffhanger)

This is the most important slide. It determines whether someone swipes or scrolls past.

**Rules:**
- Maximum 10-12 words for the main headline
- Must be polarizing, bold, or curiosity-inducing
- Use negative/pain hooks preferentially (the brain gravitates toward these)
- Include power words: never, biggest, secret, mistake, always, crazy, #1
- Add a subtitle (1 line) that teases the value or adds credibility

**Structure:**
```
HEADLINE: [Bold, polarizing hook — max 12 words]
SUBTITLE: [Credibility teaser or value promise — 1 sentence]
```

**Refer to** `references/viral-hooks.md` for proven hook templates, power words, and the **10 Viral Short-Form Hook Formulas** (high-performing TikTok/carousel patterns like "Is it even possible to ___", "I did X for 30 days", tier lists, "hear me out", etc.). Prioritize these formulas for TikTok carousels.
**Refer to** `references/interviewproof-brand.md` for the audience's emotional triggers (interview anxiety, ghosting, imposter syndrome, time pressure).

**The InterviewProof hook formula:** Create "oh no, that's me" → reveal hidden problem → imply fix exists → fix is fast ($9, 60 seconds).

**Examples (InterviewProof-tailored):**
- HEADLINE: "Your resume has 9 red flags. You know about 0 of them."
  SUBTITLE: "Here's what recruiters see that you don't"
- HEADLINE: "Stop grinding LeetCode — it's not why you're getting rejected"
  SUBTITLE: "The real reason most candidates fail (backed by 50+ recruiter rubrics)"
- HEADLINE: "I scored 43/100 for Google's SWE intern role"
  SUBTITLE: "An AI found 9 things I didn't even know were problems"
- HEADLINE: "This is what a Google recruiter actually writes about you"
  SUBTITLE: "After reading your resume for 7.4 seconds"

---

#### SLIDE 2 — The Credibility Bridge

This slide earns the viewer's trust and makes them believe the content is worth their time. It bridges the hook into the value.

**Rules:**
- Include specific numbers, results, timeframes, or sources
- **Pull credibility proof points from `references/interviewproof-brand.md`** — use InterviewProof's product stats, industry facts, or competitive positioning
- Keep it to 2-3 short sentences max
- This is the "why you should listen" slide
- Use the ABT "AND" — set the scene or establish shared context
- **Rotate credibility angles** across carousels — don't reuse the same stat every time

**InterviewProof credibility categories (pick one per carousel):**
1. **Product stats** — "87% of users improved in 7 days", "+14 point average improvement", "Built from 50+ real recruiter rubrics"
2. **Industry shock stats** — "Recruiters spend 7.4 seconds on your resume", "75% rejected before a human sees it", "250 applicants → 4 interviews"
3. **Competitive edge** — "$9 not $200/hour coaching", "60 seconds not 3 months of grinding", "Job-specific, not generic advice"
4. **Social proof / relatability** — Position as shared experience: "I ran my resume through an AI diagnostic and..."

**Structure:**
```
HEADING: [Short label — e.g., "Here's the thing" or "Why this matters"]
BODY: [2-3 sentences with InterviewProof-relevant credibility proof]
```

**Examples (InterviewProof-tailored):**
- "After analyzing 50+ real recruiter rubrics, one pattern is clear — most candidates get rejected for things they never even knew were problems. 87% who found and fixed their gaps improved in 7 days."
- "Recruiters spend 7.4 seconds on your resume. 75% of applications get rejected before a human even sees them. **But you can find out exactly why in 60 seconds.**"
- "I tested my resume against Google's SWE intern role. The AI found 9 rejection risks I had no idea about. Here's what I learned."

---

#### SLIDES 3 through N-1 — The Value Slides (ABT Body)

These are the meat of the carousel. Each slide = one distinct point, tip, mistake, or step.

**Rules:**
- ONE idea per slide — never cram two points into one slide
- Lead each slide with a bold heading (the key takeaway)
- Follow with 2-3 sentences of supporting explanation
- Use the ABT "BUT" on problem/conflict slides and "THEREFORE" on solution slides
- Write at a **6th-grade reading level** — no jargon, no complex vocabulary
- If you must use a technical term, explain it in plain language immediately
- Apply **staccato pacing**: alternate short sentences, medium sentences, and longer sentences to keep rhythm lively
- Use "you" language — speak directly to the reader
- Bold the single most important phrase on each slide

**Structure per slide:**
```
HEADING: [Key point in 3-7 words]
BODY: [2-3 sentences. One idea. Staccato pacing. Bold the takeaway.]
```

**Simplicity test:** Would someone's grandma understand this slide without any context? If not, simplify it.

**ABT flow across value slides:**
- Early value slides (3-4) = introduce problems/conflicts (the BUT)
- Later value slides (5-6+) = deliver solutions/resolutions (the THEREFORE)
- This creates natural tension → release across the carousel

---

#### LAST SLIDE — The CTA (Completion Payoff)

This slide wraps up and drives action. It's the "Completion" from the Three C's — the payoff.

**Rules:**
- Summarize the core lesson or pattern in one sentence
- Include a clear, specific call to action
- Use transitional/completion language: "this is exactly how", "now you know", "the pattern is clear"
- **Keep it organic, not salesy** — the product appears naturally as "the tool I used" or "this thing I found"
- **Pull CTA templates from `references/interviewproof-brand.md`** and rotate them across carousels

**InterviewProof CTA patterns (rotate these — never repeat the same one back-to-back):**
1. **Education-first:** Summarize the lesson → "Follow for more interview intel that actually works"
2. **Soft product reveal:** Summarize → "I found this out using an AI interview diagnostic. Link in bio if you want to try it."
3. **Urgency-driven:** "Your interview is coming. Find your rejection risks in 60 seconds → link in bio"
4. **Save/share:** "Save this for interview season. You'll thank yourself later."
5. **Social proof:** "This is how I went from 52 to 73 in one week. Free preview, no credit card → link in bio"

**Structure:**
```
HEADING: [Summary of the pattern/lesson]
BODY: [1-2 sentences reinforcing the value]
CTA: [Soft, organic call to action from the templates above]
```

---

### Step 4: Quality Check

Before presenting the script, verify:

- [ ] Slide count is 6, 7, or 8
- [ ] Hook slide is polarizing and under 12 words
- [ ] Credibility slide uses InterviewProof stats, industry facts, or competitive positioning
- [ ] Each value slide has exactly ONE idea
- [ ] Language is at 6th-grade reading level — no unexplained jargon
- [ ] ABT tension (BUT/conflict) appears in at least one value slide
- [ ] Staccato pacing is used — sentences vary in length
- [ ] CTA slide uses a soft, organic CTA (not a hard sell) from the InterviewProof CTA templates
- [ ] The "grandma test" passes — each slide makes sense to a general audience
- [ ] Bold highlights mark the key takeaway on each content slide
- [ ] The product mention feels natural — "the tool I used" not "buy this product"
- [ ] Content maps to one of the 6 InterviewProof content pillars

### Step 5: Present the Script

Output the script in this format:

```
CAROUSEL SCRIPT: [Title]
Angle: [Angle type from Step 1]
Content Pillar: [InterviewProof pillar from brand reference]
Slides: [6/7/8]
Platform: [TikTok / LinkedIn / Both — based on user context]

---

SLIDE 1 (HOOK)
Headline: [...]
Subtitle: [...]

SLIDE 2 (CREDIBILITY)
Heading: [...]
Body: [...]

SLIDE 3 (VALUE)
Heading: [...]
Body: [...]

[...continue for all slides...]

SLIDE [N] (CTA)
Heading: [...]
Body: [...]
CTA: [...]
```

## Batch Mode

If the user asks for multiple carousel scripts at once (e.g., "give me 5 carousels"), generate each as a complete script following the full framework. Vary:
- Slide counts (mix of 6, 7, and 8)
- Angle types (don't repeat the same angle)
- Hook styles (alternate between negative, curiosity, contrarian, results hooks)
- Content pillars (spread across all 6 InterviewProof pillars)
- Credibility stats (never reuse the same stat in back-to-back carousels)
- CTA templates (rotate through all 5 patterns)

## Integration with Visual Carousel Skills

After generating scripts, remind the user they can turn any script into a visual carousel:
- For TikTok: "Want me to turn this into a TikTok carousel? Just say the word."
- For LinkedIn: "Want me to turn this into a LinkedIn carousel? Just say the word."

The script output maps directly to the slide structure those skills expect.

## Reference Files

- `references/viral-hooks.md` — Proven hook templates, power words, and hook formatting rules. Read this when crafting Slide 1.
- `references/abt-framework.md` — ABT storytelling patterns, tension/resolution words, and carousel-specific ABT examples. Read this when structuring the value slides.
- `references/interviewproof-brand.md` — **READ THIS FIRST for every script.** Contains InterviewProof's audience profile, credibility arsenal (product stats + industry facts), 13 product features as content angles, 6 content pillars, hook formula, CTA templates, competitive positioning, and tone/voice guidelines.

## Key Principles (Always Follow)

1. **Polarize on Slide 1.** Safe hooks don't stop thumbs. Be bold.
2. **Prove it on Slide 2.** Without credibility, bold claims feel empty. Use InterviewProof's real stats.
3. **One idea per slide.** Cramming kills comprehension and saves.
4. **6th-grade language.** Simplicity scales. Complexity alienates. The audience is 18-26 year olds, not PhDs.
5. **Staccato rhythm.** Short. Then medium with more detail. Then a longer sentence that ties the whole thing together and keeps the reader engaged.
6. **ABT tension.** Every carousel needs a "but" — a conflict or problem that makes the solution feel earned.
7. **End with action.** Soft, organic CTA. The product appears naturally, never as a hard sell.
8. **Education first, product second.** The carousel should feel like insider knowledge from a friend, not an ad. InterviewProof appears as the natural resolution to the problem the carousel educates about.
