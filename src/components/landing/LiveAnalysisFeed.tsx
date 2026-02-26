'use client';

export function LiveAnalysisFeed() {
  // Mock data entries - in production these could come from an API
  const entries = [
    { role: 'SWE', company: 'Google', score: 78, risk: 'Medium' },
    { role: 'PM', company: 'Meta', score: 85, risk: 'Low' },
    { role: 'Data Eng', company: 'Amazon', score: 62, risk: 'High' },
    { role: 'Frontend', company: 'Stripe', score: 91, risk: 'Low' },
    { role: 'Backend', company: 'Netflix', score: 71, risk: 'Medium' },
    { role: 'ML Eng', company: 'OpenAI', score: 88, risk: 'Low' },
    { role: 'DevOps', company: 'Uber', score: 55, risk: 'High' },
    { role: 'SWE', company: 'Apple', score: 82, risk: 'Low' },
    { role: 'SRE', company: 'Datadog', score: 67, risk: 'Medium' },
    { role: 'Full Stack', company: 'Shopify', score: 74, risk: 'Medium' },
  ];

  const riskColor = (risk: string) => {
    if (risk === 'Low') return 'var(--color-success)';
    if (risk === 'Medium') return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  // Double entries for seamless loop
  const doubled = [...entries, ...entries];

  return (
    <section className="overflow-hidden border-y border-[var(--border-default)] bg-[var(--bg-secondary)]">
      <div className="py-4">
        <div className="marquee-track">
          {doubled.map((entry, i) => (
            <div
              key={i}
              className="flex-shrink-0 mx-3 flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2.5"
              style={{ borderLeftColor: riskColor(entry.risk), borderLeftWidth: '2px' }}
            >
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {entry.role} @ {entry.company}
              </span>
              <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                {entry.score}
              </span>
              <span
                className="font-mono text-[11px] font-medium"
                style={{ color: riskColor(entry.risk) }}
              >
                {entry.risk}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-6 border-t border-[var(--border-default)] py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
          <span className="font-mono text-xs text-[var(--text-muted)]">2,847 diagnostics run</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
          <span className="font-mono text-xs text-[var(--text-muted)]">+14 avg improvement</span>
        </div>
      </div>
    </section>
  );
}
