import type {
  CompanyTier,
  CompetitionLevel,
  CompanyDifficultyContext,
  ExtractedResume,
  ExtractedJD,
  ExperienceLevel,
} from '@/types';

const COMPANY_DIFFICULTY_VERSION = 'v0.1';

interface CompanyEntry {
  tier: CompanyTier;
  difficultyMultiplier: number;
  internMultiplier: number;
  acceptanceRateEstimate: string;
  competitionLevel: CompetitionLevel;
  interviewBarDescription: string;
  aliases?: string[];
}

// ~80 companies across 6 tiers
const COMPANY_DATABASE: Record<string, CompanyEntry> = {
  // ── FAANG_PLUS ──────────────────────────────────────────────────────
  google: {
    tier: 'FAANG_PLUS',
    difficultyMultiplier: 1.45,
    internMultiplier: 1.25,
    acceptanceRateEstimate: '1-2%',
    competitionLevel: 'extreme',
    interviewBarDescription:
      'Expects strong algorithmic thinking, system design depth, and Googleyness (leadership, collaboration). Multiple rounds with high reject rates at each stage.',
  },
  meta: {
    tier: 'FAANG_PLUS',
    difficultyMultiplier: 1.4,
    internMultiplier: 1.25,
    acceptanceRateEstimate: '1-3%',
    competitionLevel: 'extreme',
    interviewBarDescription:
      'Emphasizes move-fast culture, coding speed, and system design. Behavioral rounds focus on impact at scale.',
    aliases: ['facebook'],
  },
  apple: {
    tier: 'FAANG_PLUS',
    difficultyMultiplier: 1.4,
    internMultiplier: 1.2,
    acceptanceRateEstimate: '2-4%',
    competitionLevel: 'extreme',
    interviewBarDescription:
      'Highly secretive process. Deep domain expertise required. Emphasis on craft, attention to detail, and cross-functional collaboration.',
  },
  amazon: {
    tier: 'FAANG_PLUS',
    difficultyMultiplier: 1.4,
    internMultiplier: 1.2,
    acceptanceRateEstimate: '2-3%',
    competitionLevel: 'extreme',
    interviewBarDescription:
      'Leadership Principles dominate every round. Expect deep behavioral + technical bars. Bar raiser process adds extra scrutiny.',
  },
  netflix: {
    tier: 'FAANG_PLUS',
    difficultyMultiplier: 1.35,
    internMultiplier: 1.15,
    acceptanceRateEstimate: '2-5%',
    competitionLevel: 'extreme',
    interviewBarDescription:
      'Culture of freedom and responsibility. Very senior-oriented hiring. Expects strong ownership, judgment, and domain mastery.',
  },
  microsoft: {
    tier: 'FAANG_PLUS',
    difficultyMultiplier: 1.35,
    internMultiplier: 1.2,
    acceptanceRateEstimate: '2-4%',
    competitionLevel: 'extreme',
    interviewBarDescription:
      'Structured loop interviews with growth mindset evaluation. Strong emphasis on coding, system design, and collaboration.',
  },
  nvidia: {
    tier: 'FAANG_PLUS',
    difficultyMultiplier: 1.45,
    internMultiplier: 1.25,
    acceptanceRateEstimate: '1-3%',
    competitionLevel: 'extreme',
    interviewBarDescription:
      'Deeply technical interviews focused on GPU architecture, CUDA, and systems programming. Hardware-software co-design knowledge is a major differentiator.',
  },
  openai: {
    tier: 'FAANG_PLUS',
    difficultyMultiplier: 1.5,
    internMultiplier: 1.3,
    acceptanceRateEstimate: '<1%',
    competitionLevel: 'extreme',
    interviewBarDescription:
      'Extremely competitive. Expects world-class ML/AI fundamentals, strong coding, and mission alignment. Research-oriented candidates need publications or equivalent impact.',
  },
  anthropic: {
    tier: 'FAANG_PLUS',
    difficultyMultiplier: 1.5,
    internMultiplier: 1.3,
    acceptanceRateEstimate: '<1%',
    competitionLevel: 'extreme',
    interviewBarDescription:
      'Focuses on AI safety alignment, strong technical fundamentals, and research depth. Extremely selective with emphasis on thoughtful reasoning.',
  },
  'jane street': {
    tier: 'FAANG_PLUS',
    difficultyMultiplier: 1.5,
    internMultiplier: 1.3,
    acceptanceRateEstimate: '<1%',
    competitionLevel: 'extreme',
    interviewBarDescription:
      'Probability, mental math, and functional programming (OCaml). Multiple technical rounds with brain teasers and market-making simulations.',
  },
  citadel: {
    tier: 'FAANG_PLUS',
    difficultyMultiplier: 1.45,
    internMultiplier: 1.25,
    acceptanceRateEstimate: '1-2%',
    competitionLevel: 'extreme',
    interviewBarDescription:
      'Quant-heavy interviews with probability, statistics, and algorithmic challenges. Expects exceptional problem-solving speed and mathematical maturity.',
    aliases: ['citadel securities'],
  },
  'two sigma': {
    tier: 'FAANG_PLUS',
    difficultyMultiplier: 1.45,
    internMultiplier: 1.25,
    acceptanceRateEstimate: '1-2%',
    competitionLevel: 'extreme',
    interviewBarDescription:
      'Data-driven culture. Interviews test statistical reasoning, ML, and systems thinking. Strong emphasis on intellectual curiosity.',
  },
  'de shaw': {
    tier: 'FAANG_PLUS',
    difficultyMultiplier: 1.45,
    internMultiplier: 1.25,
    acceptanceRateEstimate: '1-3%',
    competitionLevel: 'extreme',
    interviewBarDescription:
      'Quant and tech roles test algorithmic depth, probability theory, and system design. Known for rigorous multi-round processes.',
    aliases: ['d.e. shaw', 'd. e. shaw'],
  },

  // ── BIG_TECH ────────────────────────────────────────────────────────
  uber: {
    tier: 'BIG_TECH',
    difficultyMultiplier: 1.25,
    internMultiplier: 1.15,
    acceptanceRateEstimate: '3-5%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'System design focus on distributed systems and real-time data. Strong coding bar with emphasis on scalability.',
  },
  airbnb: {
    tier: 'BIG_TECH',
    difficultyMultiplier: 1.25,
    internMultiplier: 1.15,
    acceptanceRateEstimate: '3-5%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Cross-functional interviews with strong culture-fit component. Values-driven hiring with emphasis on belonging and craft.',
  },
  salesforce: {
    tier: 'BIG_TECH',
    difficultyMultiplier: 1.2,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '5-8%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Cloud platform expertise valued. Mix of technical and behavioral rounds with emphasis on customer success mindset.',
  },
  shopify: {
    tier: 'BIG_TECH',
    difficultyMultiplier: 1.2,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '4-7%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Life story interview + technical deep dive. Values entrepreneurial mindset and builder mentality.',
  },
  spotify: {
    tier: 'BIG_TECH',
    difficultyMultiplier: 1.2,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '4-7%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Autonomous squad culture. Interviews test technical skills plus collaboration and data-driven decision making.',
  },
  stripe: {
    tier: 'BIG_TECH',
    difficultyMultiplier: 1.3,
    internMultiplier: 1.2,
    acceptanceRateEstimate: '2-4%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Extremely high coding bar. Bug squash and system design rounds. Looks for exceptional attention to detail and developer empathy.',
  },
  linkedin: {
    tier: 'BIG_TECH',
    difficultyMultiplier: 1.25,
    internMultiplier: 1.15,
    acceptanceRateEstimate: '3-5%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Standard big tech loop with coding, system design, and behavioral. Values transformation and results-oriented culture.',
  },
  twitter: {
    tier: 'BIG_TECH',
    difficultyMultiplier: 1.2,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '4-7%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Real-time systems focus. Emphasis on distributed systems, data pipelines, and scaling.',
    aliases: ['x', 'x corp'],
  },
  snap: {
    tier: 'BIG_TECH',
    difficultyMultiplier: 1.2,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '4-7%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Mobile and AR/VR focus. Technical interviews test mobile development, camera systems, and real-time processing.',
    aliases: ['snapchat'],
  },
  tiktok: {
    tier: 'BIG_TECH',
    difficultyMultiplier: 1.25,
    internMultiplier: 1.15,
    acceptanceRateEstimate: '3-5%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Fast-paced culture with strong algorithmic focus. Emphasis on recommendation systems and large-scale data processing.',
    aliases: ['bytedance'],
  },
  oracle: {
    tier: 'BIG_TECH',
    difficultyMultiplier: 1.2,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '5-8%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Database and cloud infrastructure focus. Multiple technical rounds with system design emphasis.',
  },
  adobe: {
    tier: 'BIG_TECH',
    difficultyMultiplier: 1.2,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '5-8%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Creative technology focus. Interviews emphasize software architecture, user experience thinking, and technical depth.',
  },
  palantir: {
    tier: 'BIG_TECH',
    difficultyMultiplier: 1.3,
    internMultiplier: 1.2,
    acceptanceRateEstimate: '2-4%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Decomposition and forward-deployed engineering focus. Tests problem decomposition, system design, and mission-driven thinking.',
  },
  databricks: {
    tier: 'BIG_TECH',
    difficultyMultiplier: 1.3,
    internMultiplier: 1.15,
    acceptanceRateEstimate: '3-5%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Data engineering and Spark expertise valued. Strong emphasis on distributed systems and data platform architecture.',
  },
  snowflake: {
    tier: 'BIG_TECH',
    difficultyMultiplier: 1.25,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '4-6%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Cloud data platform focus. System design and database internals knowledge tested thoroughly.',
  },

  // ── TOP_FINANCE ─────────────────────────────────────────────────────
  'goldman sachs': {
    tier: 'TOP_FINANCE',
    difficultyMultiplier: 1.35,
    internMultiplier: 1.2,
    acceptanceRateEstimate: '2-4%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Superday format with multiple rounds. Tests financial knowledge, problem-solving, and cultural fit. Engineering roles test system design and coding.',
  },
  'jp morgan': {
    tier: 'TOP_FINANCE',
    difficultyMultiplier: 1.3,
    internMultiplier: 1.2,
    acceptanceRateEstimate: '3-5%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Structured process with HireVue and superday. Tests financial acumen, technical skills, and leadership potential.',
    aliases: ['jpmorgan', 'jpmorgan chase', 'j.p. morgan'],
  },
  'morgan stanley': {
    tier: 'TOP_FINANCE',
    difficultyMultiplier: 1.3,
    internMultiplier: 1.2,
    acceptanceRateEstimate: '3-5%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Technology division has strong coding bars. Finance roles test market knowledge and analytical thinking.',
  },
  blackstone: {
    tier: 'TOP_FINANCE',
    difficultyMultiplier: 1.4,
    internMultiplier: 1.25,
    acceptanceRateEstimate: '1-3%',
    competitionLevel: 'extreme',
    interviewBarDescription:
      'PE/investment focus with extreme selectivity. Tests financial modeling, deal analysis, and leadership under pressure.',
  },
  blackrock: {
    tier: 'TOP_FINANCE',
    difficultyMultiplier: 1.3,
    internMultiplier: 1.15,
    acceptanceRateEstimate: '3-5%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Asset management focus. Tests quantitative skills, market understanding, and Aladdin platform knowledge for tech roles.',
  },
  bloomberg: {
    tier: 'TOP_FINANCE',
    difficultyMultiplier: 1.3,
    internMultiplier: 1.15,
    acceptanceRateEstimate: '3-5%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Terminal-centric culture. Strong C++ coding bar for engineering. Tests data structure knowledge and financial data processing.',
  },
  'bank of america': {
    tier: 'TOP_FINANCE',
    difficultyMultiplier: 1.25,
    internMultiplier: 1.15,
    acceptanceRateEstimate: '4-6%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Structured interview process with behavioral and technical rounds. Values teamwork and client-focused mindset.',
    aliases: ['bofa'],
  },
  barclays: {
    tier: 'TOP_FINANCE',
    difficultyMultiplier: 1.25,
    internMultiplier: 1.15,
    acceptanceRateEstimate: '4-6%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Investment banking and technology roles with structured assessment centers. Strength in global markets.',
  },
  kkr: {
    tier: 'TOP_FINANCE',
    difficultyMultiplier: 1.4,
    internMultiplier: 1.25,
    acceptanceRateEstimate: '1-3%',
    competitionLevel: 'extreme',
    interviewBarDescription:
      'Private equity focus with case studies and LBO modeling. Extremely competitive with emphasis on deal judgment.',
  },
  point72: {
    tier: 'TOP_FINANCE',
    difficultyMultiplier: 1.35,
    internMultiplier: 1.2,
    acceptanceRateEstimate: '2-4%',
    competitionLevel: 'very_high',
    interviewBarDescription:
      'Hedge fund with quantitative focus. Tests statistical reasoning, market intuition, and analytical rigor.',
  },

  // ── UNICORN ─────────────────────────────────────────────────────────
  figma: {
    tier: 'UNICORN',
    difficultyMultiplier: 1.25,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '3-6%',
    competitionLevel: 'high',
    interviewBarDescription:
      'Design-engineering culture. Tests product thinking, frontend expertise, and collaboration with designers.',
  },
  notion: {
    tier: 'UNICORN',
    difficultyMultiplier: 1.2,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '4-7%',
    competitionLevel: 'high',
    interviewBarDescription:
      'Small team, high bar. Values product sense, clean code, and ability to work across the stack.',
  },
  vercel: {
    tier: 'UNICORN',
    difficultyMultiplier: 1.2,
    internMultiplier: 1.05,
    acceptanceRateEstimate: '5-8%',
    competitionLevel: 'high',
    interviewBarDescription:
      'Developer tooling focus. Tests understanding of web performance, edge computing, and frontend architecture.',
  },
  'scale ai': {
    tier: 'UNICORN',
    difficultyMultiplier: 1.25,
    internMultiplier: 1.15,
    acceptanceRateEstimate: '3-6%',
    competitionLevel: 'high',
    interviewBarDescription:
      'AI/ML data infrastructure focus. Tests system design for data pipelines and ML engineering fundamentals.',
    aliases: ['scale'],
  },
  discord: {
    tier: 'UNICORN',
    difficultyMultiplier: 1.2,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '4-7%',
    competitionLevel: 'high',
    interviewBarDescription:
      'Real-time communication systems. Tests distributed systems, WebSocket architecture, and scaling challenges.',
  },
  coinbase: {
    tier: 'UNICORN',
    difficultyMultiplier: 1.2,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '4-7%',
    competitionLevel: 'high',
    interviewBarDescription:
      'Crypto/blockchain focus. Tests security mindset, distributed systems, and financial engineering.',
  },
  instacart: {
    tier: 'UNICORN',
    difficultyMultiplier: 1.15,
    internMultiplier: 1.05,
    acceptanceRateEstimate: '5-8%',
    competitionLevel: 'high',
    interviewBarDescription:
      'Marketplace and logistics optimization. Tests algorithm design, system design, and product thinking.',
  },
  doordash: {
    tier: 'UNICORN',
    difficultyMultiplier: 1.2,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '4-7%',
    competitionLevel: 'high',
    interviewBarDescription:
      'Logistics and marketplace focus. Tests optimization algorithms, system design, and real-time data processing.',
  },
  plaid: {
    tier: 'UNICORN',
    difficultyMultiplier: 1.2,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '4-7%',
    competitionLevel: 'high',
    interviewBarDescription:
      'Fintech infrastructure focus. Tests API design, security, and financial data systems.',
  },
  ramp: {
    tier: 'UNICORN',
    difficultyMultiplier: 1.2,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '4-7%',
    competitionLevel: 'high',
    interviewBarDescription:
      'Fast-growing fintech. Tests full-stack ability, product thinking, and speed of execution.',
  },
  rippling: {
    tier: 'UNICORN',
    difficultyMultiplier: 1.2,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '4-7%',
    competitionLevel: 'high',
    interviewBarDescription:
      'HR/IT platform with high engineering bar. Tests system design, coding speed, and product-minded engineering.',
  },
  anduril: {
    tier: 'UNICORN',
    difficultyMultiplier: 1.25,
    internMultiplier: 1.15,
    acceptanceRateEstimate: '3-6%',
    competitionLevel: 'high',
    interviewBarDescription:
      'Defense tech with systems engineering focus. Tests real-time systems, C++/Rust, and hardware-software integration.',
  },
  datadog: {
    tier: 'UNICORN',
    difficultyMultiplier: 1.2,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '4-7%',
    competitionLevel: 'high',
    interviewBarDescription:
      'Observability platform. Tests distributed systems, data pipeline design, and performance engineering.',
  },
  cloudflare: {
    tier: 'UNICORN',
    difficultyMultiplier: 1.2,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '4-7%',
    competitionLevel: 'high',
    interviewBarDescription:
      'Edge computing and networking. Tests systems programming, networking fundamentals, and performance optimization.',
  },
  robinhood: {
    tier: 'UNICORN',
    difficultyMultiplier: 1.2,
    internMultiplier: 1.1,
    acceptanceRateEstimate: '4-7%',
    competitionLevel: 'high',
    interviewBarDescription:
      'Fintech with emphasis on reliability and security. Tests system design for financial systems and real-time trading.',
  },
  mongodb: {
    tier: 'UNICORN',
    difficultyMultiplier: 1.15,
    internMultiplier: 1.05,
    acceptanceRateEstimate: '5-8%',
    competitionLevel: 'high',
    interviewBarDescription:
      'Database internals and distributed systems focus. Tests storage engine knowledge and data modeling.',
  },

  // ── GROWTH ──────────────────────────────────────────────────────────
  // Growth-tier companies are typically inferred from JD signals,
  // but we include a few well-known ones for direct matching.
  linear: {
    tier: 'GROWTH',
    difficultyMultiplier: 1.1,
    internMultiplier: 1.05,
    acceptanceRateEstimate: '8-12%',
    competitionLevel: 'moderate',
    interviewBarDescription:
      'Small team with high craft standards. Tests product sense and engineering taste.',
  },
  supabase: {
    tier: 'GROWTH',
    difficultyMultiplier: 1.1,
    internMultiplier: 1.05,
    acceptanceRateEstimate: '8-12%',
    competitionLevel: 'moderate',
    interviewBarDescription:
      'Open source database platform. Tests PostgreSQL knowledge, API design, and developer tooling.',
  },
  retool: {
    tier: 'GROWTH',
    difficultyMultiplier: 1.1,
    internMultiplier: 1.05,
    acceptanceRateEstimate: '8-12%',
    competitionLevel: 'moderate',
    interviewBarDescription:
      'Internal tools platform. Tests full-stack engineering and product-minded development.',
  },
  cursor: {
    tier: 'GROWTH',
    difficultyMultiplier: 1.15,
    internMultiplier: 1.05,
    acceptanceRateEstimate: '5-10%',
    competitionLevel: 'high',
    interviewBarDescription:
      'AI-powered developer tools. Tests ML engineering, editor architecture, and developer experience design.',
  },
};

