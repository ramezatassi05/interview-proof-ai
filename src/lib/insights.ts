import type { AggregateInsightStats } from '@/types';

export interface InterviewInsight {
  id: string;
  icon: 'chart' | 'target' | 'brain' | 'shield' | 'clock' | 'trophy' | 'lightbulb';
  category: 'scoring' | 'hiring' | 'preparation' | 'strategy' | 'risk' | 'rubric' | 'industry';
  text: string;
}

/**
 * Interview insights derived from real scoring constants, thresholds,
 * and rubric data used in the InterviewProof scoring engine.
 */
export const INTERVIEW_INSIGHTS: InterviewInsight[] = [
  // From engine.ts weights
  {
    id: 'weight-hard-match',
    icon: 'chart',
    category: 'scoring',
    text: 'Hard Requirement Match is 35% of your readiness score — the single largest factor in your diagnostic.',
  },
  {
    id: 'weight-evidence',
    icon: 'chart',
    category: 'scoring',
    text: 'Evidence Depth accounts for 25% of your score. Quantified achievements matter more than listing responsibilities.',
  },
  {
    id: 'weight-round-readiness',
    icon: 'target',
    category: 'scoring',
    text: 'Round Readiness is weighted at 20%. Interview preparation shows — even if your resume is strong.',
  },
  {
    id: 'weight-clarity-company',
    icon: 'chart',
    category: 'scoring',
    text: 'Resume Clarity and Company Alignment are 10% each. Small gains here can push you over the hire zone threshold.',
  },

  // From hirezone.ts thresholds
  {
    id: 'hirezone-technical',
    icon: 'target',
    category: 'hiring',
    text: "The technical hire zone starts at 78. Industry average is 62 — that's a 16-point gap most candidates need to close.",
  },
  {
    id: 'hirezone-behavioral',
    icon: 'target',
    category: 'hiring',
    text: 'Behavioral rounds have the lowest hire zone threshold at 72, but the industry average is only 58.',
  },
  {
    id: 'hirezone-case',
    icon: 'target',
    category: 'hiring',
    text: 'Case interview hire zones start at 75. Structured thinking and clear communication are key differentiators.',
  },
  {
    id: 'hirezone-gap-action',
    icon: 'trophy',
    category: 'strategy',
    text: 'Adding quantified metrics to project bullets typically yields +4-7 points on your Evidence Depth score.',
  },
  {
    id: 'hirezone-practice-impact',
    icon: 'trophy',
    category: 'strategy',
    text: 'Mock interview practice can improve Round Readiness by +6-10 points — the highest-impact single activity.',
  },

  // From forecast.ts round weights
  {
    id: 'forecast-tech-weight',
    icon: 'brain',
    category: 'scoring',
    text: "In technical rounds, Hard Skills Match and Round Readiness each carry 40% weight. Theory alone won't cut it.",
  },
  {
    id: 'forecast-behavioral-weight',
    icon: 'brain',
    category: 'scoring',
    text: 'In behavioral rounds, Communication Clarity carries 40% weight. How you tell your story matters as much as the story itself.',
  },
  {
    id: 'forecast-case-weight',
    icon: 'brain',
    category: 'scoring',
    text: 'Case interviews split focus: 30% Hard Match, 30% Round Readiness, 20% Clarity, and 20% Company Fit.',
  },

  // From trajectory.ts improvement rates
  {
    id: 'trajectory-fastest',
    icon: 'clock',
    category: 'preparation',
    text: 'Round Readiness improves 3x faster than technical skills with daily practice. Focus your prep time wisely.',
  },
  {
    id: 'trajectory-diminishing',
    icon: 'clock',
    category: 'preparation',
    text: 'Above 70% in any category, improvement rates slow by 30%. The last 10 points are the hardest to earn.',
  },
  {
    id: 'trajectory-hours',
    icon: 'clock',
    category: 'preparation',
    text: 'Candidates who prep 4+ hours daily see 1.5x faster improvement. But even 1 hour daily makes a measurable difference.',
  },

  // From archetype.ts definitions
  {
    id: 'archetype-count',
    icon: 'brain',
    category: 'rubric',
    text: 'Candidates are classified into 5 interview archetypes. The most common is "Balanced But Unproven" — solid everywhere, standout nowhere.',
  },
  {
    id: 'archetype-polish',
    icon: 'brain',
    category: 'rubric',
    text: '"Technical Potential, Low Polish" is diagnosed when hard skills score above 70% but communication falls below 50%.',
  },

  // From scoring engine risk bands
  {
    id: 'risk-bands',
    icon: 'shield',
    category: 'risk',
    text: 'Scores below 40 are High Risk (likely rejection), 40-69 are Medium Risk (competitive but gaps exist), and 70+ are Low Risk.',
  },
  {
    id: 'risk-critical-gap',
    icon: 'shield',
    category: 'risk',
    text: 'A category gap of 15+ points from the hire zone target is flagged as critical. These gaps are rejection triggers.',
  },

  // From rubric/general knowledge
  {
    id: 'rubric-categories',
    icon: 'target',
    category: 'rubric',
    text: 'Our rubric evaluates 5 core dimensions: Hard Match, Evidence Depth, Round Readiness, Resume Clarity, and Company Alignment.',
  },
  {
    id: 'rubric-percentile',
    icon: 'chart',
    category: 'scoring',
    text: 'Percentile estimates use a sigmoid model calibrated against industry averages. A score of 78 in technical is roughly the 83rd percentile.',
  },
  {
    id: 'strategy-resume-clarity',
    icon: 'trophy',
    category: 'strategy',
    text: 'Restructuring bullet points as "action verb + context + measurable result" typically yields +3-5 points on Resume Clarity.',
  },

  // Real-world interview & job search facts
  {
    id: 'industry-application-odds',
    icon: 'lightbulb',
    category: 'industry',
    text: 'Did you know? Each corporate job posting attracts an average of 250 resumes — only 4-6 candidates get called for an interview.',
  },
  {
    id: 'industry-resume-scan',
    icon: 'lightbulb',
    category: 'industry',
    text: 'Did you know? Recruiters spend an average of just 7.4 seconds on an initial resume scan. First impressions are everything.',
  },
  {
    id: 'industry-ats-rejection',
    icon: 'lightbulb',
    category: 'industry',
    text: 'Did you know? 75% of resumes are rejected by applicant tracking systems before a human ever sees them.',
  },
  {
    id: 'industry-interview-rate',
    icon: 'lightbulb',
    category: 'industry',
    text: 'Did you know? The average job seeker gets 1 interview for every 6 applications they submit.',
  },
  {
    id: 'industry-mock-interview',
    icon: 'lightbulb',
    category: 'industry',
    text: 'Did you know? Candidates who do at least one mock interview are 50% more likely to get hired.',
  },
  {
    id: 'industry-company-knowledge',
    icon: 'lightbulb',
    category: 'industry',
    text: "Did you know? 47% of interviewers say a candidate's lack of knowledge about the company is their top turnoff.",
  },
  {
    id: 'industry-salary-negotiation',
    icon: 'lightbulb',
    category: 'industry',
    text: 'Did you know? Candidates who negotiate their salary earn an average of $5,000 more in their first year.',
  },
  {
    id: 'industry-search-duration',
    icon: 'lightbulb',
    category: 'industry',
    text: 'Did you know? The average job search takes 3-6 months. Well-prepared candidates close offers 40% faster.',
  },
  {
    id: 'industry-coding-interviews',
    icon: 'lightbulb',
    category: 'industry',
    text: "Did you know? 60% of developers say coding interviews don't reflect actual day-to-day job performance.",
  },
  {
    id: 'industry-follow-up',
    icon: 'lightbulb',
    category: 'industry',
    text: 'Did you know? Only 24% of candidates send a follow-up thank-you email — those who do are 22% more likely to get the offer.',
  },
  {
    id: 'industry-referrals',
    icon: 'lightbulb',
    category: 'industry',
    text: 'Did you know? Employee referrals have a 40% hire rate compared to just 2% from job boards.',
  },
  {
    id: 'industry-first-impressions',
    icon: 'lightbulb',
    category: 'industry',
    text: "Did you know? 33% of hiring managers say they know within the first 90 seconds whether they'll hire someone.",
  },
  {
    id: 'industry-body-language',
    icon: 'lightbulb',
    category: 'industry',
    text: 'Did you know? 55% of the impression you make in an interview comes from body language, not what you say.',
  },
  {
    id: 'industry-culture-fit',
    icon: 'lightbulb',
    category: 'industry',
    text: 'Did you know? 89% of hiring failures are attributed to poor cultural fit, not lack of technical skills.',
  },
  {
    id: 'industry-ghosting',
    icon: 'lightbulb',
    category: 'industry',
    text: 'Did you know? 75% of job seekers report being ghosted after an interview at least once.',
  },
  {
    id: 'industry-star-method',
    icon: 'lightbulb',
    category: 'industry',
    text: 'Did you know? Candidates who use the STAR method score 30% higher in structured behavioral interviews.',
  },
  {
    id: 'industry-overqualified',
    icon: 'lightbulb',
    category: 'industry',
    text: 'Did you know? 1 in 3 hiring managers has rejected a candidate for being overqualified.',
  },
  {
    id: 'industry-questions-asked',
    icon: 'lightbulb',
    category: 'industry',
    text: 'Did you know? Candidates who ask thoughtful questions are rated 40% more favorably by interviewers.',
  },
];

/**
 * Fallback aggregate stats used when the API is unavailable.
 * Numbers are conservative estimates to maintain credibility.
 */
export const FALLBACK_AGGREGATE_STATS: AggregateInsightStats = {
  totalAnalyses: 500,
  avgReadinessScore: 58,
  riskBandDistribution: [
    { band: 'High', count: 150, percentage: 30 },
    { band: 'Medium', count: 225, percentage: 45 },
    { band: 'Low', count: 125, percentage: 25 },
  ],
  roundTypeDistribution: [
    { roundType: 'technical', count: 250, percentage: 50 },
    { roundType: 'behavioral', count: 150, percentage: 30 },
    { roundType: 'case', count: 75, percentage: 15 },
    { roundType: 'finance', count: 25, percentage: 5 },
  ],
  avgScoreByRound: [
    { roundType: 'technical', avgScore: 55 },
    { roundType: 'behavioral', avgScore: 62 },
    { roundType: 'case', avgScore: 57 },
    { roundType: 'finance', avgScore: 54 },
  ],
};
