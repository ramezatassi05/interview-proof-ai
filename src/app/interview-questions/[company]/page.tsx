import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/layout/Container';

// Inline company data for static generation (avoids importing server scoring module in page)
const COMPANIES: Record<
  string,
  {
    displayName: string;
    tier: string;
    tierLabel: string;
    difficultyMultiplier: number;
    acceptanceRate: string;
    competitionLevel: string;
    interviewBar: string;
    relatedCompanies: string[];
  }
> = {
  google: {
    displayName: 'Google',
    tier: 'FAANG_PLUS',
    tierLabel: 'FAANG+',
    difficultyMultiplier: 1.45,
    acceptanceRate: '1-2%',
    competitionLevel: 'Extreme',
    interviewBar:
      'Expects strong algorithmic thinking, system design depth, and Googleyness (leadership, collaboration). Multiple rounds with high reject rates at each stage.',
    relatedCompanies: ['meta', 'apple', 'amazon', 'microsoft'],
  },
  meta: {
    displayName: 'Meta',
    tier: 'FAANG_PLUS',
    tierLabel: 'FAANG+',
    difficultyMultiplier: 1.4,
    acceptanceRate: '1-3%',
    competitionLevel: 'Extreme',
    interviewBar:
      'Emphasizes move-fast culture, coding speed, and system design. Behavioral rounds focus on impact at scale.',
    relatedCompanies: ['google', 'apple', 'amazon', 'netflix'],
  },
  apple: {
    displayName: 'Apple',
    tier: 'FAANG_PLUS',
    tierLabel: 'FAANG+',
    difficultyMultiplier: 1.4,
    acceptanceRate: '2-4%',
    competitionLevel: 'Extreme',
    interviewBar:
      'Highly secretive process. Deep domain expertise required. Emphasis on craft, attention to detail, and cross-functional collaboration.',
    relatedCompanies: ['google', 'microsoft', 'nvidia', 'meta'],
  },
  amazon: {
    displayName: 'Amazon',
    tier: 'FAANG_PLUS',
    tierLabel: 'FAANG+',
    difficultyMultiplier: 1.4,
    acceptanceRate: '2-3%',
    competitionLevel: 'Extreme',
    interviewBar:
      'Leadership Principles dominate every round. Expect deep behavioral + technical bars. Bar raiser process adds extra scrutiny.',
    relatedCompanies: ['google', 'meta', 'microsoft', 'apple'],
  },
  netflix: {
    displayName: 'Netflix',
    tier: 'FAANG_PLUS',
    tierLabel: 'FAANG+',
    difficultyMultiplier: 1.35,
    acceptanceRate: '2-5%',
    competitionLevel: 'Extreme',
    interviewBar:
      'Culture of freedom and responsibility. Very senior-oriented hiring. Expects strong ownership, judgment, and domain mastery.',
    relatedCompanies: ['google', 'meta', 'spotify', 'airbnb'],
  },
  microsoft: {
    displayName: 'Microsoft',
    tier: 'FAANG_PLUS',
    tierLabel: 'FAANG+',
    difficultyMultiplier: 1.35,
    acceptanceRate: '2-4%',
    competitionLevel: 'Extreme',
    interviewBar:
      'Structured loop interviews with growth mindset evaluation. Strong emphasis on coding, system design, and collaboration.',
    relatedCompanies: ['google', 'amazon', 'apple', 'nvidia'],
  },
  nvidia: {
    displayName: 'Nvidia',
    tier: 'FAANG_PLUS',
    tierLabel: 'FAANG+',
    difficultyMultiplier: 1.45,
    acceptanceRate: '1-3%',
    competitionLevel: 'Extreme',
    interviewBar:
      'Deeply technical interviews focused on GPU architecture, CUDA, and systems programming.',
    relatedCompanies: ['google', 'apple', 'openai', 'anthropic'],
  },
  openai: {
    displayName: 'OpenAI',
    tier: 'FAANG_PLUS',
    tierLabel: 'FAANG+',
    difficultyMultiplier: 1.5,
    acceptanceRate: '<1%',
    competitionLevel: 'Extreme',
    interviewBar:
      'Extremely competitive. Expects world-class ML/AI fundamentals, strong coding, and mission alignment.',
    relatedCompanies: ['anthropic', 'google', 'nvidia', 'meta'],
  },
  anthropic: {
    displayName: 'Anthropic',
    tier: 'FAANG_PLUS',
    tierLabel: 'FAANG+',
    difficultyMultiplier: 1.5,
    acceptanceRate: '<1%',
    competitionLevel: 'Extreme',
    interviewBar:
      'Focuses on AI safety alignment, strong technical fundamentals, and research depth. Extremely selective.',
    relatedCompanies: ['openai', 'google', 'nvidia', 'meta'],
  },
  stripe: {
    displayName: 'Stripe',
    tier: 'BIG_TECH',
    tierLabel: 'Big Tech',
    difficultyMultiplier: 1.3,
    acceptanceRate: '2-4%',
    competitionLevel: 'Very High',
    interviewBar:
      'Extremely high coding bar. Bug squash and system design rounds. Looks for exceptional attention to detail.',
    relatedCompanies: ['plaid', 'ramp', 'coinbase', 'shopify'],
  },
  uber: {
    displayName: 'Uber',
    tier: 'BIG_TECH',
    tierLabel: 'Big Tech',
    difficultyMultiplier: 1.25,
    acceptanceRate: '3-5%',
    competitionLevel: 'Very High',
    interviewBar:
      'System design focus on distributed systems and real-time data. Strong coding bar with emphasis on scalability.',
    relatedCompanies: ['airbnb', 'doordash', 'instacart', 'tiktok'],
  },
  airbnb: {
    displayName: 'Airbnb',
    tier: 'BIG_TECH',
    tierLabel: 'Big Tech',
    difficultyMultiplier: 1.25,
    acceptanceRate: '3-5%',
    competitionLevel: 'Very High',
    interviewBar:
      'Cross-functional interviews with strong culture-fit component. Values-driven hiring.',
    relatedCompanies: ['uber', 'spotify', 'netflix', 'shopify'],
  },
  'goldman-sachs': {
    displayName: 'Goldman Sachs',
    tier: 'TOP_FINANCE',
    tierLabel: 'Top Finance',
    difficultyMultiplier: 1.35,
    acceptanceRate: '2-4%',
    competitionLevel: 'Very High',
    interviewBar:
      'Superday format with multiple rounds. Tests financial knowledge, problem-solving, and cultural fit.',
    relatedCompanies: ['jp-morgan', 'morgan-stanley', 'blackstone', 'bloomberg'],
  },
  'jp-morgan': {
    displayName: 'JP Morgan',
    tier: 'TOP_FINANCE',
    tierLabel: 'Top Finance',
    difficultyMultiplier: 1.3,
    acceptanceRate: '3-5%',
    competitionLevel: 'Very High',
    interviewBar:
      'Structured process with HireVue and superday. Tests financial acumen and technical skills.',
    relatedCompanies: ['goldman-sachs', 'morgan-stanley', 'blackrock', 'bloomberg'],
  },
  figma: {
    displayName: 'Figma',
    tier: 'UNICORN',
    tierLabel: 'Unicorn',
    difficultyMultiplier: 1.25,
    acceptanceRate: '3-6%',
    competitionLevel: 'High',
    interviewBar:
      'Design-engineering culture. Tests product thinking, frontend expertise, and collaboration.',
    relatedCompanies: ['notion', 'vercel', 'linear', 'discord'],
  },
  notion: {
    displayName: 'Notion',
    tier: 'UNICORN',
    tierLabel: 'Unicorn',
    difficultyMultiplier: 1.2,
    acceptanceRate: '4-7%',
    competitionLevel: 'High',
    interviewBar:
      'Small team, high bar. Values product sense, clean code, and full-stack ability.',
    relatedCompanies: ['figma', 'linear', 'vercel', 'discord'],
  },
  vercel: {
    displayName: 'Vercel',
    tier: 'UNICORN',
    tierLabel: 'Unicorn',
    difficultyMultiplier: 1.2,
    acceptanceRate: '5-8%',
    competitionLevel: 'High',
    interviewBar:
      'Developer tooling focus. Tests web performance, edge computing, and frontend architecture.',
    relatedCompanies: ['notion', 'figma', 'supabase', 'cloudflare'],
  },
  coinbase: {
    displayName: 'Coinbase',
    tier: 'UNICORN',
    tierLabel: 'Unicorn',
    difficultyMultiplier: 1.2,
    acceptanceRate: '4-7%',
    competitionLevel: 'High',
    interviewBar:
      'Crypto/blockchain focus. Tests security mindset, distributed systems, and financial engineering.',
    relatedCompanies: ['stripe', 'plaid', 'robinhood', 'ramp'],
  },
  databricks: {
    displayName: 'Databricks',
    tier: 'BIG_TECH',
    tierLabel: 'Big Tech',
    difficultyMultiplier: 1.3,
    acceptanceRate: '3-5%',
    competitionLevel: 'Very High',
    interviewBar:
      'Data engineering and Spark expertise valued. Strong emphasis on distributed systems.',
    relatedCompanies: ['snowflake', 'datadog', 'cloudflare', 'palantir'],
  },
  palantir: {
    displayName: 'Palantir',
    tier: 'BIG_TECH',
    tierLabel: 'Big Tech',
    difficultyMultiplier: 1.3,
    acceptanceRate: '2-4%',
    competitionLevel: 'Very High',
    interviewBar:
      'Tests problem decomposition, system design, and mission-driven thinking.',
    relatedCompanies: ['anduril', 'databricks', 'scale-ai', 'snowflake'],
  },
};

