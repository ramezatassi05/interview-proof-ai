// ============================================
// Focus Area Candidate Pool & Selection Engine
// Deterministic — no LLM, no API calls
// ============================================

import type {
  CareerStage,
  TargetDomain,
  OnboardingPrepUrgency,
  FocusAreaItem,
  InterviewExperience,
  TargetCompanyTier,
} from '@/types';
import type { ResumeSignals } from './resume-signals';

// ── Selection Context ──────────────────────────────────────────

export interface SelectionContext {
  careerStage: CareerStage;
  targetDomains: TargetDomain[];
  targetRoles: string[];
  yearsExperience: number | null;
  prepUrgency: OnboardingPrepUrgency | null;
  biggestConcern: string;
  interviewExperience: InterviewExperience | null;
  targetCompanyTier: TargetCompanyTier | null;
  resumeSignals: ResumeSignals | null;
  benchmarkDomainWeights: Record<string, number> | null;
  // Derived
  concernCategory: string | null;
  roleSeniority: string | null;
  roleSpecialization: string | null;
}

// ── Concern Keyword Mapping ────────────────────────────────────

const CONCERN_KEYWORDS: Record<string, string[]> = {
  algorithms: ['leetcode', 'algorithm', 'coding', 'data structure', 'whiteboard', 'dsa'],
  system_design: ['system design', 'architecture', 'scale', 'design round'],
  behavioral: ['star', 'behavioral', 'stories', 'soft skill', 'tell me about'],
  confidence: ['anxiety', 'nervous', 'confident', 'imposter', 'freeze', 'panic', 'blank'],
  career_narrative: ['explain', 'switch', 'pivot', 'gap', 'career change', 'why'],
  negotiation: ['salary', 'negotiat', 'offer', 'compensation', 'equity', 'package'],
  technical_depth: ['depth', 'deep', 'expert', 'advanced', 'senior-level'],
  standing_out: ['stand out', 'top company', 'faang', 'competitive', 'google', 'meta', 'amazon'],
  no_experience: ['no experience', 'first interview', 'never interviewed', 'no internship'],
  communication: ['communicat', 'articulate', 'explain', 'thought process', 'clarity'],
};

function detectConcernCategory(concern: string): string | null {
  if (!concern.trim()) return null;
  const lower = concern.toLowerCase();
  for (const [category, keywords] of Object.entries(CONCERN_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return category;
    }
  }
  return null;
}

// ── Role Parsing ───────────────────────────────────────────────

function parseRoleSeniority(role: string): string | null {
  const lower = role.toLowerCase();
  if (/\b(intern|internship)\b/.test(lower)) return 'intern';
  if (/\b(junior|jr\.?|entry[- ]level)\b/.test(lower)) return 'junior';
  if (/\b(senior|sr\.?)\b/.test(lower)) return 'senior';
  if (/\b(staff|principal)\b/.test(lower)) return 'staff';
  if (/\b(lead|manager|director|vp|head of|chief)\b/.test(lower)) return 'lead';
  return null;
}

function parseRoleSpecialization(role: string): string | null {
  const lower = role.toLowerCase();
  if (/\b(frontend|front[- ]end|ui|react|vue|angular)\b/.test(lower)) return 'frontend';
  if (/\b(backend|back[- ]end|server|api|infrastructure|platform)\b/.test(lower)) return 'backend';
  if (/\b(full[- ]?stack)\b/.test(lower)) return 'fullstack';
  if (/\b(mobile|ios|android|react native|flutter)\b/.test(lower)) return 'mobile';
  if (/\b(ml|machine learning|ai|data scientist)\b/.test(lower)) return 'ml';
  if (/\b(data analyst|analytics|bi|business intelligence)\b/.test(lower)) return 'data_analytics';
  if (/\b(devops|sre|site reliability|cloud|infrastructure)\b/.test(lower)) return 'infra';
  if (/\b(security|cybersecurity|appsec)\b/.test(lower)) return 'security';
  return null;
}

// ── Focus Area Candidate Definition ────────────────────────────

interface FocusAreaCandidate {
  id: string;
  title: string;
  defaultDescription: string;
  defaultReason: string;
  eligibility: {
    stages: CareerStage[];
    domains: TargetDomain[];
    minYears?: number;
    maxYears?: number;
  };
  baseWeight: number;
  boosts: Array<{
    signal: string;
    condition: (ctx: SelectionContext) => boolean;
    weight: number;
  }>;
  descriptionVariants?: Record<string, (ctx: SelectionContext) => string>;
  reasonVariants?: Record<string, (ctx: SelectionContext) => string>;
}

// ── Template Helpers ───────────────────────────────────────────

const DOMAIN_LABELS: Record<TargetDomain, string> = {
  swe: 'Software Engineering',
  ds: 'Data Science',
  design: 'Design',
  pm: 'Product Management',
  security: 'Cybersecurity',
  cloud: 'Cloud & DevOps',
  marketing: 'Marketing',
  business: 'Business & Consulting',
  general: 'tech',
};

