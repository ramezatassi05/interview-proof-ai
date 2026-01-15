import type { LLMAnalysis } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface InterviewQuestionsProps {
  questions: LLMAnalysis['interviewQuestions'];
}

export function InterviewQuestions({ questions }: InterviewQuestionsProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Interview Questions to Expect
      </h2>
      <div className="space-y-3">
        {questions.map((q, index) => (
          <Card key={index} padding="sm">
            <CardHeader className="mb-2">
              <CardTitle className="text-base">
                <span className="mr-2 text-zinc-400">{index + 1}.</span>
                {q.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{q.why}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