// Alias map built at module load from aliases fields
const ALIAS_MAP: Record<string, string> = {};
for (const [canonical, entry] of Object.entries(COMPANY_DATABASE)) {
  if (entry.aliases) {
    for (const alias of entry.aliases) {
      ALIAS_MAP[alias] = canonical;
    }
  }
}

/**
 * Normalizes a company name for database lookup.
 * Lowercases, strips suffixes (Inc, LLC, Corp, etc.), trims, and resolves aliases.
 */
export function normalizeCompanyName(name: string): string {
  let normalized = name
    .toLowerCase()
    .replace(/[,.]$/, '')
    .replace(
      /\s*(inc\.?|llc\.?|corp\.?|corporation|co\.?|ltd\.?|limited|plc|group|holdings|technologies|technology|labs|laboratory|laboratories)\s*$/gi,
      ''
    )
    .trim();

  // Check alias map
  if (ALIAS_MAP[normalized]) {
    normalized = ALIAS_MAP[normalized];
  }

  return normalized;
}

// JD keyword patterns for tier inference when company is unknown
const TIER_INFERENCE_PATTERNS: { pattern: RegExp; tier: CompanyTier; multiplier: number }[] = [
  { pattern: /fortune\s*100\b/i, tier: 'BIG_TECH', multiplier: 1.2 },
  { pattern: /fortune\s*500\b/i, tier: 'BIG_TECH', multiplier: 1.15 },
  { pattern: /series\s*[de]\b/i, tier: 'UNICORN', multiplier: 1.15 },
  { pattern: /series\s*[bc]\b/i, tier: 'GROWTH', multiplier: 1.1 },
  { pattern: /series\s*a\b/i, tier: 'GROWTH', multiplier: 1.05 },
  { pattern: /\bunicorn\b/i, tier: 'UNICORN', multiplier: 1.15 },
  { pattern: /ipo|pre-ipo|publicly\s*traded/i, tier: 'BIG_TECH', multiplier: 1.15 },
  { pattern: /faang|big\s*tech|top-tier\s*tech/i, tier: 'FAANG_PLUS', multiplier: 1.3 },
  { pattern: /hedge\s*fund|quant\s*fund/i, tier: 'TOP_FINANCE', multiplier: 1.3 },
  { pattern: /investment\s*bank/i, tier: 'TOP_FINANCE', multiplier: 1.25 },
  { pattern: /private\s*equity/i, tier: 'TOP_FINANCE', multiplier: 1.3 },
];

