'use client';

import type { CareerStage } from '@/types';
import { GlowCard } from '@/components/ui/spotlight-card';

interface StepCareerStageProps {
  value: CareerStage | null;
  onChange: (stage: CareerStage) => void;
}

interface StageOption {
  value: CareerStage;
  icon: string;
  label: string;
  description: string;
  glowColor: 'blue' | 'purple' | 'green' | 'orange';
}

const stages: StageOption[] = [
  {
    value: 'student',
    icon: '🎓',
    label: 'Student',
    description:
      "You're juggling classes, projects, and the pressure to land your first internship or co-op. With limited real-world experience, every interview feels like you need to prove your potential rather than your track record — and figuring out how to stand out among thousands of applicants is exhausting.",
    glowColor: 'blue',
  },
  {
    value: 'new_grad',
    icon: '🚀',
    label: 'New Grad',
    description:
      "You just walked across the stage, and now you're competing against hundreds of other fresh graduates for the same entry-level roles. Translating coursework and side projects into compelling interview answers feels like a different skill entirely — one nobody taught you in school.",
    glowColor: 'purple',
  },
  {
    value: 'career_changer',
    icon: '🔄',
    label: 'Career Changer',
    description:
      "You're making a bold pivot — switching industries, roles, or both. The hardest part isn't learning new skills, it's convincing interviewers that your past experience is an asset, not a gap. You need to reframe your story so your transferable strengths shine through.",
    glowColor: 'green',
  },
  {
    value: 'experienced_professional',
    icon: '💼',
    label: 'Experienced Pro',
    description:
      "You've been in the game for 2+ years and you're ready to level up — whether that's a promotion, a bigger company, or a fresh challenge. The stakes are higher now: you need to articulate real impact, navigate system design rounds, and show the leadership depth that senior roles demand.",
    glowColor: 'orange',
  },
];

export function StepCareerStage({ value, onChange }: StepCareerStageProps) {
  return (
    <div className="flex flex-col items-center">
      <h2 className="heading-modern text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">
        What best describes you?
      </h2>
      <p className="text-gray-500 mb-10 text-center">This helps us tailor your prep experience.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {stages.map((stage) => {
          const isSelected = value === stage.value;
          return (
            <button
              key={stage.value}
              onClick={() => onChange(stage.value)}
              className="text-left focus:outline-none group"
            >
              <GlowCard
                glowColor={stage.glowColor}
                customSize
                className={`
                  h-full w-full cursor-pointer transition-all duration-200
                  ${
                    isSelected
                      ? '!border-orange-400 !bg-orange-50/80 !shadow-lg !shadow-orange-400/15 ring-2 ring-orange-400/30 hover:-translate-y-0.5'
                      : 'hover:!shadow-lg hover:-translate-y-1 hover:scale-[1.02]'
                  }
                `}
              >
                <div className="flex flex-col gap-2 relative z-10 p-1">
                  <span className="text-3xl">{stage.icon}</span>
                  <span
                    className={`font-semibold text-base ${isSelected ? 'text-orange-700' : 'text-gray-900'}`}
                  >
                    {stage.label}
                  </span>
                  <span className="text-sm text-gray-500 leading-relaxed">{stage.description}</span>
                </div>
              </GlowCard>
            </button>
          );
        })}
      </div>
    </div>
  );
}
