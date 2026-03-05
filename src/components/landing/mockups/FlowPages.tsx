'use client';

/* ====== Upload Page ====== */

export function FlowUploadPage() {
  return (
    <div className="space-y-3.5">
      <div>
        <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
          Resume
        </label>
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] p-2.5 text-[11px] leading-relaxed text-[var(--text-secondary)]">
          Senior Software Engineer with 6+ years of experience in distributed systems, React, and
          TypeScript...
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-medium text-[var(--text-secondary)]">
          Job Description
        </label>
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] p-2.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
          We are looking for a Staff Engineer to lead our platform team...
        </div>
      </div>

      <div className="flex gap-2">
        <span className="rounded-full bg-[var(--accent-primary)]/10 px-3 py-1 text-[10px] font-medium text-[var(--accent-primary)]">
          Technical
        </span>
        <span className="rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-[10px] text-[var(--text-muted)]">
          Behavioral
        </span>
        <span className="rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-[10px] text-[var(--text-muted)]">
          Case
        </span>
      </div>

      <div className="flex h-8 items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 text-[11px] font-semibold text-white shadow-lg shadow-pink-500/20">
        Analyze My Fit
      </div>
    </div>
  );
}

/* ====== Analysis Page ====== */

interface FlowAnalysisPageProps {
  /** 0-100 progress value driving the bar and step checkmarks */
  progress: number;
}

const ANALYSIS_STEPS = [
  'Extracting resume data',
  'Parsing job requirements',
  'Cross-referencing rubrics',
  'Computing readiness score',
];