// Differentiation strategy templates per tier
const DIFFERENTIATION_STRATEGIES: Record<CompanyTier, string[]> = {
  FAANG_PLUS: [
    'Demonstrate system design thinking at scale — discuss trade-offs with specific numbers (QPS, latency, storage)',
    'Lead with metrics: quantify every achievement with business impact (revenue, users, performance gains)',
    'Show depth in one area rather than breadth — FAANG interviewers value T-shaped expertise',
    'Prepare company-specific behavioral stories using their leadership principles or core values',
    'Practice explaining complex technical concepts simply — communication is a hidden bar',
    'Build or contribute to open-source projects that demonstrate algorithmic sophistication',
    'Research recent company blog posts and reference their specific technical challenges in your answers',
    'Prepare 2-3 stories showing ownership of end-to-end projects from design to production',
  ],
  BIG_TECH: [
    'Highlight cross-functional collaboration stories that show product thinking',
    'Demonstrate understanding of their specific tech stack and architecture patterns',
    'Show metrics-driven decision making with A/B testing and data-informed approaches',
    'Prepare examples of technical trade-offs you made and their business impact',
    'Research the company engineering blog and reference specific technical decisions',
    'Demonstrate ability to work autonomously while aligning with team goals',
  ],
  TOP_FINANCE: [
    'Combine technical depth with financial domain knowledge — show you understand the business',
    'Demonstrate experience with low-latency systems, real-time data, or high-throughput processing',
    'Prepare for probability and statistics questions even for engineering roles',
    'Show attention to detail and precision — errors in finance have outsized consequences',
    'Highlight any experience with regulatory compliance, data security, or audit trails',
    'Prepare examples of working under pressure with strict deadlines',
  ],
  UNICORN: [
    'Show scrappiness and ability to ship fast with quality — unicorns value speed',
    'Demonstrate full-stack thinking even if applying for a specialized role',
    'Highlight experience building 0-to-1 products or features with ambiguous requirements',
    'Show product sense — explain how technical decisions impact user experience',
    'Prepare examples of wearing multiple hats and adapting to changing priorities',
    'Demonstrate passion for the company mission and product with specific usage examples',
  ],
  GROWTH: [
    'Emphasize adaptability and willingness to work across the stack',
    'Show examples of building with limited resources and making pragmatic trade-offs',
    'Demonstrate initiative and ability to identify and solve problems autonomously',
    'Highlight experience with rapid iteration and shipping incrementally',
  ],
  STANDARD: [],
};