export function generateStaticParams() {
  return Object.keys(COMPANIES).map((company) => ({ company }));
}

interface Props {
  params: Promise<{ company: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { company } = await params;
  const data = COMPANIES[company];
  if (!data) return { title: 'Company Not Found' };

  return {
    title: `${data.displayName} Interview Questions & Preparation Guide | InterviewProof`,
    description: `Prepare for ${data.displayName} interviews. Difficulty: ${data.difficultyMultiplier}x, acceptance rate: ${data.acceptanceRate}. Get a personalized diagnostic.`,
    openGraph: {
      title: `${data.displayName} Interview Questions & Preparation Guide`,
      description: `Everything you need to know about ${data.displayName} interviews. Tier: ${data.tierLabel}, Competition: ${data.competitionLevel}.`,
    },
  };
}

function DifficultyBar({ multiplier }: { multiplier: number }) {
  const pct = Math.round(((multiplier - 1.0) / 0.5) * 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default async function CompanyInterviewPage({ params }: Props) {
  const { company } = await params;
  const data = COMPANIES[company];
  if (!data) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How hard is it to get into ${data.displayName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${data.displayName} has an estimated acceptance rate of ${data.acceptanceRate} with ${data.competitionLevel.toLowerCase()} competition. ${data.interviewBar}`,
        },
      },
      {
        '@type': 'Question',
        name: `What is the ${data.displayName} interview process like?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: data.interviewBar,
        },
      },
    ],
  };

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-[var(--bg-primary)]">
        {/* Hero */}
        <section className="py-20 lg:py-28">
          <Container size="md">
            <div className="mx-auto max-w-3xl">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                Back to Home
              </Link>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1 text-xs font-semibold text-[var(--accent-primary)]">
                {data.tierLabel} Tier
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight text-[var(--text-primary)] sm:text-4xl">
                {data.displayName} Interview Preparation Guide
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
                Everything you need to know to prepare for {data.displayName} interviews, including
                difficulty level, what to expect, and how to stand out.
              </p>
            </div>
          </Container>
        </section>