function roleOrDomain(ctx: SelectionContext): string {
  if (ctx.targetRoles.length > 0) return ctx.targetRoles.join(' & ');
  return ctx.targetDomains.map((d) => DOMAIN_LABELS[d]).join(' & ') || 'tech';
}

function isBenchmarkTopDomain(ctx: SelectionContext, ...domains: string[]): boolean {
  if (!ctx.benchmarkDomainWeights) return false;
  const entries = Object.entries(ctx.benchmarkDomainWeights);
  if (entries.length === 0) return false;
  const topDomain = entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  return domains.includes(topDomain);
}

// ── The Candidate Pool ─────────────────────────────────────────

const ALL_STAGES: CareerStage[] = [
  'student',
  'new_grad',
  'career_changer',
  'experienced_professional',
];
const ALL_DOMAINS: TargetDomain[] = [
  'swe',
  'ds',
  'design',
  'pm',
  'security',
  'cloud',
  'marketing',
  'business',
  'general',
];

const POOL: FocusAreaCandidate[] = [
  // ═══ ALGORITHMS & CODING ═══
  {
    id: 'algo_fundamentals',
    title: 'Core algorithms & problem-solving patterns',
    defaultDescription:
      "We'll pinpoint which coding patterns trip you up and build targeted drills around them.",
    defaultReason:
      'Coding interviews are the most common filter — getting sharp here pays off fast.',
    eligibility: { stages: ['student', 'new_grad', 'career_changer'], domains: ['swe', 'general'] },
    baseWeight: 7,
    boosts: [
      {
        signal: 'concern',
        condition: (ctx) => ctx.concernCategory === 'algorithms',
        weight: 5,
      },
      {
        signal: 'experience',
        condition: (ctx) => ctx.interviewExperience === 'none',
        weight: 3,
      },
      {
        signal: 'urgency',
        condition: (ctx) =>
          ctx.prepUrgency === 'interview_this_week' || ctx.prepUrgency === 'interview_scheduled',
        weight: 2,
      },
      {
        signal: 'resume',
        condition: (ctx) =>
          ctx.resumeSignals !== null && !ctx.resumeSignals.detectedSkills.includes('algorithms'),
        weight: 2,
      },
      {
        signal: 'benchmark',
        condition: (ctx) => isBenchmarkTopDomain(ctx, 'Coding / Algorithms'),
        weight: 3,
      },
    ],
    descriptionVariants: {
      urgent: () =>
        'Focus on the top 10 patterns that cover 80% of coding interviews — you can make real progress in a few focused sessions.',
      concern: () =>
        "You flagged coding as a concern — we'll start here with the patterns that show up most often so you build momentum fast.",
    },
    reasonVariants: {
      concern: () => 'You told us this is on your mind — so we made it priority #1.',
      resume_gap: () =>
        "Your resume doesn't highlight algorithm experience, so interviewers will test this hard.",
    },
  },
  {
    id: 'algo_advanced',
    title: 'Advanced problem-solving & optimization',
    defaultDescription:
      'Level up from brute-force to optimal solutions — the gap that separates good from great in coding rounds.',
    defaultReason:
      'At your level, interviewers expect more than a working solution — they want elegance.',
    eligibility: {
      stages: ['experienced_professional', 'new_grad'],
      domains: ['swe', 'general'],
      minYears: 3,
    },
    baseWeight: 4,
    boosts: [
      {
        signal: 'tier',
        condition: (ctx) => ctx.targetCompanyTier === 'big_tech',
        weight: 4,
      },
      {
        signal: 'concern',
        condition: (ctx) => ctx.concernCategory === 'algorithms',
        weight: 3,
      },
      {
        signal: 'role',
        condition: (ctx) => ctx.roleSeniority === 'senior' || ctx.roleSeniority === 'staff',
        weight: 2,
      },
      {
        signal: 'benchmark',
        condition: (ctx) => isBenchmarkTopDomain(ctx, 'Coding / Algorithms'),
        weight: 3,
      },
    ],
  },

  // ═══ SYSTEM DESIGN ═══
  {
    id: 'system_design_fundamentals',
    title: 'System design fundamentals',
    defaultDescription:
      'Learn to structure your thinking around scalability, trade-offs, and component design before your first design round.',
    defaultReason:
      'Most candidates at your stage freeze in design rounds — having a framework puts you ahead.',
    eligibility: { stages: ['new_grad', 'career_changer'], domains: ['swe', 'general'] },
    baseWeight: 5,
    boosts: [
      {
        signal: 'concern',
        condition: (ctx) => ctx.concernCategory === 'system_design',
        weight: 5,
      },
      {
        signal: 'tier',
        condition: (ctx) => ctx.targetCompanyTier === 'big_tech',
        weight: 3,
      },
      {
        signal: 'resume',
        condition: (ctx) =>
          ctx.resumeSignals !== null &&
          ctx.resumeSignals.detectedSkills.includes('backend') &&
          !ctx.resumeSignals.detectedSkills.includes('system_design'),
        weight: 2,
      },
      {
        signal: 'benchmark',
        condition: (ctx) => isBenchmarkTopDomain(ctx, 'System Design'),
        weight: 3,
      },
    ],
    reasonVariants: {
      concern: () =>
        "You flagged system design — we'll make sure you have a framework before you walk in.",
      resume: (ctx) =>
        `Your ${ctx.resumeSignals?.detectedSkills.includes('backend') ? 'backend' : 'technical'} background is a great foundation — now let's structure it for the interview format.`,
    },
  },
  {
    id: 'system_design_depth',
    title: 'System design depth & architecture decisions',
    defaultDescription:
      'Practice articulating real-world trade-offs and driving architecture discussions at the level your interviewers expect.',
    defaultReason:
      'Senior+ interviews put heavy weight on design rounds — this is where you prove your seniority.',
    eligibility: {
      stages: ['experienced_professional'],
      domains: ['swe', 'general'],
      minYears: 4,
    },
    baseWeight: 8,
    boosts: [
      {
        signal: 'concern',
        condition: (ctx) => ctx.concernCategory === 'system_design',
        weight: 4,
      },
      {
        signal: 'tier',
        condition: (ctx) => ctx.targetCompanyTier === 'big_tech',
        weight: 3,
      },
      {
        signal: 'resume',
        condition: (ctx) =>
          ctx.resumeSignals !== null && ctx.resumeSignals.detectedSkills.includes('system_design'),
        weight: 2,
      },
      {
        signal: 'benchmark',
        condition: (ctx) => isBenchmarkTopDomain(ctx, 'System Design'),
        weight: 3,
      },
    ],
    descriptionVariants: {
      resume: (ctx) =>
        `Your resume shows ${ctx.resumeSignals?.detectedSkills.includes('cloud') ? 'cloud infrastructure' : 'systems'} experience — we'll help you frame it as architecture decision-making for the interview.`,
    },
    reasonVariants: {
      concern: () =>
        'You flagged this as your biggest concern — and it carries the most weight at your level. Smart focus.',
      resume: () =>
        'Your background shows you do this work daily — the interview just needs you to narrate it differently.',
    },
  },

  // ═══ BEHAVIORAL / STAR STORIES ═══
  {
    id: 'star_stories_first',
    title: 'Building your first STAR stories',
    defaultDescription:
      'Turn coursework, projects, and side work into structured stories that prove your impact — even without years of experience.',
    defaultReason:
      'Behavioral rounds decide 30-40% of interview outcomes. Having 3-5 strong stories ready is a massive advantage.',
    eligibility: { stages: ['student', 'new_grad'], domains: ALL_DOMAINS },
    baseWeight: 6,
    boosts: [
      {
        signal: 'concern',
        condition: (ctx) => ctx.concernCategory === 'behavioral',
        weight: 4,
      },
      {
        signal: 'concern',
        condition: (ctx) => ctx.concernCategory === 'no_experience',
        weight: 3,
      },
      {
        signal: 'experience',
        condition: (ctx) => ctx.interviewExperience === 'none',
        weight: 3,
      },
      {
        signal: 'resume',
        condition: (ctx) => ctx.resumeSignals !== null && !ctx.resumeSignals.hasQuantifiedImpact,
        weight: 2,
      },
      {
        signal: 'benchmark',
        condition: (ctx) => isBenchmarkTopDomain(ctx, 'Behavioral', 'Leadership / Collab'),
        weight: 3,
      },
    ],
    descriptionVariants: {
      resume_thin: () =>
        "Even with limited work experience, your projects and coursework have stories worth telling. We'll help you find them.",
      concern: () =>
        "You're worried about not having stories — but you have more material than you think. We'll extract it.",
    },
  },
  {
    id: 'star_stories_leadership',
    title: 'Leadership & impact stories',
    defaultDescription:
      'Frame your management, mentorship, and cross-team influence into compelling narratives that demonstrate scope.',
    defaultReason:
      'At your level, interviewers want evidence of impact beyond code — leadership stories are essential.',
    eligibility: {
      stages: ['experienced_professional'],
      domains: ALL_DOMAINS,
      minYears: 4,
    },
    baseWeight: 6,
    boosts: [
      {
        signal: 'resume',
        condition: (ctx) => ctx.resumeSignals !== null && ctx.resumeSignals.hasLeadershipSignals,
        weight: 3,
      },
      {
        signal: 'role',
        condition: (ctx) => ctx.roleSeniority === 'lead' || ctx.roleSeniority === 'staff',
        weight: 3,
      },
      {
        signal: 'concern',
        condition: (ctx) => ctx.concernCategory === 'behavioral',
        weight: 3,
      },
      {
        signal: 'benchmark',
        condition: (ctx) => isBenchmarkTopDomain(ctx, 'Behavioral', 'Leadership / Collab'),
        weight: 3,
      },
    ],
    descriptionVariants: {
      resume: () =>
        "Your resume shows leadership experience — we'll help you structure those stories with the quantified impact interviewers want to hear.",
    },
    reasonVariants: {
      resume: () =>
        "We detected leadership signals in your resume — interviewers will probe here, so let's make your stories airtight.",
    },
  },

  // ═══ CAREER NARRATIVE ═══
  {
    id: 'career_pivot_narrative',
    title: 'Crafting your career pivot story',
    defaultDescription:
      'Build a compelling "why" narrative that turns your non-traditional path into a unique strength interviewers remember.',
    defaultReason:
      'Career changers who nail the "why" question get called back — those who stumble get filtered out.',
    eligibility: { stages: ['career_changer'], domains: ALL_DOMAINS },
    baseWeight: 9,
    boosts: [
      {
        signal: 'concern',
        condition: (ctx) => ctx.concernCategory === 'career_narrative',
        weight: 4,
      },
      {
        signal: 'experience',
        condition: (ctx) => ctx.interviewExperience === 'none',
        weight: 2,
      },
    ],
    descriptionVariants: {
      concern: () =>
        "You told us the career switch explanation worries you — that's exactly why we'll focus on making your story bulletproof.",
      role: (ctx) =>
        `We'll help you connect your prior experience directly to what ${roleOrDomain(ctx)} teams actually value.`,
    },
  },
  {
    id: 'transferable_skills',
    title: 'Bridging transferable skills',
    defaultDescription:
      'Map your existing expertise to the competencies hiring managers evaluate — your past career is an asset, not a liability.',
    defaultReason:
      "Interviewers need you to make the connection for them — they won't do it on their own.",
    eligibility: { stages: ['career_changer'], domains: ALL_DOMAINS },
    baseWeight: 7,
    boosts: [
      {
        signal: 'resume',
        condition: (ctx) =>
          ctx.resumeSignals !== null && ctx.resumeSignals.resumeDepth === 'substantial',
        weight: 3,
      },
      {
        signal: 'resume',
        condition: (ctx) => ctx.resumeSignals !== null && ctx.resumeSignals.hasQuantifiedImpact,
        weight: 2,
      },
    ],
    descriptionVariants: {
      resume: () =>
        "Your resume shows real professional depth — we'll help you translate that experience into the language your new field uses.",
    },
  },

  // ═══ TECHNICAL COMMUNICATION ═══
  {
    id: 'technical_communication',
    title: 'Technical communication & clarity',
    defaultDescription:
      'Practice explaining your thought process out loud — the skill that turns "I know the answer" into "I aced the interview."',
    defaultReason:
      'Interviewers evaluate how you think, not just what you know. Clear communication is a multiplier.',
    eligibility: { stages: ['student', 'new_grad', 'career_changer'], domains: ALL_DOMAINS },
    baseWeight: 4,
    boosts: [
      {
        signal: 'concern',
        condition: (ctx) =>
          ctx.concernCategory === 'communication' || ctx.concernCategory === 'confidence',
        weight: 5,
      },
      {
        signal: 'experience',
        condition: (ctx) => ctx.interviewExperience === 'none',
        weight: 3,
      },
    ],
    reasonVariants: {
      concern: () =>
        'You mentioned feeling nervous or unsure about articulating your thoughts — communication practice builds real confidence.',
    },
  },

  // ═══ INTERVIEW FUNDAMENTALS ═══
  {
    id: 'interview_fundamentals',
    title: 'Interview format & expectations',
    defaultDescription:
      'Understand what each round tests, how to structure your time, and what "good" looks like — so nothing catches you off guard.',
    defaultReason:
      'Knowing the format eliminates surprises and lets you focus your energy on actually performing.',
    eligibility: { stages: ALL_STAGES, domains: ALL_DOMAINS },
    baseWeight: 2,
    boosts: [
      {
        signal: 'experience',
        condition: (ctx) => ctx.interviewExperience === 'none',
        weight: 8,
      },
      {
        signal: 'concern',
        condition: (ctx) => ctx.concernCategory === 'no_experience',
        weight: 5,
      },
      {
        signal: 'concern',
        condition: (ctx) => ctx.concernCategory === 'confidence',
        weight: 3,
      },
    ],
    descriptionVariants: {
      role: (ctx) =>
        `${roleOrDomain(ctx)} interviews typically include ${ctx.targetDomains.includes('swe') ? 'coding, system design, and behavioral rounds' : ctx.targetDomains.includes('pm') ? 'product sense, analytical, and behavioral rounds' : ctx.targetDomains.includes('ds') ? 'technical, case study, and behavioral rounds' : ctx.targetDomains.includes('design') ? 'portfolio review, design exercise, and behavioral rounds' : 'multiple round types'} — we'll break down exactly what to expect in each.`,
    },
    reasonVariants: {
      experience: () =>
        "You haven't interviewed before — knowing the format gives you a massive head start over going in blind.",
    },
  },

  // ═══ STANDING OUT / TOP-TIER ═══
  {
    id: 'standing_out_top_tier',
    title: 'Standing out at top-tier companies',
    defaultDescription:
      'Calibrate your answers to the bar at FAANG+ and Big Tech — the difference between "competent" and "strong hire."',
    defaultReason:
      'Top-tier companies have a specific bar. Generic prep gets you close; calibrated prep gets you offers.',
    eligibility: { stages: ['new_grad', 'experienced_professional'], domains: ALL_DOMAINS },
    baseWeight: 3,
    boosts: [
      {
        signal: 'tier',
        condition: (ctx) => ctx.targetCompanyTier === 'big_tech',
        weight: 7,
      },
      {
        signal: 'concern',
        condition: (ctx) => ctx.concernCategory === 'standing_out',
        weight: 4,
      },
    ],
    descriptionVariants: {
      role: (ctx) =>
        `${roleOrDomain(ctx)} roles at Big Tech companies have a specific rubric — we'll show you exactly what the bar looks like and how to clear it.`,
    },
    reasonVariants: {
      tier: () => "You're targeting Big Tech — so we'll calibrate everything to that bar.",
    },
  },

  // ═══ QUICK WINS (urgency-boosted) ═══
  {
    id: 'quick_win_common_questions',
    title: 'Most-asked questions for your role',
    defaultDescription:
      'Drill the 10 questions that show up in 80% of interviews — maximum preparation for minimum time.',
    defaultReason:
      'With limited prep time, covering the most likely questions gives you the highest return.',
    eligibility: { stages: ALL_STAGES, domains: ALL_DOMAINS },
    baseWeight: 2,
    boosts: [
      {
        signal: 'urgency',
        condition: (ctx) => ctx.prepUrgency === 'interview_this_week',
        weight: 8,
      },
      {
        signal: 'urgency',
        condition: (ctx) => ctx.prepUrgency === 'interview_scheduled',
        weight: 4,
      },
    ],
    descriptionVariants: {
      role: (ctx) =>
        `We'll surface the questions most commonly asked in ${roleOrDomain(ctx)} interviews so you can focus your limited time where it counts.`,
    },
    reasonVariants: {
      urgency: () =>
        'Your interview is coming up fast — this is the highest-leverage prep you can do right now.',
    },
  },

  // ═══ DATA SCIENCE SPECIFIC ═══
  {
    id: 'ds_statistics_foundations',
    title: 'Statistics & probability foundations',
    defaultDescription:
      'Refresh the fundamentals that data science interviews test hardest — distributions, hypothesis testing, and experimental design.',
    defaultReason:
      'Statistics questions trip up even strong candidates. A solid refresher prevents easy points from slipping away.',
    eligibility: { stages: ['student', 'new_grad'], domains: ['ds'] },
    baseWeight: 7,
    boosts: [
      {
        signal: 'resume',
        condition: (ctx) =>
          ctx.resumeSignals !== null && !ctx.resumeSignals.detectedSkills.includes('ml'),
        weight: 2,
      },
    ],
  },
  {
    id: 'ds_sql_fluency',
    title: 'SQL fluency & data manipulation',
    defaultDescription:
      'Master the SQL patterns that show up in take-home and live coding assessments — joins, window functions, and optimization.',
    defaultReason:
      'SQL rounds are pass/fail at most companies. Fluency here is expected, not a bonus.',
    eligibility: { stages: ['student', 'new_grad', 'career_changer'], domains: ['ds'] },
    baseWeight: 6,
    boosts: [
      {
        signal: 'resume',
        condition: (ctx) =>
          ctx.resumeSignals !== null && !ctx.resumeSignals.detectedSkills.includes('data'),
        weight: 3,
      },
    ],
  },
  {
    id: 'ds_ml_depth',
    title: 'ML model selection & evaluation',
    defaultDescription:
      'Practice explaining when to use which model, how to evaluate performance, and how to handle real-world data challenges.',
    defaultReason:
      'Interviewers want to see you can make and defend model choices — not just run scikit-learn.',
    eligibility: { stages: ['new_grad', 'experienced_professional'], domains: ['ds'] },
    baseWeight: 6,
    boosts: [
      {
        signal: 'resume',
        condition: (ctx) =>
          ctx.resumeSignals !== null && ctx.resumeSignals.detectedSkills.includes('ml'),
        weight: 3,
      },
      {
        signal: 'tier',
        condition: (ctx) => ctx.targetCompanyTier === 'big_tech',
        weight: 2,
      },
    ],
    reasonVariants: {
      resume: () =>
        "Your resume shows ML experience — interviewers will go deeper here. Let's make sure you can articulate your decisions.",
    },
  },
  {
    id: 'ds_business_impact',
    title: 'Communicating insights with business impact',
    defaultDescription:
      'Learn to frame technical analyses in terms of business outcomes — the skill that separates data scientists from data analysts.',
    defaultReason:
      'Companies hire data scientists to drive decisions, not produce notebooks. Showing business sense is the differentiator.',
    eligibility: {
      stages: ['new_grad', 'experienced_professional', 'career_changer'],
      domains: ['ds'],
    },
    baseWeight: 5,
    boosts: [
      {
        signal: 'resume',
        condition: (ctx) => ctx.resumeSignals !== null && ctx.resumeSignals.hasQuantifiedImpact,
        weight: 2,
      },
      {
        signal: 'role',
        condition: (ctx) => ctx.roleSeniority === 'senior' || ctx.roleSeniority === 'staff',
        weight: 3,
      },
    ],
  },

  // ═══ DESIGN SPECIFIC ═══
  {
    id: 'design_portfolio_stories',
    title: 'Portfolio case study structure',
    defaultDescription:
      'Structure each portfolio piece as a story: problem, process, outcome — so reviewers see your thinking, not just your screens.',
    defaultReason:
      'Design interviews are portfolio-driven. How you present your work matters as much as the work itself.',
    eligibility: { stages: ['student', 'new_grad'], domains: ['design'] },
    baseWeight: 7,
    boosts: [
      {
        signal: 'experience',
        condition: (ctx) => ctx.interviewExperience === 'none',
        weight: 3,
      },
    ],
  },
  {
    id: 'design_critique',
    title: 'Design critique & iteration',
    defaultDescription:
      'Practice giving and receiving design feedback — the skill that interviewers use to gauge collaborative maturity.',
    defaultReason:
      'Critique rounds test your ego, your taste, and your ability to collaborate — all at once.',
    eligibility: { stages: ['new_grad', 'career_changer'], domains: ['design'] },
    baseWeight: 5,
    boosts: [
      {
        signal: 'tier',
        condition: (ctx) => ctx.targetCompanyTier === 'big_tech',
        weight: 3,
      },
    ],
  },
  {
    id: 'design_leadership',
    title: 'Design leadership & strategic thinking',
    defaultDescription:
      'Demonstrate how you drive design decisions at scale — from user research to business metrics to team influence.',
    defaultReason:
      'Senior design roles want systems-level thinkers, not just skilled practitioners.',
    eligibility: {
      stages: ['experienced_professional'],
      domains: ['design'],
      minYears: 4,
    },
    baseWeight: 7,
    boosts: [
      {
        signal: 'resume',
        condition: (ctx) => ctx.resumeSignals !== null && ctx.resumeSignals.hasLeadershipSignals,
        weight: 3,
      },
    ],
  },

  // ═══ PM SPECIFIC ═══
  {
    id: 'pm_product_sense',
    title: 'Product sense & user empathy',
    defaultDescription:
      'Practice structuring product sense questions — from identifying user pain to proposing solutions to measuring success.',
    defaultReason:
      "Product sense is the #1 thing PM interviewers assess. It's learnable — and we'll drill it.",
    eligibility: { stages: ['student', 'new_grad'], domains: ['pm'] },
    baseWeight: 8,
    boosts: [
      {
        signal: 'experience',
        condition: (ctx) => ctx.interviewExperience === 'none',
        weight: 2,
      },
    ],
  },
  {
    id: 'pm_strategy',
    title: 'Product strategy & vision articulation',
    defaultDescription:
      'Learn to think and communicate at the strategy level — roadmap rationale, competitive positioning, and long-term bets.',
    defaultReason: 'Senior PM interviews test whether you can see the forest, not just the trees.',
    eligibility: {
      stages: ['experienced_professional'],
      domains: ['pm'],
      minYears: 3,
    },
    baseWeight: 7,
    boosts: [
      {
        signal: 'tier',
        condition: (ctx) => ctx.targetCompanyTier === 'big_tech',
        weight: 3,
      },
      {
        signal: 'role',
        condition: (ctx) => ctx.roleSeniority === 'senior' || ctx.roleSeniority === 'lead',
        weight: 3,
      },
    ],
  },
  {
    id: 'pm_analytical',
    title: 'Metrics & analytical questions',
    defaultDescription:
      'Practice estimation, metric definition, and data-driven prioritization — the analytical backbone of PM interviews.',
    defaultReason:
      'Analytical questions are the most objective part of PM interviews — strong answers create confidence.',
    eligibility: { stages: ['student', 'new_grad', 'career_changer'], domains: ['pm'] },
    baseWeight: 5,
    boosts: [
      {
        signal: 'resume',
        condition: (ctx) =>
          ctx.resumeSignals !== null && ctx.resumeSignals.detectedSkills.includes('data'),
        weight: 2,
      },
    ],
  },

  // ═══ CONFIDENCE & MINDSET ═══
  {
    id: 'confidence_building',
    title: 'Managing interview anxiety',
    defaultDescription:
      'Build concrete strategies for staying calm under pressure — from mock interview warmups to reframing techniques that actually work.',
    defaultReason:
      'Interview anxiety tanks performance more than skill gaps. Addressing it directly is smart prep.',
    eligibility: { stages: ALL_STAGES, domains: ALL_DOMAINS },
    baseWeight: 1,
    boosts: [
      {
        signal: 'concern',
        condition: (ctx) => ctx.concernCategory === 'confidence',
        weight: 8,
      },
      {
        signal: 'experience',
        condition: (ctx) => ctx.interviewExperience === 'none',
        weight: 2,
      },
    ],
    reasonVariants: {
      concern: () =>
        "You mentioned anxiety — this isn't fluffy advice. We'll give you practical techniques that reduce stress and improve performance.",
    },
  },

  // ═══ NEGOTIATION ═══
  {
    id: 'salary_negotiation',
    title: 'Salary negotiation & offer evaluation',
    defaultDescription:
      'Learn frameworks for evaluating total compensation, negotiating confidently, and handling multiple offers.',
    defaultReason:
      'Most candidates leave $10-50K on the table by not negotiating. This skill pays for itself.',
    eligibility: {
      stages: ['experienced_professional', 'new_grad'],
      domains: ALL_DOMAINS,
    },
    baseWeight: 1,
    boosts: [
      {
        signal: 'concern',
        condition: (ctx) => ctx.concernCategory === 'negotiation',
        weight: 8,
      },
      {
        signal: 'urgency',
        condition: (ctx) => ctx.prepUrgency === 'exploring',
        weight: 2,
      },
    ],
    reasonVariants: {
      concern: () =>
        'You flagged compensation as a concern — getting the offer is step one, but negotiating it well is where the real value is.',
    },
  },

  // ═══ BUILDING CREDIBILITY (career changers) ═══
  {
    id: 'building_credibility',
    title: 'Proving your new skills with evidence',
    defaultDescription:
      'Show interviewers concrete evidence of your abilities — portfolio projects, certifications, and quantified contributions that remove doubt.',
    defaultReason:
      "As a career changer, you need proof points. We'll help you identify and present the strongest ones.",
    eligibility: { stages: ['career_changer'], domains: ALL_DOMAINS },
    baseWeight: 6,
    boosts: [
      {
        signal: 'resume',
        condition: (ctx) => ctx.resumeSignals !== null && ctx.resumeSignals.resumeDepth === 'thin',
        weight: 4,
      },
      {
        signal: 'resume',
        condition: (ctx) => ctx.resumeSignals !== null && ctx.resumeSignals.hasOpenSource,
        weight: 2,
      },
    ],
    descriptionVariants: {
      resume_thin: () =>
        "Your resume is lean right now — we'll help you highlight the evidence that matters most and identify gaps to fill before interview day.",
      resume_oss: () =>
        "Your open source contributions are a great credibility signal — we'll help you frame them as evidence of professional-grade work.",
    },
  },

  // ═══ EXECUTIVE PRESENCE ═══
  {
    id: 'executive_presence',
    title: 'Executive presence in interviews',
    defaultDescription:
      'Project confidence, structure, and gravitas in every interaction — from the first handshake to the closing question.',
    defaultReason: 'At the senior level, how you carry yourself signals as much as what you say.',
    eligibility: {
      stages: ['experienced_professional'],
      domains: ALL_DOMAINS,
      minYears: 8,
    },
    baseWeight: 4,
    boosts: [
      {
        signal: 'tier',
        condition: (ctx) => ctx.targetCompanyTier === 'big_tech',
        weight: 3,
      },
      {
        signal: 'role',
        condition: (ctx) => ctx.roleSeniority === 'lead',
        weight: 4,
      },
    ],
  },

  // ═══ ASKING GREAT QUESTIONS ═══
  {
    id: 'asking_great_questions',
    title: 'Asking great questions to interviewers',
    defaultDescription:
      'Prepare thoughtful, role-specific questions that show genuine interest and strategic thinking — the final impression that seals the deal.',
    defaultReason:
      '"Do you have any questions?" is your last chance to stand out. Most candidates waste it.',
    eligibility: { stages: ALL_STAGES, domains: ALL_DOMAINS },
    baseWeight: 2,
    boosts: [
      {
        signal: 'experience',
        condition: (ctx) => ctx.interviewExperience === 'none',
        weight: 3,
      },
      {
        signal: 'urgency',
        condition: (ctx) =>
          ctx.prepUrgency === 'interview_this_week' || ctx.prepUrgency === 'interview_scheduled',
        weight: 2,
      },
    ],
  },

  // ═══ STARTUP-FOCUSED ═══
  {
    id: 'startup_readiness',
    title: 'Startup interview patterns',
    defaultDescription:
      "Startups value scrappiness, ownership, and speed. We'll help you tell stories that prove you can wear multiple hats and ship fast.",
    defaultReason:
      'Startup interviews are less structured but more opinionated — the wrong framing gets you filtered fast.',
    eligibility: { stages: ALL_STAGES, domains: ALL_DOMAINS },
    baseWeight: 1,
    boosts: [
      {
        signal: 'tier',
        condition: (ctx) => ctx.targetCompanyTier === 'startup',
        weight: 7,
      },
    ],
    reasonVariants: {
      tier: () =>
        "You're targeting startups — we'll focus on the ownership and velocity stories they actually care about.",
    },
  },

  // ═══ QUANTIFYING IMPACT ═══
  {
    id: 'quantifying_impact',
    title: 'Quantifying your impact with data',
    defaultDescription:
      'Turn vague accomplishments into specific, measurable stories — "improved performance" becomes "reduced p99 latency by 40%."',
    defaultReason:
      'Numbers make your stories memorable and credible. Without them, interviewers have to take your word for it.',
    eligibility: {
      stages: ['experienced_professional', 'new_grad'],
      domains: ALL_DOMAINS,
      minYears: 1,
    },
    baseWeight: 4,
    boosts: [
      {
        signal: 'resume',
        condition: (ctx) => ctx.resumeSignals !== null && !ctx.resumeSignals.hasQuantifiedImpact,
        weight: 5,
      },
      {
        signal: 'tier',
        condition: (ctx) => ctx.targetCompanyTier === 'big_tech',
        weight: 2,
      },
    ],
    reasonVariants: {
      resume: () =>
        "We didn't find quantified results in your resume — adding numbers to your stories will make them dramatically more convincing.",
    },
  },
];

