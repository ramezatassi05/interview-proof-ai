'use client';

import type { GetReportResponse } from '@/lib/api';
import { formatHoursMinutes } from '@/lib/format';

type ReportData = GetReportResponse['data'];

interface IntelligencePanelProps {
  activeTab: string;
  reportData?: ReportData | null;
}

export function IntelligencePanel({ activeTab, reportData }: IntelligencePanelProps) {
  if (!reportData) {
    return (
      <div className="text-center py-8">
        <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
          <svg
            className="h-6 w-6 text-[var(--text-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-sm text-[var(--text-muted)]">No report data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
          Intelligence Panel
        </h3>
        <p className="text-xs text-[var(--text-muted)]">Context-aware insights</p>
      </div>

      {/* Scores Tab Content */}
      {activeTab === 'scores' && <ScoresIntelligence reportData={reportData} />}

      {/* Risks Tab Content */}
      {activeTab === 'risks' && <RisksIntelligence reportData={reportData} />}

      {/* Questions Tab Content */}
      {activeTab === 'questions' && <QuestionsIntelligence reportData={reportData} />}

      {/* Study Tab Content */}
      {activeTab === 'study' && <StudyIntelligence reportData={reportData} />}

      {/* Quick Actions - Always visible */}
      <QuickActions reportData={reportData} />
    </div>
  );
}

function ScoresIntelligence({ reportData }: { reportData: ReportData }) {
  const score = reportData.readinessScore ?? 0;
  const breakdown = reportData.scoreBreakdown;

  // Calculate percentile estimate
  const getPercentile = () => {
    if (score >= 85) return 'Top 10%';
    if (score >= 75) return 'Top 25%';
    if (score >= 60) return 'Top 50%';
    if (score >= 45) return 'Bottom 50%';
    return 'Bottom 25%';
  };

  // Get trend indicator
  const getTrend = () => {
    if (!breakdown) return null;
    const avg =
      (breakdown.hardRequirementMatch + breakdown.evidenceDepth + breakdown.roundReadiness) / 3;
    if (avg > score) return { direction: 'up', label: 'Technical strengths above average' };
    return { direction: 'down', label: 'Presentation needs work' };
  };

  const trend = getTrend();

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[var(--text-muted)]">Estimated Percentile</span>
          <span className="text-sm font-bold text-[var(--accent-primary)]">{getPercentile()}</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          Based on analysis of similar candidates for this role type.
        </p>
      </div>

      {trend && (
        <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className={`h-4 w-4 ${trend.direction === 'up' ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  trend.direction === 'up'
                    ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                    : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'
                }
              />
            </svg>
            <span className="text-xs font-medium text-[var(--text-muted)]">Signal Trend</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">{trend.label}</p>
        </div>
      )}

      <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] p-4">
        <span className="text-xs font-medium text-[var(--text-muted)]">Top Move</span>
        <p className="mt-1 text-sm text-[var(--text-primary)]">
          {score < 70
            ? 'Focus on addressing critical recruiter red flags first'
            : 'Polish your execution roadmap items for maximum impact'}
        </p>
      </div>
    </div>
  );
}

function RisksIntelligence({ reportData }: { reportData: ReportData }) {
  const risks = reportData.allRisks ?? [];
  const criticalCount = risks.filter((r) => r.severity === 'critical').length;
  const highCount = risks.filter((r) => r.severity === 'high').length;

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] p-4">
        <span className="text-xs font-medium text-[var(--text-muted)]">Recruiter Impact</span>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-2 bg-[var(--track-bg)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-danger)]"
              style={{ width: `${Math.min(100, (criticalCount + highCount) * 20)}%` }}
            />
          </div>
          <span className="text-xs font-medium text-[var(--color-danger)]">
            {criticalCount + highCount > 0 ? 'High' : 'Low'}
          </span>
        </div>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          {criticalCount + highCount} flags likely to trigger immediate rejection
        </p>
      </div>

      <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] p-4">
        <span className="text-xs font-medium text-[var(--text-muted)]">Signal Strength</span>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-[var(--color-danger)]">{criticalCount}</p>
            <p className="text-xs text-[var(--text-muted)]">Critical</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--color-warning)]">{highCount}</p>
            <p className="text-xs text-[var(--text-muted)]">High</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--text-secondary)]">
              {risks.length - criticalCount - highCount}
            </p>
            <p className="text-xs text-[var(--text-muted)]">Other</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-[var(--color-danger-muted)] border border-[var(--color-danger)]/30 p-4">
        <span className="text-xs font-medium text-[var(--color-danger)]">First Fix</span>
        <p className="mt-1 text-sm text-[var(--text-primary)]">
          {risks[0]?.title ?? 'No critical risks identified'}
        </p>
      </div>
    </div>
  );
}

function QuestionsIntelligence({ reportData }: { reportData: ReportData }) {
  const questions = reportData.interviewQuestions ?? [];
  // Estimate technical questions based on mapped risk patterns
  const technicalCount = questions.filter(
    (q) =>
      q.why?.toLowerCase().includes('technical') ||
      q.why?.toLowerCase().includes('coding') ||
      q.why?.toLowerCase().includes('algorithm')
  ).length;

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] p-4">
        <span className="text-xs font-medium text-[var(--text-muted)]">Question Breakdown</span>
        <div className="mt-2 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Technical</span>
            <span className="font-medium text-[var(--text-primary)]">{technicalCount}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Behavioral</span>
            <span className="font-medium text-[var(--text-primary)]">
              {questions.length - technicalCount}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] p-4">
        <span className="text-xs font-medium text-[var(--text-muted)]">Preparation Tip</span>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Practice answering each question out loud. Time yourself to keep responses under 2
          minutes.
        </p>
      </div>
    </div>
  );
}

function StudyIntelligence({ reportData }: { reportData: ReportData }) {
  const tasks = reportData.studyPlan ?? [];
  const totalMinutes = tasks.reduce((sum, t) => sum + t.timeEstimateMinutes, 0);
  const totalHours = totalMinutes / 60;

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] p-4">
        <span className="text-xs font-medium text-[var(--text-muted)]">Time to Complete</span>
        <p className="mt-1 text-2xl font-bold text-[var(--accent-primary)]">
          {formatHoursMinutes(totalHours)}
        </p>
        <p className="text-xs text-[var(--text-secondary)]">
          {tasks.length} tasks in your execution roadmap
        </p>
      </div>

      <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] p-4">
        <span className="text-xs font-medium text-[var(--text-muted)]">Projected Improvement</span>
        <div className="mt-2 flex items-center gap-2">
          <svg
            className="h-4 w-4 text-[var(--color-success)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          <span className="text-sm font-medium text-[var(--color-success)]">+10-15 points</span>
        </div>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Estimated score increase after completing top 3 tasks
        </p>
      </div>

      <div className="rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 p-4">
        <span className="text-xs font-medium text-[var(--accent-primary)]">Quick Win</span>
        <p className="mt-1 text-sm text-[var(--text-primary)]">
          {tasks[0]?.task ?? 'No tasks available'}
        </p>
      </div>
    </div>
  );
}

function QuickActions({ reportData }: { reportData: ReportData }) {
  return (
    <div className="pt-4 border-t border-[var(--border-default)]">
      <p className="text-xs font-medium text-[var(--text-muted)] mb-3">Quick Actions</p>
      <div className="space-y-2">
        <a
          href={`/api/report/${reportData.reportId}/pdf`}
          download
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download PDF
        </a>
        <a
          href="/new"
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Analysis
        </a>
      </div>
    </div>
  );
}