        {/* Stats grid */}
        <section className="pb-20 lg:pb-28">
          <Container size="md">
            <div className="mx-auto max-w-3xl">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Company Tier
                  </p>
                  <p className="mt-2 text-lg font-bold text-[var(--accent-primary)]">
                    {data.tierLabel}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Acceptance Rate
                  </p>
                  <p className="mt-2 text-lg font-bold text-[var(--text-primary)]">
                    {data.acceptanceRate}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Competition
                  </p>
                  <p className="mt-2 text-lg font-bold text-[var(--text-primary)]">
                    {data.competitionLevel}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Difficulty
                  </p>
                  <p className="mt-2 text-lg font-bold text-[var(--text-primary)]">
                    {data.difficultyMultiplier}x
                  </p>
                </div>
              </div>

              {/* Difficulty bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>Difficulty Level</span>
                  <span>{data.difficultyMultiplier}x multiplier</span>
                </div>
                <div className="mt-2">
                  <DifficultyBar multiplier={data.difficultyMultiplier} />
                </div>
              </div>

              {/* Interview bar description */}
              <div className="mt-10 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  What to Expect in the Interview
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {data.interviewBar}
                </p>
              </div>

              {/* What InterviewProof checks */}
              <div className="mt-10">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  How InterviewProof Helps You Prepare
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                  Our diagnostic adjusts scoring thresholds based on {data.displayName}&apos;s{' '}
                  {data.difficultyMultiplier}x difficulty multiplier, ensuring your preparation
                  targets the actual bar — not a generic standard.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Company-Calibrated Scoring
                    </h3>
                    <p className="mt-2 text-xs text-[var(--text-secondary)]">
                      Your readiness score is adjusted for {data.displayName}&apos;s specific
                      hiring bar and interview format.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Targeted Practice Questions
                    </h3>
                    <p className="mt-2 text-xs text-[var(--text-secondary)]">
                      Practice questions calibrated to the types of challenges {data.displayName}{' '}
                      actually asks.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Gap Analysis
                    </h3>
                    <p className="mt-2 text-xs text-[var(--text-secondary)]">
                      Identify exactly where your resume falls short of {data.displayName}&apos;s
                      expectations.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Differentiation Strategies
                    </h3>
                    <p className="mt-2 text-xs text-[var(--text-secondary)]">
                      Specific strategies to stand out in {data.displayName}&apos;s interview
                      process.
                    </p>
                  </div>
                </div>
              </div>

              {/* Related companies */}
              {data.relatedCompanies.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    Similar Companies
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {data.relatedCompanies.map((slug) => {
                      const related = COMPANIES[slug];
                      if (!related) return null;
                      return (
                        <Link
                          key={slug}
                          href={`/interview-questions/${slug}`}
                          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]"
                        >
                          {related.displayName}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="mt-16 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-8 text-center">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  Get Your {data.displayName} Interview Diagnostic
                </h2>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  Upload your resume and the {data.displayName} job description for a personalized
                  gap analysis with company-calibrated scoring.
                </p>
                <Link
                  href="/new"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/25 transition-colors hover:from-orange-500 hover:via-pink-600 hover:to-purple-600"
                >
                  Start My Diagnostic
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