/**
 * Generates differentiation strategies tailored to the candidate.
 * Selects relevant strategies from the tier templates and adds
 * context-specific ones based on JD and resume data.
 */
export function generateDifferentiationStrategies(
  tier: CompanyTier,
  experienceLevel: ExperienceLevel,
  jdData?: ExtractedJD,
  resumeData?: ExtractedResume
): string[] {
  const strategies: string[] = [];

  // Base strategies from tier
  const tierStrategies = DIFFERENTIATION_STRATEGIES[tier];
  strategies.push(...tierStrategies.slice(0, 4));

  // Add intern-specific strategy
  if (experienceLevel === 'intern') {
    strategies.push(
      'As an intern candidate, emphasize relevant coursework, personal projects, and learning velocity over years of experience'
    );
  }

  // Add JD-specific strategy if keywords suggest certain focus areas
  if (jdData) {
    const jdText = [...jdData.mustHave, ...jdData.niceToHave, ...jdData.keywords]
      .join(' ')
      .toLowerCase();
    if (jdText.includes('machine learning') || jdText.includes('ml') || jdText.includes('ai')) {
      strategies.push(
        'Prepare to discuss ML model lifecycle: training, evaluation, deployment, and monitoring in production'
      );
    }
    if (jdText.includes('distributed') || jdText.includes('microservices')) {
      strategies.push(
        'Prepare distributed systems design examples with specific discussion of consistency, availability, and partition tolerance trade-offs'
      );
    }
  }

  // Add resume-gap strategy
  if (resumeData && resumeData.metrics.length < 3) {
    strategies.push(
      'Quantify your impact before the interview — add specific numbers to every project (users served, latency reduced, revenue impact)'
    );
  }

  // Cap at 6 strategies
  return strategies.slice(0, 6);
}

