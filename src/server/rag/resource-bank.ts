import type { InterviewTimeline } from '@/types';

const RESOURCE_BANK_VERSION = 'v0.1';

type ResourceDuration = 'quick' | 'short' | 'medium' | 'long';

export interface CuratedResource {
  id: string;
  title: string;
  url: string;
  platform: string;
  topics: string[];
  duration: ResourceDuration;
  // quick = <30min | short = 30min-2hrs | medium = 2-8hrs | long = 8+hrs
  description: string;
}

// Timeline → acceptable durations mapping
const TIMELINE_DURATIONS: Record<InterviewTimeline, ResourceDuration[]> = {
  '1day': ['quick'],
  '3days': ['quick', 'short'],
  '1week': ['quick', 'short', 'medium'],
  '2weeks': ['quick', 'short', 'medium'],
  '4weeks_plus': ['quick', 'short', 'medium', 'long'],
};

export const RESOURCE_BANK: CuratedResource[] = [
  // ── Algorithms & Data Structures ──────────────────────────────────
  {
    id: 'grind75',
    title: 'Grind 75',
    url: 'https://www.techinterviewhandbook.org/grind75',
    platform: 'techinterviewhandbook',
    topics: ['algorithms', 'data-structures', 'leetcode', 'coding'],
    duration: 'medium',
    description: 'Curated 75 LeetCode questions with optimal study schedule',
  },
  {
    id: 'neetcode-roadmap',
    title: 'NeetCode Roadmap',
    url: 'https://neetcode.io/roadmap',
    platform: 'neetcode',
    topics: ['algorithms', 'data-structures', 'leetcode', 'coding'],
    duration: 'long',
    description: 'Structured roadmap of 150 LeetCode problems grouped by pattern',
  },
  {
    id: 'neetcode-150',
    title: 'NeetCode 150',
    url: 'https://neetcode.io/practice',
    platform: 'neetcode',
    topics: ['algorithms', 'data-structures', 'coding'],
    duration: 'long',
    description: 'Practice 150 curated problems covering all major patterns',
  },
  {
    id: 'blind75',
    title: 'Blind 75 LeetCode Questions',
    url: 'https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions',
    platform: 'leetcode',
    topics: ['algorithms', 'data-structures', 'coding'],
    duration: 'long',
    description: 'The original 75 must-do LeetCode problems for interview prep',
  },
  {
    id: 'leetcode-patterns',
    title: 'LeetCode Patterns',
    url: 'https://seanprashad.com/leetcode-patterns/',
    platform: 'leetcode',
    topics: ['algorithms', 'data-structures', 'coding', 'patterns'],
    duration: 'medium',
    description: 'Pattern-based approach to solving LeetCode problems',
  },
  {
    id: 'big-o-cheatsheet',
    title: 'Big-O Cheat Sheet',
    url: 'https://www.bigocheatsheet.com/',
    platform: 'bigocheatsheet',
    topics: ['algorithms', 'data-structures', 'complexity'],
    duration: 'quick',
    description: 'Quick reference for time/space complexity of common algorithms',
  },
  {
    id: 'visualgo',
    title: 'VisuAlgo',
    url: 'https://visualgo.net/',
    platform: 'visualgo',
    topics: ['algorithms', 'data-structures'],
    duration: 'short',
    description: 'Interactive visualizations of algorithms and data structures',
  },

  // ── System Design ─────────────────────────────────────────────────
  {
    id: 'bytebytego-system-design',
    title: 'System Design 101 by ByteByteGo',
    url: 'https://github.com/ByteByteGoHq/system-design-101',
    platform: 'github',
    topics: ['system-design', 'architecture', 'distributed-systems'],
    duration: 'medium',
    description: 'Visual guide to system design concepts with clear diagrams',
  },
  {
    id: 'system-design-primer',
    title: 'System Design Primer',
    url: 'https://github.com/donnemartin/system-design-primer',
    platform: 'github',
    topics: ['system-design', 'architecture', 'distributed-systems', 'scalability'],
    duration: 'long',
    description: 'Comprehensive system design interview prep with solutions',
  },
  {
    id: 'grokking-system-design-github',
    title: 'Grokking System Design (Free Notes)',
    url: 'https://github.com/sharanyaa/grok_sdi_educative',
    platform: 'github',
    topics: ['system-design', 'architecture'],
    duration: 'medium',
    description: 'Community notes from Grokking the System Design Interview',
  },
  {
    id: 'system-design-youtube-gaurav',
    title: 'System Design by Gaurav Sen',
    url: 'https://www.youtube.com/playlist?list=PLMCXHnjXnTnvo6alSjVkgxV-VH6EPyvoX',
    platform: 'youtube',
    topics: ['system-design', 'architecture', 'distributed-systems'],
    duration: 'medium',
    description: 'YouTube playlist covering common system design interview questions',
  },
  {
    id: 'highscalability',
    title: 'High Scalability Blog',
    url: 'http://highscalability.com/all-time-favorites/',
    platform: 'highscalability',
    topics: ['system-design', 'scalability', 'architecture'],
    duration: 'short',
    description: 'Real-world architecture case studies from top companies',
  },

  // ── Behavioral / STAR ─────────────────────────────────────────────
  {
    id: 'tech-interview-handbook-behavioral',
    title: 'Tech Interview Handbook — Behavioral',
    url: 'https://www.techinterviewhandbook.org/behavioral-interview/',
    platform: 'techinterviewhandbook',
    topics: ['behavioral', 'star', 'soft-skills'],
    duration: 'short',
    description: 'Structured guide to behavioral interview prep with STAR framework',
  },
  {
    id: 'jeff-h-sipe-behavioral',
    title: 'Jeff H Sipe — Behavioral Interview Tips',
    url: 'https://www.youtube.com/@JeffHSipe',
    platform: 'youtube',
    topics: ['behavioral', 'star', 'soft-skills', 'communication'],
    duration: 'short',
    description: 'Expert behavioral interview coaching videos',
  },
  {
    id: 'amazon-lp-guide',
    title: 'Amazon Leadership Principles Interview Guide',
    url: 'https://www.techinterviewhandbook.org/behavioral-interview-questions/',
    platform: 'techinterviewhandbook',
    topics: ['behavioral', 'star', 'amazon', 'leadership'],
    duration: 'short',
    description: 'Guide to answering behavioral questions using leadership principles',
  },

  // ── Frontend ──────────────────────────────────────────────────────
  {
    id: 'javascript-info',
    title: 'JavaScript.info',
    url: 'https://javascript.info/',
    platform: 'javascript.info',
    topics: ['javascript', 'frontend', 'web'],
    duration: 'long',
    description: 'Modern JavaScript tutorial from basics to advanced topics',
  },
  {
    id: 'react-docs',
    title: 'React Documentation',
    url: 'https://react.dev/',
    platform: 'react',
    topics: ['react', 'frontend', 'javascript', 'typescript'],
    duration: 'medium',
    description: 'Official React docs with interactive examples and guides',
  },
  {
    id: 'frontend-interview-handbook',
    title: 'Front End Interview Handbook',
    url: 'https://www.frontendinterviewhandbook.com/',
    platform: 'frontendinterviewhandbook',
    topics: ['frontend', 'javascript', 'css', 'html', 'web'],
    duration: 'medium',
    description: 'Comprehensive frontend interview prep covering JS, CSS, and HTML',
  },
  {
    id: 'greatfrontend',
    title: 'GreatFrontEnd Practice',
    url: 'https://www.greatfrontend.com/',
    platform: 'greatfrontend',
    topics: ['frontend', 'javascript', 'react', 'css', 'coding'],
    duration: 'medium',
    description: 'Frontend coding interview practice problems with solutions',
  },
  {
    id: 'web-dev-mdn',
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/en-US/docs/Web',
    platform: 'mdn',
    topics: ['frontend', 'javascript', 'css', 'html', 'web', 'apis'],
    duration: 'short',
    description: 'Authoritative web technology reference and tutorials',
  },
  {
    id: 'css-tricks-flexbox',
    title: 'CSS-Tricks: A Complete Guide to Flexbox',
    url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/',
    platform: 'css-tricks',
    topics: ['css', 'frontend', 'layout'],
    duration: 'quick',
    description: 'Visual guide to CSS Flexbox layout',
  },
  {
    id: 'typescript-handbook',
    title: 'TypeScript Handbook',
    url: 'https://www.typescriptlang.org/docs/handbook/',
    platform: 'typescript',
    topics: ['typescript', 'javascript', 'frontend', 'backend'],
    duration: 'medium',
    description: 'Official TypeScript handbook covering types, generics, and patterns',
  },

  // ── Backend / API Design ──────────────────────────────────────────
  {
    id: 'restful-api-design',
    title: 'RESTful API Design Best Practices',
    url: 'https://restfulapi.net/',
    platform: 'restfulapi',
    topics: ['api', 'rest', 'backend', 'web'],
    duration: 'short',
    description: 'Guide to RESTful API design conventions and best practices',
  },
  {
    id: 'node-best-practices',
    title: 'Node.js Best Practices',
    url: 'https://github.com/goldbergyoni/nodebestpractices',
    platform: 'github',
    topics: ['node', 'backend', 'javascript', 'typescript'],
    duration: 'medium',
    description: 'Comprehensive list of Node.js best practices with examples',
  },
  {
    id: 'sql-bolt',
    title: 'SQLBolt — Interactive SQL Lessons',
    url: 'https://sqlbolt.com/',
    platform: 'sqlbolt',
    topics: ['sql', 'databases', 'backend'],
    duration: 'short',
    description: 'Interactive SQL tutorial with hands-on exercises',
  },
  {
    id: 'use-the-index-luke',
    title: 'Use The Index, Luke — SQL Performance',
    url: 'https://use-the-index-luke.com/',
    platform: 'use-the-index-luke',
    topics: ['sql', 'databases', 'performance', 'backend'],
    duration: 'medium',
    description: 'Guide to SQL indexing and query performance optimization',
  },

  // ── ML / AI ───────────────────────────────────────────────────────
  {
    id: '3blue1brown-neural-networks',
    title: '3Blue1Brown — Neural Networks',
    url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi',
    platform: 'youtube',
    topics: ['machine-learning', 'neural-networks', 'ai', 'deep-learning'],
    duration: 'short',
    description: 'Visual, intuitive explanation of neural network fundamentals',
  },
  {
    id: 'fast-ai',
    title: 'fast.ai — Practical Deep Learning',
    url: 'https://course.fast.ai/',
    platform: 'fast.ai',
    topics: ['machine-learning', 'deep-learning', 'ai', 'python'],
    duration: 'long',
    description: 'Free course on practical deep learning for coders',
  },
  {
    id: 'ml-interviews-book',
    title: 'ML Interviews Book by Chip Huyen',
    url: 'https://huyenchip.com/ml-interviews-book/',
    platform: 'huyenchip',
    topics: ['machine-learning', 'ai', 'interviews'],
    duration: 'medium',
    description: 'Comprehensive ML interview preparation guide',
  },
  {
    id: 'stanford-cs229-cheatsheet',
    title: 'Stanford CS229 ML Cheatsheet',
    url: 'https://stanford.edu/~shervine/teaching/cs-229/',
    platform: 'stanford',
    topics: ['machine-learning', 'ai', 'statistics'],
    duration: 'quick',
    description: 'Concise ML cheat sheets covering supervised/unsupervised learning',
  },
  {
    id: 'papers-with-code',
    title: 'Papers With Code',
    url: 'https://paperswithcode.com/',
    platform: 'paperswithcode',
    topics: ['machine-learning', 'ai', 'deep-learning', 'research'],
    duration: 'short',
    description: 'ML papers with implementation code and benchmark results',
  },

  // ── General Interview Prep ────────────────────────────────────────
  {
    id: 'tech-interview-handbook',
    title: 'Tech Interview Handbook',
    url: 'https://www.techinterviewhandbook.org/',
    platform: 'techinterviewhandbook',
    topics: ['algorithms', 'behavioral', 'system-design', 'general-prep'],
    duration: 'medium',
    description: 'End-to-end guide covering coding, behavioral, and system design prep',
  },
  {
    id: 'pramp',
    title: 'Pramp — Free Mock Interviews',
    url: 'https://www.pramp.com/',
    platform: 'pramp',
    topics: ['mock-interviews', 'coding', 'behavioral', 'general-prep'],
    duration: 'short',
    description: 'Free peer-to-peer mock technical interviews',
  },
  {
    id: 'interviewing-io',
    title: 'interviewing.io — Anonymous Mock Interviews',
    url: 'https://interviewing.io/',
    platform: 'interviewing.io',
    topics: ['mock-interviews', 'coding', 'system-design', 'general-prep'],
    duration: 'short',
    description: 'Anonymous mock interviews with engineers from top companies',
  },
  {
    id: 'coding-interview-university',
    title: 'Coding Interview University',
    url: 'https://github.com/jwasham/coding-interview-university',
    platform: 'github',
    topics: ['algorithms', 'data-structures', 'general-prep', 'computer-science'],
    duration: 'long',
    description: 'Complete computer science study plan for interview preparation',
  },

  // ── DevOps / Cloud ────────────────────────────────────────────────
  {
    id: 'docker-getting-started',
    title: 'Docker Getting Started Guide',
    url: 'https://docs.docker.com/get-started/',
    platform: 'docker',
    topics: ['docker', 'containers', 'devops'],
    duration: 'short',
    description: 'Official Docker tutorial from basics to multi-container apps',
  },
  {
    id: 'kubernetes-basics',
    title: 'Kubernetes Basics Tutorial',
    url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/',
    platform: 'kubernetes',
    topics: ['kubernetes', 'containers', 'devops', 'orchestration'],
    duration: 'short',
    description: 'Official Kubernetes interactive tutorial covering core concepts',
  },
  {
    id: 'aws-well-architected',
    title: 'AWS Well-Architected Framework',
    url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html',
    platform: 'aws',
    topics: ['aws', 'cloud', 'architecture', 'devops'],
    duration: 'medium',
    description: 'AWS best practices for designing reliable, scalable cloud systems',
  },

  // ── Python ────────────────────────────────────────────────────────
  {
    id: 'python-docs-tutorial',
    title: 'Python Official Tutorial',
    url: 'https://docs.python.org/3/tutorial/',
    platform: 'python',
    topics: ['python', 'backend'],
    duration: 'medium',
    description: 'Official Python tutorial covering language fundamentals',
  },
  {
    id: 'real-python',
    title: 'Real Python Tutorials',
    url: 'https://realpython.com/',
    platform: 'realpython',
    topics: ['python', 'backend', 'web'],
    duration: 'short',
    description: 'Practical Python tutorials with real-world examples',
  },

  // ── Git / Open Source ─────────────────────────────────────────────
  {
    id: 'git-branching',
    title: 'Learn Git Branching',
    url: 'https://learngitbranching.js.org/',
    platform: 'learngitbranching',
    topics: ['git', 'version-control'],
    duration: 'short',
    description: 'Interactive git visualization and tutorial',
  },

  // ── Concurrency / OS ──────────────────────────────────────────────
  {
    id: 'ostep',
    title: 'Operating Systems: Three Easy Pieces',
    url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
    platform: 'ostep',
    topics: ['operating-systems', 'concurrency', 'computer-science'],
    duration: 'long',
    description: 'Free OS textbook covering virtualization, concurrency, and persistence',
  },

  // ── Quick Reference / Cheat Sheets ────────────────────────────────
  {
    id: 'star-method-cheatsheet',
    title: 'STAR Method Cheat Sheet',
    url: 'https://www.techinterviewhandbook.org/behavioral-interview/',
    platform: 'techinterviewhandbook',
    topics: ['behavioral', 'star', 'soft-skills'],
    duration: 'quick',
    description: 'Quick reference for structuring behavioral answers with STAR',
  },
  {
    id: 'system-design-cheatsheet',
    title: 'System Design Interview Cheat Sheet',
    url: 'https://gist.github.com/vasanthk/485d1c25737e8e72759f',
    platform: 'github',
    topics: ['system-design', 'architecture'],
    duration: 'quick',
    description: 'One-page system design concepts reference',
  },
  {
    id: 'devops-roadmap',
    title: 'DevOps Roadmap',
    url: 'https://roadmap.sh/devops',
    platform: 'roadmap.sh',
    topics: ['devops', 'cloud', 'infrastructure'],
    duration: 'quick',
    description: 'Visual roadmap of DevOps skills and technologies',
  },
  {
    id: 'backend-roadmap',
    title: 'Backend Developer Roadmap',
    url: 'https://roadmap.sh/backend',
    platform: 'roadmap.sh',
    topics: ['backend', 'api', 'databases', 'architecture'],
    duration: 'quick',
    description: 'Visual roadmap of backend development skills',
  },
  {
    id: 'frontend-roadmap',
    title: 'Frontend Developer Roadmap',
    url: 'https://roadmap.sh/frontend',
    platform: 'roadmap.sh',
    topics: ['frontend', 'javascript', 'css', 'html'],
    duration: 'quick',
    description: 'Visual roadmap of frontend development skills',
  },
];

