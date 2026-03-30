// ============================================
// Deterministic Resume Signal Extraction
// No LLM — keyword matching only
// ============================================

export interface ResumeSignals {
  detectedSkills: string[];
  hasLeadershipSignals: boolean;
  hasQuantifiedImpact: boolean;
  hasInternshipOnly: boolean;
  hasOpenSource: boolean;
  resumeDepth: 'thin' | 'moderate' | 'substantial';
}

const SKILL_KEYWORDS: Record<string, string[]> = {
  system_design: [
    'system design',
    'architecture',
    'microservice',
    'distributed system',
    'scalab',
    'load balanc',
    'caching',
    'api gateway',
    'message queue',
    'event-driven',
    'high availability',
    'fault toleran',
  ],
  algorithms: [
    'algorithm',
    'data structure',
    'leetcode',
    'dynamic programming',
    'binary search',
    'graph traversal',
    'competitive programming',
    'time complexity',
    'space complexity',
    'sorting',
    'hash map',
    'linked list',
  ],
  ml: [
    'machine learning',
    'deep learning',
    'neural network',
    'model training',
    'pytorch',
    'tensorflow',
    'scikit-learn',
    'nlp',
    'natural language processing',
    'computer vision',
    'reinforcement learning',
    'feature engineering',
    'hyperparameter',
    'gradient',
    'classification',
    'regression model',
  ],
  frontend: [
    'react',
    'vue',
    'angular',
    'next.js',
    'nextjs',
    'typescript',
    'javascript',
    'css',
    'tailwind',
    'frontend',
    'front-end',
    'responsive design',
    'web component',
    'accessibility',
    'a11y',
    'dom',
  ],
  backend: [
    'node.js',
    'express',
    'django',
    'flask',
    'spring boot',
    'fastapi',
    'rest api',
    'graphql',
    'grpc',
    'backend',
    'back-end',
    'server-side',
    'middleware',
    'authentication',
    'authorization',
  ],
  data: [
    'sql',
    'postgres',
    'mysql',
    'mongodb',
    'redis',
    'elasticsearch',
    'data pipeline',
    'etl',
    'data warehouse',
    'bigquery',
    'snowflake',
    'spark',
    'hadoop',
    'kafka',
    'airflow',
  ],
  cloud: [
    'aws',
    'azure',
    'gcp',
    'google cloud',
    'docker',
    'kubernetes',
    'terraform',
    'ci/cd',
    'devops',
    'cloud',
    'serverless',
    'lambda',
    'ec2',
    's3',
  ],
  mobile: [
    'ios',
    'android',
    'swift',
    'kotlin',
    'react native',
    'flutter',
    'mobile app',
    'xcode',
    'cocoapods',
  ],
  design_tools: [
    'figma',
    'sketch',
    'adobe xd',
    'invision',
    'prototyp',
    'wireframe',
    'user research',
    'usability test',
    'design system',
    'information architecture',
  ],
  product: [
    'product roadmap',
    'user story',
    'sprint planning',
    'agile',
    'scrum',
    'okr',
    'kpi',
    'a/b test',
    'product-market fit',
    'stakeholder',
    'go-to-market',
    'prioritiz',
  ],
};

const LEADERSHIP_KEYWORDS = [
  'led ',
  'lead ',
  'managed ',
  'mentored',
  'team lead',
  'tech lead',
  'staff engineer',
  'principal engineer',
  'director',
  'vp ',
  'vice president',
  'head of',
  'built a team',
  'grew the team',
  'cross-functional',
  'org-wide',
  'company-wide',
];

const IMPACT_PATTERNS = [
  /\d+%/,
  /\$[\d,.]+[kmb]?/i,
  /\d+x/,
  /\d+\s*(users|customers|clients|requests|transactions)/i,
  /increased|decreased|improved|reduced|grew|saved|generated/i,
  /revenue|cost|efficiency|performance|conversion|retention/i,
];

const INTERNSHIP_KEYWORDS = ['intern ', 'internship', 'summer analyst', 'co-op'];
const FULLTIME_KEYWORDS = [
  'full-time',
  'full time',
  'senior',
  'staff',
  'principal',
  'lead',
  'manager',
  'director',
  'promoted',
];

const OPENSOURCE_KEYWORDS = [
  'open source',
  'open-source',
  'contributor',
  'pull request',
  'github.com/',
  'maintained a',
  'npm package',
  'pypi',
  'crates.io',
];

function containsAny(text: string, keywords: string[]): boolean {
  for (const kw of keywords) {
    if (text.includes(kw)) return true;
  }
  return false;
}

function matchesAnyPattern(text: string, patterns: RegExp[]): boolean {
  for (const p of patterns) {
    if (p.test(text)) return true;
  }
  return false;
}

export function extractResumeSignals(resumeText: string): ResumeSignals {
  const text = resumeText.toLowerCase();

  // Detect skills
  const detectedSkills: string[] = [];
  for (const [skill, keywords] of Object.entries(SKILL_KEYWORDS)) {
    if (containsAny(text, keywords)) {
      detectedSkills.push(skill);
    }
  }

  // Leadership signals
  const hasLeadershipSignals = containsAny(text, LEADERSHIP_KEYWORDS);

  // Quantified impact
  const hasQuantifiedImpact = matchesAnyPattern(resumeText, IMPACT_PATTERNS);

  // Internship only (has intern keywords but no full-time signals)
  const hasInternMention = containsAny(text, INTERNSHIP_KEYWORDS);
  const hasFullTimeMention = containsAny(text, FULLTIME_KEYWORDS);
  const hasInternshipOnly = hasInternMention && !hasFullTimeMention;

  // Open source
  const hasOpenSource = containsAny(text, OPENSOURCE_KEYWORDS);

  // Resume depth by character count
  const len = resumeText.trim().length;
  const resumeDepth: ResumeSignals['resumeDepth'] =
    len < 800 ? 'thin' : len < 2500 ? 'moderate' : 'substantial';

  return {
    detectedSkills,
    hasLeadershipSignals,
    hasQuantifiedImpact,
    hasInternshipOnly,
    hasOpenSource,
    resumeDepth,
  };
}