/**
 * Computes company difficulty context from company name, experience level, and JD/resume data.
 * Deterministic computation — same inputs always produce same outputs.
 */
export function computeCompanyDifficulty(
  companyName: string | undefined,
  experienceLevel: ExperienceLevel,
  jdData?: ExtractedJD,
  resumeData?: ExtractedResume
): CompanyDifficultyContext {
  const isIntern = experienceLevel === 'intern';
  const resolvedName = companyName ? normalizeCompanyName(companyName) : '';

  // Direct database lookup
  const entry = resolvedName ? COMPANY_DATABASE[resolvedName] : undefined;

  if (entry) {
    const baseMultiplier = entry.difficultyMultiplier;
    const adjustmentFactor = isIntern
      ? Math.round(baseMultiplier * entry.internMultiplier * 100) / 100
      : baseMultiplier;

    // Cap at 1.50
    const cappedFactor = Math.min(1.5, adjustmentFactor);

    return {
      companyName: companyName ?? resolvedName,
      tier: entry.tier,
      difficultyScore: Math.round(cappedFactor * 100),
      isIntern,
      acceptanceRateEstimate: entry.acceptanceRateEstimate,
      competitionLevel: entry.competitionLevel,
      interviewBarDescription: entry.interviewBarDescription,
      adjustmentFactor: cappedFactor,
      differentiationStrategies: generateDifferentiationStrategies(
        entry.tier,
        experienceLevel,
        jdData,
        resumeData
      ),
      version: COMPANY_DIFFICULTY_VERSION,
    };
  }

  // Infer from JD keywords when company is unknown or not in database
  const jdFullText = jdData
    ? [
        jdData.companyName ?? '',
        ...jdData.mustHave,
        ...jdData.niceToHave,
        ...jdData.keywords,
        ...jdData.senioritySignals,
      ].join(' ')
    : '';

  for (const { pattern, tier, multiplier } of TIER_INFERENCE_PATTERNS) {
    if (pattern.test(jdFullText)) {
      const adjustmentFactor = isIntern ? Math.round(multiplier * 1.1 * 100) / 100 : multiplier;
      const cappedFactor = Math.min(1.5, adjustmentFactor);

      const tierMeta = getTierMeta(tier);

      return {
        companyName: companyName ?? 'Unknown',
        tier,
        difficultyScore: Math.round(cappedFactor * 100),
        isIntern,
        acceptanceRateEstimate: tierMeta.acceptanceRate,
        competitionLevel: tierMeta.competitionLevel,
        interviewBarDescription: tierMeta.barDescription,
        adjustmentFactor: cappedFactor,
        differentiationStrategies: generateDifferentiationStrategies(
          tier,
          experienceLevel,
          jdData,
          resumeData
        ),
        version: COMPANY_DIFFICULTY_VERSION,
      };
    }
  }

  // STANDARD fallback
  return {
    companyName: companyName ?? 'Unknown',
    tier: 'STANDARD',
    difficultyScore: 100,
    isIntern,
    acceptanceRateEstimate: '10-20%',
    competitionLevel: 'moderate',
    interviewBarDescription:
      'Standard interview process. Focus on demonstrating core competencies and cultural fit.',
    adjustmentFactor: 1.0,
    differentiationStrategies: [],
    version: COMPANY_DIFFICULTY_VERSION,
  };
}