// Build URL → resource lookup map at module load
export const CURATED_URL_MAP: Map<string, CuratedResource> = new Map(
  RESOURCE_BANK.map((r) => [r.url, r])
);

// Build keyword → resource index for fast topic matching
const TOPIC_INDEX: Map<string, CuratedResource[]> = new Map();
for (const resource of RESOURCE_BANK) {
  for (const topic of resource.topics) {
    const existing = TOPIC_INDEX.get(topic) ?? [];
    existing.push(resource);
    TOPIC_INDEX.set(topic, existing);
  }
}

/**
 * Normalizes a JD term to match resource topics.
 * Maps common JD keywords to resource topic slugs.
 */
function normalizeToTopicSlug(term: string): string[] {
  const lower = term.toLowerCase().trim();
  const slugs: string[] = [lower];

  // Common mappings from JD language → topic slugs
  const mappings: Record<string, string[]> = {
    react: ['react', 'frontend', 'javascript'],
    'react.js': ['react', 'frontend', 'javascript'],
    'reactjs': ['react', 'frontend', 'javascript'],
    'next.js': ['react', 'frontend', 'javascript'],
    nextjs: ['react', 'frontend', 'javascript'],
    vue: ['frontend', 'javascript'],
    angular: ['frontend', 'javascript', 'typescript'],
    typescript: ['typescript', 'javascript'],
    javascript: ['javascript', 'frontend'],
    python: ['python', 'backend'],
    java: ['backend'],
    'c++': ['backend', 'computer-science'],
    rust: ['backend'],
    go: ['backend'],
    golang: ['backend'],
    node: ['node', 'backend', 'javascript'],
    'node.js': ['node', 'backend', 'javascript'],
    nodejs: ['node', 'backend', 'javascript'],
    express: ['node', 'backend'],
    sql: ['sql', 'databases', 'backend'],
    postgresql: ['sql', 'databases', 'backend'],
    mysql: ['sql', 'databases', 'backend'],
    mongodb: ['databases', 'backend'],
    nosql: ['databases', 'backend'],
    redis: ['databases', 'backend'],
    aws: ['aws', 'cloud', 'devops'],
    gcp: ['cloud', 'devops'],
    azure: ['cloud', 'devops'],
    docker: ['docker', 'containers', 'devops'],
    kubernetes: ['kubernetes', 'containers', 'devops'],
    k8s: ['kubernetes', 'containers', 'devops'],
    ci: ['devops'],
    cd: ['devops'],
    'ci/cd': ['devops'],
    terraform: ['devops', 'cloud', 'infrastructure'],
    'machine learning': ['machine-learning', 'ai'],
    ml: ['machine-learning', 'ai'],
    'deep learning': ['deep-learning', 'machine-learning', 'ai'],
    ai: ['ai', 'machine-learning'],
    'artificial intelligence': ['ai', 'machine-learning'],
    nlp: ['machine-learning', 'ai'],
    'computer vision': ['machine-learning', 'ai', 'deep-learning'],
    'data structures': ['data-structures', 'algorithms'],
    algorithms: ['algorithms', 'data-structures'],
    'system design': ['system-design', 'architecture'],
    microservices: ['system-design', 'architecture', 'distributed-systems'],
    'distributed systems': ['distributed-systems', 'system-design'],
    scalability: ['scalability', 'system-design'],
    css: ['css', 'frontend'],
    html: ['html', 'frontend'],
    rest: ['api', 'rest', 'backend'],
    'rest api': ['api', 'rest', 'backend'],
    graphql: ['api', 'backend'],
    git: ['git', 'version-control'],
    linux: ['operating-systems'],
    os: ['operating-systems'],
    concurrency: ['concurrency', 'computer-science'],
    multithreading: ['concurrency', 'computer-science'],
    behavioral: ['behavioral', 'star', 'soft-skills'],
    leadership: ['behavioral', 'leadership'],
    communication: ['behavioral', 'soft-skills', 'communication'],
  };

  const mapped = mappings[lower];
  if (mapped) {
    slugs.push(...mapped);
  }

  return [...new Set(slugs)];
}

