import type {
  CareerStage,
  TargetDomain,
  ScoreBreakdownItem,
  StrengthAcknowledgment,
} from '@/types';
import type { ResumeSignals } from './resume-signals';

// ============================================
// Strength Acknowledgment — Deterministic
// Detects 1-2 strengths from resume signals,
// career stage, and score breakdown
// ============================================

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

interface StrengthInput {
  careerStage: CareerStage | null;
  yearsExperience: number | null;
  resumeSignals: ResumeSignals | null;
  targetDomains: TargetDomain[];
  scoreBreakdown: ScoreBreakdownItem[];
}

export function computeStrengthAcknowledgments(input: StrengthInput): StrengthAcknowledgment[] {
  const strengths: StrengthAcknowledgment[] = [];
  const { careerStage, yearsExperience, resumeSignals, targetDomains, scoreBreakdown } = input;

  // Leadership + substantial experience
  if (resumeSignals?.hasLeadershipSignals && yearsExperience !== null && yearsExperience >= 5) {
    strengths.push({
      message: `Your leadership experience and ${yearsExperience} years in the industry give you a strong foundation that most candidates don\u2019t have.`,
      source: 'resume_leadership',
    });
  }

  // Quantified impact
  if (resumeSignals?.hasQuantifiedImpact && strengths.length < 2) {
    strengths.push({
      message:
        'You already quantify your achievements with data \u2014 that\u2019s exactly what interviewers want to see in your answers.',
      source: 'resume_impact',
    });
  }

  // Broad technical skills
  if (resumeSignals && resumeSignals.detectedSkills.length >= 3 && strengths.length < 2) {
    const domain = targetDomains.length > 0 ? DOMAIN_LABELS[targetDomains[0]] : 'tech';
    strengths.push({
      message: `Your technical breadth across ${resumeSignals.detectedSkills.length} skill areas shows the kind of versatility ${domain} interviewers value.`,
      source: 'resume_skills',
    });
  }

  // Open source
  if (resumeSignals?.hasOpenSource && strengths.length < 2) {
    strengths.push({
      message:
        'Your open-source contributions demonstrate initiative beyond the day job \u2014 interviewers notice this.',
      source: 'resume_oss',
    });
  }

  // Experienced professional without resume signals
  if (
    careerStage === 'experienced_professional' &&
    yearsExperience !== null &&
    yearsExperience >= 5 &&
    strengths.length < 2
  ) {
    strengths.push({
      message: `With ${yearsExperience} years of experience, you bring real-world depth that many candidates simply don\u2019t have.`,
      source: 'career_stage',
    });
  }

  // Substantial resume depth
  if (resumeSignals?.resumeDepth === 'substantial' && strengths.length < 2) {
    strengths.push({
      message:
        'Your comprehensive professional background gives you a strong starting point \u2014 the key is translating it into interview-ready stories.',
      source: 'resume_depth',
    });
  }

  // Fallback: positive score breakdown items
  if (strengths.length === 0) {
    const positiveItems = scoreBreakdown.filter((item) => item.sentiment === 'positive');
    if (positiveItems.length > 0) {
      const top = positiveItems[0];
      strengths.push({
        message: `Your ${top.label.toLowerCase()} works in your favor \u2014 ${top.detail.toLowerCase()} is a real advantage in the interview process.`,
        source: 'score_breakdown',
      });
    }
  }

  return strengths.slice(0, 2);
}