/** Provides fallback metadata for inferred tiers (not specific companies). */
function getTierMeta(tier: CompanyTier): {
  acceptanceRate: string;
  competitionLevel: CompetitionLevel;
  barDescription: string;
} {
  const meta: Record<
    CompanyTier,
    { acceptanceRate: string; competitionLevel: CompetitionLevel; barDescription: string }
  > = {
    FAANG_PLUS: {
      acceptanceRate: '1-3%',
      competitionLevel: 'extreme',
      barDescription:
        'Top-tier company with extremely competitive interview process. Expect multiple technical and behavioral rounds with high rejection rates.',
    },
    BIG_TECH: {
      acceptanceRate: '3-7%',
      competitionLevel: 'very_high',
      barDescription:
        'Major tech company with rigorous interview loop. Expect coding, system design, and behavioral rounds.',
    },
    TOP_FINANCE: {
      acceptanceRate: '2-5%',
      competitionLevel: 'very_high',
      barDescription:
        'Top financial institution with demanding interview process. Expect technical rounds plus domain-specific assessment.',
    },
    UNICORN: {
      acceptanceRate: '4-8%',
      competitionLevel: 'high',
      barDescription:
        'High-growth company with selective hiring. Expect focus on product thinking and technical depth.',
    },
    GROWTH: {
      acceptanceRate: '8-15%',
      competitionLevel: 'moderate',
      barDescription:
        'Growth-stage company with standard technical interview process. Values adaptability and shipping speed.',
    },
    STANDARD: {
      acceptanceRate: '10-20%',
      competitionLevel: 'moderate',
      barDescription:
        'Standard interview process. Focus on demonstrating core competencies and cultural fit.',
    },
  };

  return meta[tier];
}
