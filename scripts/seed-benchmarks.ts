/**
 * Seed script for competency_benchmarks table.
 *
 * Generates calibrated benchmarks from the formula:
 *   base × tierMultiplier × roleMultiplier
 *
 * When scraped/data-backed benchmarks are available, they override formula values.
 * Run: npm run seed-benchmarks
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Types ───────────────────────────────────────────────────────────────

type CompanyTier = 'FAANG_PLUS' | 'BIG_TECH' | 'TOP_FINANCE' | 'UNICORN' | 'GROWTH' | 'STANDARD';
type InferredSeniority = 'Intern' | 'Junior' | 'Mid-Level' | 'Senior' | 'Staff+' | 'Unknown';
type RoleType =
  | 'backend'
  | 'frontend'
  | 'fullstack'
  | 'ml_ai'
  | 'data'
  | 'devops_infra'
  | 'mobile'
  | 'systems'
  | 'security'
  | 'management'
  | 'general';
type Confidence = 'data_backed' | 'calibrated' | 'estimated';

interface BenchmarkRow {
  company_tier: CompanyTier;
  seniority: InferredSeniority;
  role_type: RoleType;
  domain: string;
  target_score: number;
  confidence: Confidence;
  source_notes: string;
  company_name: string | null;
}

// ── Constants ───────────────────────────────────────────────────────────

const DOMAINS = [
  'System Design',
  'Coding / Algorithms',
  'Behavioral',
  'Communication',
  'Domain Knowledge',
  'Technical Depth',
  'Problem Solving',
  'Leadership / Collab',
];

const SENIORITIES: InferredSeniority[] = [
  'Intern',
  'Junior',
  'Mid-Level',
  'Senior',
  'Staff+',
  'Unknown',
];

const TIERS: CompanyTier[] = [
  'FAANG_PLUS',
  'BIG_TECH',
  'TOP_FINANCE',
  'UNICORN',
  'GROWTH',
  'STANDARD',
];

const ROLE_TYPES: RoleType[] = [
  'backend',
  'frontend',
  'fullstack',
  'ml_ai',
  'data',
  'devops_infra',
  'mobile',
  'systems',
  'security',
  'management',
  'general',
];

// Base scores per seniority per domain (same as competency-heatmap.ts)
const BASE_BENCHMARKS: Record<InferredSeniority, Record<string, number>> = {
  Intern: {
    'System Design': 25,
    'Coding / Algorithms': 50,
    Behavioral: 30,
    Communication: 30,
    'Domain Knowledge': 25,
    'Technical Depth': 35,
    'Problem Solving': 45,
    'Leadership / Collab': 20,
  },
  Junior: {
    'System Design': 35,
    'Coding / Algorithms': 55,
    Behavioral: 45,
    Communication: 45,
    'Domain Knowledge': 35,
    'Technical Depth': 50,
    'Problem Solving': 55,
    'Leadership / Collab': 30,
  },
  'Mid-Level': {
    'System Design': 55,
    'Coding / Algorithms': 65,
    Behavioral: 55,
    Communication: 55,
    'Domain Knowledge': 55,
    'Technical Depth': 65,
    'Problem Solving': 65,
    'Leadership / Collab': 50,
  },
  Senior: {
    'System Design': 72,
    'Coding / Algorithms': 72,
    Behavioral: 70,
    Communication: 70,
    'Domain Knowledge': 72,
    'Technical Depth': 75,
    'Problem Solving': 75,
    'Leadership / Collab': 70,
  },
  'Staff+': {
    'System Design': 88,
    'Coding / Algorithms': 75,
    Behavioral: 85,
    Communication: 88,
    'Domain Knowledge': 88,
    'Technical Depth': 90,
    'Problem Solving': 88,
    'Leadership / Collab': 90,
  },
  Unknown: {
    'System Design': 50,
    'Coding / Algorithms': 55,
    Behavioral: 50,
    Communication: 50,
    'Domain Knowledge': 50,
    'Technical Depth': 55,
    'Problem Solving': 55,
    'Leadership / Collab': 45,
  },
};

const TIER_MULTIPLIERS: Record<CompanyTier, number> = {
  FAANG_PLUS: 1.3,
  BIG_TECH: 1.18,
  TOP_FINANCE: 1.22,
  UNICORN: 1.12,
  GROWTH: 1.05,
  STANDARD: 1.0,
};

const ROLE_DOMAIN_MULTIPLIERS: Record<RoleType, Partial<Record<string, number>>> = {
  backend: { 'System Design': 1.15, 'Coding / Algorithms': 1.1, 'Technical Depth': 1.1 },
  frontend: { Communication: 1.1, 'Domain Knowledge': 1.05, 'System Design': 0.9 },
  fullstack: { 'System Design': 1.05, 'Coding / Algorithms': 1.05, 'Domain Knowledge': 1.05 },
  ml_ai: {
    'Technical Depth': 1.2,
    'Domain Knowledge': 1.15,
    'Coding / Algorithms': 1.05,
    'System Design': 0.95,
  },
  data: { 'Domain Knowledge': 1.15, 'Technical Depth': 1.1, 'Problem Solving': 1.1 },
  devops_infra: { 'System Design': 1.2, 'Technical Depth': 1.1, 'Coding / Algorithms': 0.9 },
  mobile: { 'Domain Knowledge': 1.1, 'Technical Depth': 1.05, 'System Design': 0.9 },
  systems: { 'System Design': 1.15, 'Technical Depth': 1.15, 'Coding / Algorithms': 1.1 },
  security: { 'Technical Depth': 1.2, 'Domain Knowledge': 1.15, 'System Design': 1.05 },
  management: {
    'Leadership / Collab': 1.2,
    Communication: 1.15,
    Behavioral: 1.1,
    'Coding / Algorithms': 0.8,
  },
  general: {},
};

// ── Company-specific overrides (data-informed) ──────────────────────────
// These are hand-calibrated based on known interview difficulty signals.

interface CompanyOverride {
  company: string;
  tier: CompanyTier;
  domainAdjustments: Partial<Record<string, number>>; // multiplier on top of tier benchmark
  confidence: Confidence;
  source: string;
}

const COMPANY_OVERRIDES: CompanyOverride[] = [
  {
    company: 'amazon',
    tier: 'FAANG_PLUS',
    domainAdjustments: {
      Behavioral: 1.15, // Leadership Principles dominate
      'System Design': 1.1,
      'Leadership / Collab': 1.15,
    },
    confidence: 'calibrated',
    source: 'Amazon LP-heavy interview structure',
  },
  {
    company: 'google',
    tier: 'FAANG_PLUS',
    domainAdjustments: {
      'Coding / Algorithms': 1.12,
      'System Design': 1.1,
      'Problem Solving': 1.1,
    },
    confidence: 'calibrated',
    source: 'Google algorithmic interview emphasis',
  },
  {
    company: 'meta',
    tier: 'FAANG_PLUS',
    domainAdjustments: {
      'Coding / Algorithms': 1.15,
      'System Design': 1.12,
    },
    confidence: 'calibrated',
    source: 'Meta move-fast coding emphasis',
  },
  {
    company: 'apple',
    tier: 'FAANG_PLUS',
    domainAdjustments: {
      'Domain Knowledge': 1.15,
      'Technical Depth': 1.1,
      Communication: 1.05,
    },
    confidence: 'calibrated',
    source: 'Apple domain expertise and craft focus',
  },
  {
    company: 'stripe',
    tier: 'BIG_TECH',
    domainAdjustments: {
      'Coding / Algorithms': 1.15,
      'Technical Depth': 1.1,
    },
    confidence: 'calibrated',
    source: 'Stripe high coding bar + bug squash format',
  },
  {
    company: 'jane street',
    tier: 'FAANG_PLUS',
    domainAdjustments: {
      'Problem Solving': 1.2,
      'Coding / Algorithms': 1.15,
      'Domain Knowledge': 1.2,
    },
    confidence: 'calibrated',
    source: 'Jane Street quant/probability focus',
  },
  {
    company: 'citadel',
    tier: 'FAANG_PLUS',
    domainAdjustments: {
      'Problem Solving': 1.2,
      'Coding / Algorithms': 1.15,
      'Technical Depth': 1.1,
    },
    confidence: 'calibrated',
    source: 'Citadel quant interview structure',
  },
  {
    company: 'openai',
    tier: 'FAANG_PLUS',
    domainAdjustments: {
      'Technical Depth': 1.15,
      'Domain Knowledge': 1.2,
      'Problem Solving': 1.1,
    },
    confidence: 'calibrated',
    source: 'OpenAI ML/AI depth requirements',
  },
  {
    company: 'palantir',
    tier: 'BIG_TECH',
    domainAdjustments: {
      'Problem Solving': 1.15,
      'System Design': 1.1,
    },
    confidence: 'calibrated',
    source: 'Palantir decomposition interview format',
  },

  // ── FAANG_PLUS (remaining) ─────────────────────────────────────────
  {
    company: 'netflix',
    tier: 'FAANG_PLUS',
    domainAdjustments: {
      Behavioral: 1.15,
      'Domain Knowledge': 1.12,
      'Leadership / Collab': 1.1,
    },
    confidence: 'calibrated',
    source: 'Netflix ownership/judgment-heavy senior bar',
  },
  {
    company: 'microsoft',
    tier: 'FAANG_PLUS',
    domainAdjustments: {
      'Coding / Algorithms': 1.08,
      'System Design': 1.08,
      'Leadership / Collab': 1.1,
    },
    confidence: 'calibrated',
    source: 'Microsoft growth mindset + balanced loop',
  },
  {
    company: 'nvidia',
    tier: 'FAANG_PLUS',
    domainAdjustments: {
      'Technical Depth': 1.18,
      'System Design': 1.12,
      'Domain Knowledge': 1.15,
    },
    confidence: 'calibrated',
    source: 'NVIDIA GPU/CUDA systems depth + HW-SW co-design',
  },
  {
    company: 'anthropic',
    tier: 'FAANG_PLUS',
    domainAdjustments: {
      'Technical Depth': 1.15,
      'Domain Knowledge': 1.18,
      'Problem Solving': 1.12,
      Communication: 1.08,
    },
    confidence: 'calibrated',
    source: 'Anthropic AI safety + research depth + thoughtful reasoning',
  },
  {
    company: 'two sigma',
    tier: 'FAANG_PLUS',
    domainAdjustments: {
      'Problem Solving': 1.18,
      'Domain Knowledge': 1.15,
      'System Design': 1.08,
    },
    confidence: 'calibrated',
    source: 'Two Sigma statistical reasoning + ML + systems thinking',
  },
  {
    company: 'de shaw',
    tier: 'FAANG_PLUS',
    domainAdjustments: {
      'Coding / Algorithms': 1.15,
      'Problem Solving': 1.18,
      'System Design': 1.1,
    },
    confidence: 'calibrated',
    source: 'D.E. Shaw algorithmic depth + probability + system design',
  },

  // ── BIG_TECH (remaining) ───────────────────────────────────────────
  {
    company: 'uber',
    tier: 'BIG_TECH',
    domainAdjustments: {
      'System Design': 1.15,
      'Coding / Algorithms': 1.1,
      'Technical Depth': 1.08,
    },
    confidence: 'calibrated',
    source: 'Uber distributed systems + real-time scalability focus',
  },
  {
    company: 'airbnb',
    tier: 'BIG_TECH',
    domainAdjustments: {
      Behavioral: 1.15,
      'Leadership / Collab': 1.12,
      Communication: 1.08,
    },
    confidence: 'calibrated',
    source: 'Airbnb culture-fit + belonging values + cross-functional',
  },
  {
    company: 'salesforce',
    tier: 'BIG_TECH',
    domainAdjustments: {
      'Domain Knowledge': 1.1,
      'System Design': 1.08,
      Behavioral: 1.08,
    },
    confidence: 'calibrated',
    source: 'Salesforce cloud platform + customer success mindset',
  },
  {
    company: 'shopify',
    tier: 'BIG_TECH',
    domainAdjustments: {
      Behavioral: 1.12,
      'Problem Solving': 1.08,
      'Leadership / Collab': 1.1,
    },
    confidence: 'calibrated',
    source: 'Shopify life story interview + entrepreneurial builder mentality',
  },
  {
    company: 'spotify',
    tier: 'BIG_TECH',
    domainAdjustments: {
      'Leadership / Collab': 1.12,
      Behavioral: 1.08,
      'Domain Knowledge': 1.08,
    },
    confidence: 'calibrated',
    source: 'Spotify autonomous squads + data-driven collaboration',
  },
  {
    company: 'linkedin',
    tier: 'BIG_TECH',
    domainAdjustments: {
      'System Design': 1.1,
      'Coding / Algorithms': 1.08,
      Behavioral: 1.08,
    },
    confidence: 'calibrated',
    source: 'LinkedIn standard big tech loop + transformation culture',
  },
  {
    company: 'twitter',
    tier: 'BIG_TECH',
    domainAdjustments: {
      'System Design': 1.12,
      'Technical Depth': 1.1,
      'Coding / Algorithms': 1.08,
    },
    confidence: 'calibrated',
    source: 'Twitter real-time systems + data pipelines + scaling',
  },
  {
    company: 'snap',
    tier: 'BIG_TECH',
    domainAdjustments: {
      'Domain Knowledge': 1.12,
      'Technical Depth': 1.1,
      'System Design': 1.05,
    },
    confidence: 'calibrated',
    source: 'Snap mobile/AR/VR + camera systems + real-time processing',
  },
  {
    company: 'tiktok',
    tier: 'BIG_TECH',
    domainAdjustments: {
      'Coding / Algorithms': 1.12,
      'Domain Knowledge': 1.1,
      'System Design': 1.08,
    },
    confidence: 'calibrated',
    source: 'TikTok algorithms + recommendation systems + large-scale data',
  },
  {
    company: 'oracle',
    tier: 'BIG_TECH',
    domainAdjustments: {
      'System Design': 1.12,
      'Technical Depth': 1.1,
      'Domain Knowledge': 1.08,
    },
    confidence: 'calibrated',
    source: 'Oracle database internals + cloud infra + system design',
  },
  {
    company: 'adobe',
    tier: 'BIG_TECH',
    domainAdjustments: {
      'System Design': 1.1,
      Communication: 1.08,
      'Domain Knowledge': 1.08,
    },
    confidence: 'calibrated',
    source: 'Adobe software architecture + UX thinking + creative tech',
  },
  {
    company: 'databricks',
    tier: 'BIG_TECH',
    domainAdjustments: {
      'System Design': 1.15,
      'Technical Depth': 1.12,
      'Domain Knowledge': 1.1,
    },
    confidence: 'calibrated',
    source: 'Databricks Spark + distributed systems + data platform',
  },
  {
    company: 'snowflake',
    tier: 'BIG_TECH',
    domainAdjustments: {
      'System Design': 1.12,
      'Technical Depth': 1.1,
      'Domain Knowledge': 1.1,
    },
    confidence: 'calibrated',
    source: 'Snowflake cloud data + database internals + system design',
  },

  // ── TOP_FINANCE (remaining) ────────────────────────────────────────
  {
    company: 'goldman sachs',
    tier: 'TOP_FINANCE',
    domainAdjustments: {
      'Domain Knowledge': 1.12,
      'System Design': 1.1,
      Behavioral: 1.1,
    },
    confidence: 'calibrated',
    source: 'Goldman Sachs superday + financial knowledge + system design for eng',
  },
  {
    company: 'jp morgan',
    tier: 'TOP_FINANCE',
    domainAdjustments: {
      'Domain Knowledge': 1.1,
      Behavioral: 1.12,
      'Leadership / Collab': 1.1,
    },
    confidence: 'calibrated',
    source: 'JP Morgan HireVue + financial acumen + leadership potential',
  },
  {
    company: 'morgan stanley',
    tier: 'TOP_FINANCE',
    domainAdjustments: {
      'Coding / Algorithms': 1.1,
      'Domain Knowledge': 1.1,
      'Technical Depth': 1.08,
    },
    confidence: 'calibrated',
    source: 'Morgan Stanley coding bars (tech) + market knowledge (finance)',
  },
  {
    company: 'blackstone',
    tier: 'TOP_FINANCE',
    domainAdjustments: {
      'Domain Knowledge': 1.18,
      'Problem Solving': 1.12,
      'Leadership / Collab': 1.1,
    },
    confidence: 'calibrated',
    source: 'Blackstone PE/LBO modeling + deal analysis + leadership',
  },
  {
    company: 'blackrock',
    tier: 'TOP_FINANCE',
    domainAdjustments: {
      'Problem Solving': 1.1,
      'Domain Knowledge': 1.12,
      'Technical Depth': 1.08,
    },
    confidence: 'calibrated',
    source: 'BlackRock quantitative skills + market understanding + Aladdin',
  },
  {
    company: 'bloomberg',
    tier: 'TOP_FINANCE',
    domainAdjustments: {
      'Coding / Algorithms': 1.15,
      'Technical Depth': 1.12,
      'Domain Knowledge': 1.08,
    },
    confidence: 'calibrated',
    source: 'Bloomberg C++ coding bar + data structures + financial data',
  },
  {
    company: 'bank of america',
    tier: 'TOP_FINANCE',
    domainAdjustments: {
      Behavioral: 1.12,
      'Leadership / Collab': 1.1,
      Communication: 1.08,
    },
    confidence: 'calibrated',
    source: 'Bank of America teamwork + client-focused behavioral',
  },
  {
    company: 'barclays',
    tier: 'TOP_FINANCE',
    domainAdjustments: {
      Behavioral: 1.1,
      'Domain Knowledge': 1.1,
      Communication: 1.08,
    },
    confidence: 'calibrated',
    source: 'Barclays assessment centers + global markets',
  },
  {
    company: 'kkr',
    tier: 'TOP_FINANCE',
    domainAdjustments: {
      'Domain Knowledge': 1.18,
      'Problem Solving': 1.15,
      Behavioral: 1.08,
    },
    confidence: 'calibrated',
    source: 'KKR case studies + LBO modeling + deal judgment',
  },
  {
    company: 'point72',
    tier: 'TOP_FINANCE',
    domainAdjustments: {
      'Problem Solving': 1.15,
      'Domain Knowledge': 1.12,
      'Technical Depth': 1.1,
    },
    confidence: 'calibrated',
    source: 'Point72 statistical reasoning + market intuition + analytical rigor',
  },

  // ── UNICORN (remaining) ────────────────────────────────────────────
  {
    company: 'figma',
    tier: 'UNICORN',
    domainAdjustments: {
      Communication: 1.12,
      'Domain Knowledge': 1.1,
      'Problem Solving': 1.08,
    },
    confidence: 'calibrated',
    source: 'Figma design-engineering + product thinking + frontend',
  },
  {
    company: 'notion',
    tier: 'UNICORN',
    domainAdjustments: {
      'Coding / Algorithms': 1.1,
      'Problem Solving': 1.08,
      Communication: 1.08,
    },
    confidence: 'calibrated',
    source: 'Notion product sense + clean code + full-stack',
  },
  {
    company: 'vercel',
    tier: 'UNICORN',
    domainAdjustments: {
      'Technical Depth': 1.12,
      'System Design': 1.1,
      'Domain Knowledge': 1.1,
    },
    confidence: 'calibrated',
    source: 'Vercel web performance + edge computing + frontend architecture',
  },
  {
    company: 'scale ai',
    tier: 'UNICORN',
    domainAdjustments: {
      'System Design': 1.12,
      'Technical Depth': 1.1,
      'Domain Knowledge': 1.1,
    },
    confidence: 'calibrated',
    source: 'Scale AI ML engineering + data pipeline system design',
  },
  {
    company: 'discord',
    tier: 'UNICORN',
    domainAdjustments: {
      'System Design': 1.15,
      'Technical Depth': 1.1,
      'Coding / Algorithms': 1.05,
    },
    confidence: 'calibrated',
    source: 'Discord real-time comms + distributed systems + WebSocket',
  },
  {
    company: 'coinbase',
    tier: 'UNICORN',
    domainAdjustments: {
      'Technical Depth': 1.12,
      'System Design': 1.1,
      'Domain Knowledge': 1.1,
    },
    confidence: 'calibrated',
    source: 'Coinbase security mindset + distributed systems + fintech',
  },
  {
    company: 'instacart',
    tier: 'UNICORN',
    domainAdjustments: {
      'Coding / Algorithms': 1.1,
      'System Design': 1.08,
      'Problem Solving': 1.08,
    },
    confidence: 'calibrated',
    source: 'Instacart algorithm design + marketplace optimization',
  },
  {
    company: 'doordash',
    tier: 'UNICORN',
    domainAdjustments: {
      'System Design': 1.12,
      'Coding / Algorithms': 1.08,
      'Problem Solving': 1.08,
    },
    confidence: 'calibrated',
    source: 'DoorDash logistics optimization + real-time data',
  },
  {
    company: 'plaid',
    tier: 'UNICORN',
    domainAdjustments: {
      'System Design': 1.1,
      'Technical Depth': 1.12,
      'Domain Knowledge': 1.1,
    },
    confidence: 'calibrated',
    source: 'Plaid API design + security + financial data systems',
  },
  {
    company: 'ramp',
    tier: 'UNICORN',
    domainAdjustments: {
      'Coding / Algorithms': 1.1,
      'Problem Solving': 1.1,
      Communication: 1.08,
    },
    confidence: 'calibrated',
    source: 'Ramp full-stack + product thinking + speed',
  },
  {
    company: 'rippling',
    tier: 'UNICORN',
    domainAdjustments: {
      'System Design': 1.1,
      'Coding / Algorithms': 1.1,
      'Problem Solving': 1.08,
    },
    confidence: 'calibrated',
    source: 'Rippling system design + coding speed + product-minded',
  },
  {
    company: 'anduril',
    tier: 'UNICORN',
    domainAdjustments: {
      'Technical Depth': 1.15,
      'System Design': 1.12,
      'Domain Knowledge': 1.1,
    },
    confidence: 'calibrated',
    source: 'Anduril real-time systems + C++/Rust + hardware-software',
  },
  {
    company: 'datadog',
    tier: 'UNICORN',
    domainAdjustments: {
      'System Design': 1.12,
      'Technical Depth': 1.1,
      'Coding / Algorithms': 1.08,
    },
    confidence: 'calibrated',
    source: 'Datadog distributed systems + data pipelines + performance',
  },
  {
    company: 'cloudflare',
    tier: 'UNICORN',
    domainAdjustments: {
      'Technical Depth': 1.12,
      'System Design': 1.12,
      'Domain Knowledge': 1.08,
    },
    confidence: 'calibrated',
    source: 'Cloudflare systems programming + networking + performance',
  },
  {
    company: 'robinhood',
    tier: 'UNICORN',
    domainAdjustments: {
      'System Design': 1.12,
      'Technical Depth': 1.1,
      'Domain Knowledge': 1.1,
    },
    confidence: 'calibrated',
    source: 'Robinhood reliability + security + financial system design',
  },
  {
    company: 'mongodb',
    tier: 'UNICORN',
    domainAdjustments: {
      'Technical Depth': 1.12,
      'System Design': 1.1,
      'Domain Knowledge': 1.1,
    },
    confidence: 'calibrated',
    source: 'MongoDB database internals + distributed systems + data modeling',
  },

  // ── GROWTH (remaining) ─────────────────────────────────────────────
  {
    company: 'linear',
    tier: 'GROWTH',
    domainAdjustments: {
      Communication: 1.12,
      'Problem Solving': 1.1,
      'Coding / Algorithms': 1.08,
    },
    confidence: 'calibrated',
    source: 'Linear product sense + engineering taste + craft',
  },
  {
    company: 'supabase',
    tier: 'GROWTH',
    domainAdjustments: {
      'Technical Depth': 1.12,
      'System Design': 1.1,
      'Domain Knowledge': 1.1,
    },
    confidence: 'calibrated',
    source: 'Supabase PostgreSQL + API design + developer tooling',
  },
  {
    company: 'retool',
    tier: 'GROWTH',
    domainAdjustments: {
      'Coding / Algorithms': 1.1,
      'Problem Solving': 1.08,
      Communication: 1.08,
    },
    confidence: 'calibrated',
    source: 'Retool full-stack + product-minded development',
  },
  {
    company: 'cursor',
    tier: 'GROWTH',
    domainAdjustments: {
      'Technical Depth': 1.15,
      'Domain Knowledge': 1.12,
      'Problem Solving': 1.1,
    },
    confidence: 'calibrated',
    source: 'Cursor ML engineering + editor architecture + DX',
  },
];

// ── Generation logic ────────────────────────────────────────────────────

function generateBenchmarks(): BenchmarkRow[] {
  const rows: BenchmarkRow[] = [];

  // 1. Generate tier-level benchmarks for all combinations
  for (const tier of TIERS) {
    for (const seniority of SENIORITIES) {
      for (const roleType of ROLE_TYPES) {
        for (const domain of DOMAINS) {
          const base = BASE_BENCHMARKS[seniority][domain] ?? 50;
          const tierMult = TIER_MULTIPLIERS[tier];
          const roleMult = ROLE_DOMAIN_MULTIPLIERS[roleType][domain] ?? 1.0;
          const raw = base * tierMult * roleMult;
          const targetScore = Math.max(0, Math.min(100, Math.round(raw)));

          rows.push({
            company_tier: tier,
            seniority,
            role_type: roleType,
            domain,
            target_score: targetScore,
            confidence: 'calibrated',
            source_notes: `Formula: base(${base}) × tier(${tierMult}) × role(${roleMult.toFixed(2)})`,
            company_name: null,
          });
        }
      }
    }
  }

  // 2. Generate company-specific overrides
  for (const override of COMPANY_OVERRIDES) {
    for (const seniority of SENIORITIES) {
      for (const roleType of ROLE_TYPES) {
        for (const domain of DOMAINS) {
          const base = BASE_BENCHMARKS[seniority][domain] ?? 50;
          const tierMult = TIER_MULTIPLIERS[override.tier];
          const roleMult = ROLE_DOMAIN_MULTIPLIERS[roleType][domain] ?? 1.0;
          const companyMult = override.domainAdjustments[domain] ?? 1.0;
          const raw = base * tierMult * roleMult * companyMult;
          const targetScore = Math.max(0, Math.min(100, Math.round(raw)));

          rows.push({
            company_tier: override.tier,
            seniority,
            role_type: roleType,
            domain,
            target_score: targetScore,
            confidence: override.confidence,
            source_notes: `${override.source} | base(${base}) × tier(${tierMult}) × role(${roleMult.toFixed(2)}) × company(${companyMult.toFixed(2)})`,
            company_name: override.company,
          });
        }
      }
    }
  }

  return rows;
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log('Generating competency benchmarks...');
  const rows = generateBenchmarks();
  console.log(`Generated ${rows.length} benchmark rows`);

  // Batch upsert in chunks of 500
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('competency_benchmarks').upsert(batch, {
      onConflict: 'company_tier,seniority,role_type,domain,company_name',
    });

    if (error) {
      console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error.message);
      process.exit(1);
    }

    inserted += batch.length;
    console.log(`  Upserted ${inserted} / ${rows.length} rows`);
  }

  console.log(`\nDone! ${inserted} benchmarks seeded successfully.`);

  // Print summary stats
  const tierCounts: Record<string, number> = {};
  const companyCounts: Record<string, number> = {};
  for (const row of rows) {
    tierCounts[row.company_tier] = (tierCounts[row.company_tier] ?? 0) + 1;
    if (row.company_name) {
      companyCounts[row.company_name] = (companyCounts[row.company_name] ?? 0) + 1;
    }
  }

  console.log('\nTier-level benchmarks:');
  for (const [tier, count] of Object.entries(tierCounts)) {
    console.log(`  ${tier}: ${count}`);
  }

  if (Object.keys(companyCounts).length > 0) {
    console.log('\nCompany-specific overrides:');
    for (const [company, count] of Object.entries(companyCounts)) {
      console.log(`  ${company}: ${count}`);
    }
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
