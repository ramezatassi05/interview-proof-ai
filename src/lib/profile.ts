import type {
  ExtractedResume,
  CareerStatus,
  ProfileIndustry,
  ProfileFunction,
  InterviewConcern,
  OnboardingInterviewTimeline,
} from '@/types';

// ============================================
// Label Maps for UI Display
// ============================================

export const CAREER_STATUS_OPTIONS: { value: CareerStatus; label: string; description: string }[] =
  [
    { value: 'student', label: 'Student', description: "I'm currently studying" },
    { value: 'early_career', label: 'Early Career', description: '0-3 years of experience' },
    { value: 'mid_career', label: 'Mid Career', description: '3-8 years of experience' },
    { value: 'senior', label: 'Senior', description: '8-15 years of experience' },
    { value: 'executive', label: 'Executive', description: '15+ years, leadership roles' },
    {
      value: 'career_changer',
      label: 'Career Changer',
      description: 'Transitioning to a new field',
    },
  ];

export const INDUSTRY_OPTIONS: { value: ProfileIndustry; label: string }[] = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'legal', label: 'Legal' },
  { value: 'education', label: 'Education' },
  { value: 'government', label: 'Government' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'energy', label: 'Energy' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'other', label: 'Other' },
];

export const FUNCTION_OPTIONS: { value: ProfileFunction; label: string }[] = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'product', label: 'Product' },
  { value: 'design', label: 'Design' },
  { value: 'data', label: 'Data & Analytics' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'operations', label: 'Operations' },
  { value: 'management', label: 'Management' },
  { value: 'research', label: 'Research' },
  { value: 'other', label: 'Other' },
];

export const CONCERN_OPTIONS: { value: InterviewConcern; label: string }[] = [
  { value: 'technical_depth', label: 'Technical Depth' },
  { value: 'behavioral_stories', label: 'Behavioral Stories' },
  { value: 'system_design', label: 'System Design' },
  { value: 'communication', label: 'Communication' },
  { value: 'domain_knowledge', label: 'Domain Knowledge' },
  { value: 'salary_negotiation', label: 'Salary Negotiation' },
  { value: 'culture_fit', label: 'Culture Fit' },
  { value: 'imposter_syndrome', label: 'Imposter Syndrome' },
  { value: 'time_management', label: 'Time Management' },
  { value: 'company_research', label: 'Company Research' },
];

export const TIMELINE_OPTIONS: {
  value: OnboardingInterviewTimeline;
  label: string;
  description: string;
}[] = [
  { value: 'this_week', label: 'This Week', description: 'Interview coming up very soon' },
  { value: 'two_weeks', label: 'Within 2 Weeks', description: "I've got some time to prepare" },
  { value: 'one_month', label: 'Within a Month', description: 'Good runway for preparation' },
  {
    value: 'one_to_three_months',
    label: '1-3 Months',
    description: 'Planning ahead, starting early',
  },
  { value: 'exploring', label: 'Just Exploring', description: 'No interviews yet, just browsing' },
];

export const COMPENSATION_RANGES = [
  'Under $50k',
  '$50k - $75k',
  '$75k - $100k',
  '$100k - $150k',
  '$150k - $200k',
  '$200k - $300k',
  '$300k+',
] as const;

// ============================================
// Resume Auto-fill Logic
// ============================================

/**
 * Estimate years of experience from resume extraction dates.
 */
function estimateYearsFromExperiences(
  experiences: ExtractedResume['experiences']
): number | null {
  if (!experiences.length) return null;

  // Try to find the earliest start date
  let earliestYear = Infinity;
  const currentYear = new Date().getFullYear();

  for (const exp of experiences) {
    const yearMatch = exp.dates.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0], 10);
      if (year < earliestYear) earliestYear = year;
    }
  }

  if (earliestYear === Infinity) return null;

  const years = currentYear - earliestYear;
  return Math.min(Math.max(years, 0), 21); // Clamp to 0-21
}

/**
 * Infer partial profile data from a parsed resume.
 * Used to auto-fill onboarding steps after resume upload.
 */
export function inferProfileFromResume(parsed: ExtractedResume): {
  currentRole: string;
  currentCompany: string;
  yearsOfExperience: number | null;
} {
  const latestExp = parsed.experiences[0];

  return {
    currentRole: latestExp?.role ?? '',
    currentCompany: latestExp?.company ?? '',
    yearsOfExperience: estimateYearsFromExperiences(parsed.experiences),
  };
}

// ============================================
// Onboarding Step Config
// ============================================

export const TOTAL_ONBOARDING_STEPS = 12;

export const SKIPPABLE_STEPS = new Set([2, 8, 11]);

export function isStepSkippable(step: number): boolean {
  return SKIPPABLE_STEPS.has(step);
}
