'use client';

import type { LLMAnalysis, PersonalizedStudyPlan, PracticeIntelligence } from '@/types';
import { BlurFade } from '@/components/ui/blur-fade';
import { InterviewQuestions } from '@/components/diagnostic/InterviewQuestions';
import { StudyPlan } from '@/components/diagnostic/StudyPlan';
import { PracticeIntelligencePanel } from '@/components/diagnostic/PracticeIntelligencePanel';

interface PracticeTabProps {
  interviewQuestions?: LLMAnalysis['interviewQuestions'];
  studyPlan?: LLMAnalysis['studyPlan'];
  personalizedStudyPlan?: PersonalizedStudyPlan;
  practiceIntelligence?: PracticeIntelligence;
  companyName?: string;
  reportId: string;
}

export function PracticeTab({
  interviewQuestions,
  studyPlan,
  personalizedStudyPlan,
  practiceIntelligence,
  companyName,
  reportId,
}: PracticeTabProps) {
  return (
    <div className="space-y-8">
      {/* Interview Questions */}
      {interviewQuestions && interviewQuestions.length > 0 && (
        <BlurFade delay={0.05}>
          <section>
            <h2 className="section-label mb-4">
              Practice Questions ({interviewQuestions.length})
            </h2>
            <InterviewQuestions
              questions={interviewQuestions}
              companyName={companyName}
              reportId={reportId}
            />
          </section>
        </BlurFade>
      )}

      {/* Execution Roadmap */}
      {studyPlan && studyPlan.length > 0 && (
        <BlurFade delay={0.1}>
          <section>
            <h2 className="section-label mb-4">Execution Roadmap</h2>
            <StudyPlan
              tasks={studyPlan}
              personalizedStudyPlan={personalizedStudyPlan}
              companyName={companyName}
              reportId={reportId}
            />
          </section>
        </BlurFade>
      )}

      {/* Practice Intelligence */}
      {practiceIntelligence && (
        <BlurFade delay={0.15}>
          <section>
            <h2 className="section-label mb-4">Practice Intelligence</h2>
            <PracticeIntelligencePanel data={practiceIntelligence} companyName={companyName} />
          </section>
        </BlurFade>
      )}
    </div>
  );
}