// ── Signal Source Labels ───────────────────────────────────────

export const SIGNAL_SOURCE_LABELS: Record<string, string> = {
  concern: 'your concern',
  resume: 'your resume',
  urgency: 'your timeline',
  tier: 'target companies',
  experience: 'interview experience',
  role: 'target role',
  benchmark: 'benchmark data',
};

// ── Selection Algorithm ────────────────────────────────────────

export function selectFocusAreas(
  input: {
    careerStage: CareerStage | null;
    targetDomains: TargetDomain[];
    targetRoles: string[];
    yearsExperience: number | null;
    prepUrgency: OnboardingPrepUrgency | null;
    biggestConcern: string;
    interviewExperience: InterviewExperience | null;
    targetCompanyTier: TargetCompanyTier | null;
    resumeText: string;
    benchmarkDomainWeights?: Record<string, number> | null;
  },
  resumeSignals: ResumeSignals | null
): FocusAreaItem[] {
  const stage = input.careerStage ?? 'new_grad';
  const domains =
    input.targetDomains.length > 0 ? input.targetDomains : (['general'] as TargetDomain[]);

  const ctx: SelectionContext = {
    careerStage: stage,
    targetDomains: domains,
    targetRoles: input.targetRoles,
    yearsExperience: input.yearsExperience,
    prepUrgency: input.prepUrgency,
    biggestConcern: input.biggestConcern,
    interviewExperience: input.interviewExperience,
    targetCompanyTier: input.targetCompanyTier,
    resumeSignals,
    benchmarkDomainWeights: input.benchmarkDomainWeights ?? null,
    concernCategory: detectConcernCategory(input.biggestConcern),
    roleSeniority: parseRoleSeniority(input.targetRoles[0] || ''),
    roleSpecialization: parseRoleSpecialization(input.targetRoles[0] || ''),
  };

  // 1. Filter by eligibility
  const eligible = POOL.filter((c) => {
    if (!c.eligibility.stages.includes(stage)) return false;
    if (!c.eligibility.domains.some((d) => domains.includes(d))) return false;
    if (
      c.eligibility.minYears !== undefined &&
      (input.yearsExperience ?? 0) < c.eligibility.minYears
    )
      return false;
    if (
      c.eligibility.maxYears !== undefined &&
      (input.yearsExperience ?? 0) > c.eligibility.maxYears
    )
      return false;
    return true;
  });

  // 2. Score each candidate
  const scored = eligible.map((candidate) => {
    let weight = candidate.baseWeight;
    const firedSignals: string[] = [];

    for (const boost of candidate.boosts) {
      if (boost.condition(ctx)) {
        weight += boost.weight;
        if (!firedSignals.includes(boost.signal)) {
          firedSignals.push(boost.signal);
        }
      }
    }

    return { candidate, weight, firedSignals };
  });

  // 3. Sort by weight descending, take top N
  scored.sort((a, b) => b.weight - a.weight);
  const count = input.prepUrgency === 'interview_this_week' ? 4 : 3;
  const winners = scored.slice(0, count);

  // 4. Build FocusAreaItems with personalized descriptions
  return winners.map(({ candidate, weight, firedSignals }, i) => {
    // Select best description variant
    let description = candidate.defaultDescription;
    if (candidate.descriptionVariants) {
      for (const [key, fn] of Object.entries(candidate.descriptionVariants)) {
        if (
          (key === 'urgent' &&
            (ctx.prepUrgency === 'interview_this_week' ||
              ctx.prepUrgency === 'interview_scheduled')) ||
          (key === 'concern' && ctx.concernCategory && firedSignals.includes('concern')) ||
          (key === 'resume' && ctx.resumeSignals && firedSignals.includes('resume')) ||
          (key === 'resume_thin' &&
            ctx.resumeSignals?.resumeDepth === 'thin' &&
            firedSignals.includes('resume')) ||
          (key === 'resume_oss' && ctx.resumeSignals?.hasOpenSource) ||
          (key === 'role' && ctx.targetRoles.length > 0)
        ) {
          description = fn(ctx);
          break;
        }
      }
    }

    // Select best reason variant
    let reason = candidate.defaultReason;
    if (candidate.reasonVariants) {
      for (const [key, fn] of Object.entries(candidate.reasonVariants)) {
        if (
          (key === 'concern' && ctx.concernCategory && firedSignals.includes('concern')) ||
          (key === 'resume' && ctx.resumeSignals && firedSignals.includes('resume')) ||
          (key === 'resume_gap' && ctx.resumeSignals && firedSignals.includes('resume')) ||
          (key === 'experience' && firedSignals.includes('experience')) ||
          (key === 'urgency' && firedSignals.includes('urgency')) ||
          (key === 'tier' && firedSignals.includes('tier'))
        ) {
          reason = fn(ctx);
          break;
        }
      }
    }

    return {
      id: candidate.id,
      title: candidate.title,
      description,
      reason,
      priority: (i === 0 || weight >= 12 ? 'high' : 'medium') as FocusAreaItem['priority'],
      signalSources: firedSignals,
    };
  });
}
