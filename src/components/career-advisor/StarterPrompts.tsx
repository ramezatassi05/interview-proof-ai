'use client';

import { useMemo } from 'react';
import type { UserResume } from '@/types';
import { MagicCard } from '@/components/ui/magic-card';
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list';

interface StarterPromptsProps {
  resume: UserResume;
  onSelect: (prompt: string) => void;
}

export function StarterPrompts({ resume, onSelect }: StarterPromptsProps) {
  const prompts = useMemo(() => {
    const role = resume.targetRole || 'software engineer';
    return [
      {
        icon: '🎯',
        text: `What skills should I learn next to become a ${role}?`,
        description: 'Get prioritized skill recommendations based on market demand',
      },
      {
        icon: '🗺️',
        text: 'Create a 3-month learning roadmap based on my resume',
        description: 'A sequenced plan with free resources and time estimates',
      },
      {
        icon: '🔍',
        text: 'What are my biggest skill gaps for top tech companies?',
        description: 'Compare your skills against what FAANG+ companies expect',
      },
      {
        icon: '📊',
        text: `How does my experience compare to typical ${role} candidates?`,
        description: 'Understand where you stand relative to the competition',
      },
    ];
  }, [resume.targetRole]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--text-muted)] text-center">
        Ask me anything about your career, or try one of these:
      </p>
      <AnimatedList delay={200} className="gap-3">
        {prompts.map((prompt, i) => (
          <AnimatedListItem key={i}>
            <MagicCard
              className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] cursor-pointer hover:border-[var(--accent-primary)]/40 transition-colors"
              gradientColor="rgba(99, 102, 241, 0.08)"
            >
              <button
                onClick={() => onSelect(prompt.text)}
                className="w-full px-4 py-3 text-left"
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0">{prompt.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{prompt.text}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{prompt.description}</p>
                  </div>
                </div>
              </button>
            </MagicCard>
          </AnimatedListItem>
        ))}
      </AnimatedList>
    </div>
  );
}
