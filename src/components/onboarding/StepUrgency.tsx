'use client';

import type {
  CareerStage,
  OnboardingPrepUrgency,
  InterviewExperience,
  TargetCompanyTier,
} from '@/types';

interface StepUrgencyProps {
  careerStage: CareerStage | null;
  prepUrgency: OnboardingPrepUrgency | null;
  biggestConcern: string;
  interviewExperience: InterviewExperience | null;
  targetCompanyTier: TargetCompanyTier | null;
  onPrepUrgencyChange: (urgency: OnboardingPrepUrgency) => void;
  onBiggestConcernChange: (concern: string) => void;
  onInterviewExperienceChange: (exp: InterviewExperience) => void;
  onTargetCompanyTierChange: (tier: TargetCompanyTier) => void;
  onContinue: () => void;
}

interface UrgencyOption {
  value: OnboardingPrepUrgency;
  icon: string;
  label: string;
  description: string;
}

const urgencyOptions: UrgencyOption[] = [
  { value: 'exploring', icon: '🔍', label: 'Just Exploring', description: 'No rush yet' },
  { value: 'active_search', icon: '📋', label: 'Actively Searching', description: 'Applying to jobs' },
  {
    value: 'interview_scheduled',
    icon: '📅',
    label: 'Interview Scheduled',
    description: 'Have a date set',
  },
  {
    value: 'interview_this_week',
    icon: '🔥',
    label: 'This Week!',
    description: 'Crunch time',
  },
];

interface InterviewExpOption {
  value: InterviewExperience;
  label: string;
}

const interviewExpOptions: InterviewExpOption[] = [
  { value: 'none', label: 'Never interviewed' },
  { value: 'a_few', label: 'A few times' },
  { value: 'many', label: 'Many times' },
];

interface CompanyTierOption {
  value: TargetCompanyTier;
  label: string;
}

const companyTierOptions: CompanyTierOption[] = [
  { value: 'big_tech', label: 'Big Tech / FAANG' },
  { value: 'startup', label: 'Startups' },
  { value: 'any', label: 'Any good fit' },
];

const CONCERN_SUGGESTIONS: Record<CareerStage, string[]> = {
  student: ['No experience yet', 'Internship interviews', 'Technical fundamentals', 'Leetcode anxiety'],
  new_grad: ['First real interview', 'No STAR stories', 'Leetcode anxiety', 'System design basics'],
  career_changer: [
    'Explaining the switch',
    'Proving new skills',
    'Resume gaps',
    'Technical assessments',
  ],
  experienced_professional: [
    'System design depth',
    'Salary negotiation',
    'Standing out at top companies',
    'Leadership stories',
  ],
};

export function StepUrgency({
  careerStage,
  prepUrgency,
  biggestConcern,
  interviewExperience,
  targetCompanyTier,
  onPrepUrgencyChange,
  onBiggestConcernChange,
  onInterviewExperienceChange,
  onTargetCompanyTierChange,
  onContinue,
}: StepUrgencyProps) {
  const canContinue = prepUrgency !== null;
  const suggestions = careerStage ? CONCERN_SUGGESTIONS[careerStage] : CONCERN_SUGGESTIONS.new_grad;

  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="heading-modern text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2 text-center">
        How soon is your interview?
      </h2>
      <p className="text-[var(--text-secondary)] mb-8 text-center">This shapes your prep priorities.</p>

      <div className="w-full max-w-md space-y-6">
        {/* Urgency options */}
        <div className="grid grid-cols-2 gap-3">
          {urgencyOptions.map((opt) => {
            const isSelected = prepUrgency === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onPrepUrgencyChange(opt.value)}
                className={`
                  flex flex-col items-center p-4 rounded-xl border-2 text-center transition-all duration-200
                  ${
                    isSelected
                      ? 'border-orange-400 bg-orange-50 shadow-md shadow-orange-400/10'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                <span className="text-xl mb-1">{opt.icon}</span>
                <span
                  className={`font-semibold text-sm ${isSelected ? 'text-orange-700' : 'text-[var(--text-primary)]'}`}
                >
                  {opt.label}
                </span>
                <span className="text-xs text-[var(--text-muted)] mt-0.5">{opt.description}</span>
              </button>
            );
          })}
        </div>

        {/* Interview experience */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Have you interviewed for a similar role before?{' '}
            <span className="text-[var(--text-muted)] font-normal">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {interviewExpOptions.map((opt) => {
              const isSelected = interviewExperience === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onInterviewExperienceChange(opt.value)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                    ${
                      isSelected
                        ? 'bg-orange-100 text-orange-700 border border-orange-300'
                        : 'bg-gray-100 text-[var(--text-secondary)] border border-transparent hover:bg-gray-200'
                    }
                  `}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target company tier */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            What kind of companies are you targeting?{' '}
            <span className="text-[var(--text-muted)] font-normal">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {companyTierOptions.map((opt) => {
              const isSelected = targetCompanyTier === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onTargetCompanyTierChange(opt.value)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                    ${
                      isSelected
                        ? 'bg-orange-100 text-orange-700 border border-orange-300'
                        : 'bg-gray-100 text-[var(--text-secondary)] border border-transparent hover:bg-gray-200'
                    }
                  `}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Concern section */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            What&apos;s your biggest concern?{' '}
            <span className="text-[var(--text-muted)] font-normal">(optional)</span>
          </label>

          {/* Suggestion pills */}
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestions.map((s) => {
              const isSelected = biggestConcern === s;
              return (
                <button
                  key={s}
                  onClick={() => onBiggestConcernChange(isSelected ? '' : s)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150
                    ${
                      isSelected
                        ? 'bg-orange-100 text-orange-700 border border-orange-300'
                        : 'bg-gray-100 text-[var(--text-secondary)] border border-transparent hover:bg-gray-200'
                    }
                  `}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {/* Free text */}
          <input
            type="text"
            value={biggestConcern}
            onChange={(e) => onBiggestConcernChange(e.target.value)}
            placeholder="Or type your own..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 outline-none transition-all text-sm"
          />
        </div>

        {/* Continue button */}
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="group relative w-full rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 p-[2px] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          <span className="flex items-center justify-center rounded-full bg-black px-8 py-3 text-sm font-semibold text-white transition-colors group-hover:bg-black/90">
            Almost Done
          </span>
        </button>
      </div>
    </div>
  );
}