export function FlowAnalysisPage({ progress }: FlowAnalysisPageProps) {
  return (
    <div className="space-y-3.5">
      <div className="text-center">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Analyzing Your Profile</p>
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">This takes about 60 seconds</p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[var(--track-bg)]">
        <div
          className="h-full rounded-full bg-[var(--accent-primary)] transition-[width] duration-100 ease-linear"
          style={{ width: `${Math.min(progress, 90)}%` }}
        />
      </div>

      <div className="space-y-2">
        {ANALYSIS_STEPS.map((step, i) => {
          const stepStart = (i / ANALYSIS_STEPS.length) * 100;
          const isDone = progress > stepStart + 25;
          const isActive = progress > stepStart && !isDone;
          const isVisible = progress > stepStart;

          return (
            <div
              key={step}
              className="flex items-center gap-2.5"
              style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}
            >
              {isDone ? (
                <svg
                  className="h-4 w-4 text-[var(--color-success)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : isActive ? (
                <div className="h-4 w-4 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-[var(--border-default)]" />
              )}
              <span
                className={`text-[11px] ${isActive ? 'font-medium text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ====== Report Page ====== */

export type ReportTab = 'score' | 'risks' | 'questions';

interface FlowReportPageProps {
  activeTab: ReportTab;
  /** Increment to re-trigger CSS animations on loop restart */
  animKey: number;
  /** Pixels to translateY the tab content (simulated scroll) */
  scrollOffset?: number;
}

const DIMENSIONS = [
  { label: 'Technical Match', value: 82, color: 'var(--color-success)' },
  { label: 'Evidence Depth', value: 65, color: 'var(--color-warning)' },
  { label: 'Round Readiness', value: 71, color: 'var(--color-warning)' },
  { label: 'Clarity', value: 88, color: 'var(--color-success)' },
];

const RISKS = [
  { title: 'Generic leadership example', severity: 'High', color: 'var(--color-danger)' },
  { title: 'No CI/CD pipeline experience', severity: 'High', color: 'var(--color-danger)' },
  { title: 'Missing system design depth', severity: 'Medium', color: 'var(--color-warning)' },
];

const TAB_ITEMS: { id: ReportTab; label: string }[] = [
  { id: 'score', label: 'Score' },
  { id: 'risks', label: 'Red Flags' },
  { id: 'questions', label: 'Questions' },
];

export function FlowReportPage({ activeTab, animKey, scrollOffset = 0 }: FlowReportPageProps) {
  return (
    <div className="space-y-3">
      {/* Score ring row (always visible) */}
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--track-bg)" strokeWidth="10" />
            <circle
              key={animKey}
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--color-warning)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="264"
              style={
                {
                  '--score-circumference': '264',
                  '--score-offset': '71',
                  animation: 'mockup-score-fill 1.2s ease-out forwards',
                } as React.CSSProperties
              }
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold text-[var(--text-primary)]">73</span>
          </div>
        </div>
        <div>
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            Interview Readiness
          </span>
          <div className="mt-0.5">
            <span className="rounded-full bg-[var(--color-warning)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-warning)]">
              Medium Risk
            </span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[var(--border-default)]">
        {TAB_ITEMS.map((tab) => (
          <span
            key={tab.id}
            className={`-mb-px border-b-2 px-3 py-1.5 text-[11px] font-medium transition-colors ${
              tab.id === activeTab
                ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'border-transparent text-[var(--text-muted)]'
            }`}
          >
            {tab.label}
          </span>
        ))}
      </div>

      {/* Tab content */}
      <div
        key={`${activeTab}-${animKey}`}
        className="overflow-hidden"
        style={{
          transform: `translateY(-${scrollOffset}px)`,
          transition: 'transform 1s ease-in-out',
        }}
      >
        {activeTab === 'score' && <ScoreTabContent animKey={animKey} />}
        {activeTab === 'risks' && <RisksTabContent />}
        {activeTab === 'questions' && <QuestionsTabContent />}
      </div>
    </div>
  );
}

/* --- Tab content sub-components --- */

function ScoreTabContent({ animKey }: { animKey: number }) {
  return (
    <div className="space-y-2">
      {DIMENSIONS.map((dim, i) => (
        <div key={dim.label}>
          <div className="mb-0.5 flex justify-between text-[10px]">
            <span className="text-[var(--text-secondary)]">{dim.label}</span>
            <span className="font-semibold text-[var(--text-primary)]">{dim.value}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--track-bg)]">
            <div
              key={animKey}
              className="h-full rounded-full"
              style={
                {
                  backgroundColor: dim.color,
                  '--bar-width': `${dim.value}%`,
                  animation: `mockup-bar-grow 0.8s ease-out ${0.3 + i * 0.15}s both`,
                } as React.CSSProperties
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RisksTabContent() {
  return (
    <div className="space-y-2">
      {RISKS.map((risk, i) => (
        <div
          key={risk.title}
          className="flex items-start gap-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] p-2.5"
          style={{ animation: `mockup-slide-in 0.4s ease-out ${i * 0.2}s both` }}
        >
          <span
            className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: risk.color }}
          />
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-[var(--text-primary)]">{risk.title}</span>
            <span
              className="ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
              style={{
                backgroundColor: `color-mix(in srgb, ${risk.color} 10%, transparent)`,
                color: risk.color,
              }}
            >
              {risk.severity}
            </span>
          </div>
        </div>
      ))}
      <div className="text-center">
        <span className="text-[10px] text-[var(--text-muted)]">
          + 4 more risks in full diagnostic
        </span>
      </div>
    </div>
  );
}

function QuestionsTabContent() {
  return (
    <div className="space-y-2.5">
      {/* Predicted question */}
      <div
        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] p-2.5"
        style={{ animation: 'mockup-fade-in 0.4s ease-out both' }}
      >
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="rounded-full bg-[var(--accent-primary)]/10 px-1.5 py-0.5 text-[9px] font-medium text-[var(--accent-primary)]">
            Predicted
          </span>
          <span className="text-[9px] text-[var(--text-muted)]">87% likely</span>
        </div>
        <p className="text-[11px] font-medium leading-relaxed text-[var(--text-primary)]">
          &ldquo;Tell me about a time you led a project with ambiguous requirements.&rdquo;
        </p>
      </div>

      {/* User answer */}
      <div
        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] p-2.5"
        style={{ animation: 'mockup-fade-in 0.4s ease-out 0.3s both' }}
      >
        <p className="mb-1 text-[10px] text-[var(--text-muted)]">Your Answer</p>
        <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
          In my role at Acme Corp, I led the migration of our monolith to microservices...
        </p>
      </div>

      {/* AI feedback */}
      <div
        className="rounded-lg border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 p-2.5"
        style={{ animation: 'mockup-fade-in 0.4s ease-out 0.8s both' }}
      >
        <div className="mb-1 flex items-center gap-1.5">
          <svg
            className="h-3.5 w-3.5 text-[var(--color-success)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-[10px] font-semibold text-[var(--color-success)]">AI Feedback</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
          Strong opening with context. Add specific metrics to strengthen impact.
        </p>
      </div>
    </div>
  );
}