/**
 * Filters the resource bank by topic relevance and timeline-appropriate duration.
 * Returns a compact subset for prompt injection.
 */
export function getRelevantResources(
  topicSeeds: string[],
  timeline: InterviewTimeline,
  max = 15
): CuratedResource[] {
  const allowedDurations = TIMELINE_DURATIONS[timeline];

  // Expand topic seeds to slugs
  const targetTopics = new Set(topicSeeds.flatMap(normalizeToTopicSlug));

  // Score each resource by topic overlap
  const scored: { resource: CuratedResource; score: number }[] = [];
  const seen = new Set<string>();

  for (const topic of targetTopics) {
    const matching = TOPIC_INDEX.get(topic) ?? [];
    for (const resource of matching) {
      if (seen.has(resource.id)) continue;
      if (!allowedDurations.includes(resource.duration)) continue;

      seen.add(resource.id);

      // Score = number of matching topics
      const overlap = resource.topics.filter((t) => targetTopics.has(t)).length;
      scored.push({ resource, score: overlap });
    }
  }

  // Sort by score descending, take top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map((s) => s.resource);
}

/**
 * Returns timeline-specific prompt instructions for resource selection.
 */
export function getResourceSelectionRules(timeline: InterviewTimeline): string {
  const rules: Record<InterviewTimeline, string> = {
    '1day': `The candidate has ONLY 1 DAY to prepare.
  - ONLY suggest quick-win resources: cheat sheets, reference cards, short videos (<30 min)
  - NEVER suggest courses, books, or multi-hour tutorials
  - Focus on review and recall, not learning new concepts from scratch`,
    '3days': `The candidate has 3 DAYS to prepare.
  - Prefer short resources: video playlists (1-2 hrs), focused tutorials, targeted practice sets
  - NEVER suggest full courses or multi-week programs
  - Focus on targeted gap-filling, not comprehensive study`,
    '1week': `The candidate has 1 WEEK to prepare.
  - Can suggest medium-length resources: focused courses (2-8 hrs), structured problem sets
  - NEVER suggest multi-week specializations or comprehensive bootcamps
  - Balance between depth on weak areas and breadth review`,
    '2weeks': `The candidate has 2 WEEKS to prepare.
  - Can suggest medium-length resources: courses (2-8 hrs), comprehensive guides
  - NEVER suggest 4+ week programs or multi-month courses
  - Good balance of structured learning and practice`,
    '4weeks_plus': `The candidate has 4+ WEEKS to prepare.
  - Can suggest any resource including longer courses and comprehensive programs
  - Prioritize structured learning paths for major gaps
  - Mix theory with hands-on practice`,
  };

  return rules[timeline];
}

/**
 * Formats resources for compact prompt injection.
 * Returns a newline-delimited string of curated entries.
 */
export function formatResourcesForPrompt(resources: CuratedResource[]): string {
  return resources
    .map((r) => `  * ${r.title} (${r.duration}) — ${r.url} — ${r.description}`)
    .join('\n');
}

void RESOURCE_BANK_VERSION;
