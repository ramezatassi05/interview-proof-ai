'use client';

import { useState } from 'react';
import { Container } from '@/components/layout/Container';

interface Tab {
  id: string;
  label: string;
  content: { label: string; value: string; color?: string }[];
}

const TABS: Tab[] = [
  {
    id: 'score',
    label: 'Score Analysis',
    content: [
      { label: 'READINESS', value: '73', color: 'var(--color-warning)' },
      { label: 'TECH_FIT', value: '81', color: 'var(--color-success)' },
      { label: 'EVIDENCE', value: '64', color: 'var(--color-warning)' },
      { label: 'CLARITY', value: '78', color: 'var(--color-success)' },
      { label: 'ROUND_READY', value: '69', color: 'var(--color-warning)' },
      { label: 'COMPANY_FIT', value: '72', color: 'var(--color-success)' },
    ],
  },
  {
    id: 'risk',
    label: 'Risk Map',
    content: [
      { label: 'missing_system_design', value: 'CRITICAL', color: 'var(--color-danger)' },
      { label: 'no_cicd_experience', value: 'HIGH', color: 'var(--color-danger)' },
      { label: 'weak_behavioral_star', value: 'MEDIUM', color: 'var(--color-warning)' },
      { label: 'no_metrics_on_impact', value: 'MEDIUM', color: 'var(--color-warning)' },
      { label: 'resume_too_verbose', value: 'LOW', color: 'var(--color-success)' },
    ],
  },
  {
    id: 'recruiter',
    label: 'Recruiter Sim',
    content: [
      { label: 'DECISION', value: 'ADVANCE_WITH_CONCERNS' },
      { label: 'CONFIDENCE', value: '0.72' },
      { label: 'SCREEN_TIME', value: '28s' },
      { label: 'RED_FLAGS', value: '3' },
      { label: 'STRONG_SIGNALS', value: '4' },
    ],
  },
  {
    id: 'study',
    label: 'Study Plan',
    content: [
      { label: '[01] System design basics', value: '45min' },
      { label: '[02] STAR story prep', value: '30min' },
      { label: '[03] Add metrics to resume', value: '20min' },
      { label: '[04] Mock coding round', value: '60min' },
      { label: '[05] Company research', value: '15min' },
    ],
  },
];

export function FeatureShowcase() {
  const [activeTab, setActiveTab] = useState('score');
  const currentTab = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  return (
    <section>
      <Container className="py-16">
        <p className="section-label mb-2">Capabilities</p>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          What you get
        </h2>

        <div className="mt-8 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden">
          {/* Terminal header bar */}
          <div className="flex items-center gap-2 border-b border-[var(--border-default)] px-4 py-3 bg-[var(--bg-secondary)]">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-danger)]/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-warning)]/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-success)]/60" />
            </div>
            <span className="ml-2 font-mono text-xs text-[var(--text-muted)]">
              interviewproof --diagnostic
            </span>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-[var(--border-default)]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 font-mono text-xs transition-colors ${
                  activeTab === tab.id
                    ? 'text-[var(--accent-primary)] border-b-2 border-b-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 min-h-[240px]">
            <div className="space-y-3 animate-fade-in" key={activeTab}>
              {currentTab.content.map((item) => (
                <div key={item.label} className="flex items-center justify-between font-mono text-sm">
                  <span className="text-[var(--text-secondary)]">{item.label}</span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: item.color || 'var(--text-primary)' }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
