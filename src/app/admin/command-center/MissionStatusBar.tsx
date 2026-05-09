'use client';

import { useEffect, useState } from 'react';

interface MissionStatusBarProps {
  agentsOnline: number;
  pendingCount: number;
  nextBeatLabel: string;
}

function formatClock(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function MissionStatusBar({
  agentsOnline,
  pendingCount,
  nextBeatLabel,
}: MissionStatusBarProps) {
  const [clock, setClock] = useState<string | null>(null);

  useEffect(() => {
    setClock(formatClock(new Date()));
    const id = setInterval(() => setClock(formatClock(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  const stateLabel = pendingCount > 0 ? 'AWAITING CALL' : 'OPERATIONAL';
  const stateColor = pendingCount > 0 ? 'var(--accent-primary)' : 'var(--color-success)';

  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border-default)]/70 bg-[var(--bg-primary)] px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)] sm:px-6">
      {/* LEFT — operational state + agent count */}
      <div className="flex items-center gap-4 sm:gap-6">
        <span className="flex items-center gap-2" style={{ color: stateColor }}>
          <span className="relative flex h-1.5 w-1.5">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
              style={{ background: stateColor }}
            />
            <span
              className="relative inline-flex h-1.5 w-1.5 rounded-full"
              style={{ background: stateColor }}
            />
          </span>
          <span className="font-semibold tabular-nums">{stateLabel}</span>
        </span>

        <span className="hidden items-center gap-1.5 sm:inline-flex">
          <span className="text-[var(--text-secondary)] tabular-nums font-semibold">
            {agentsOnline}
          </span>
          <span>agents online</span>
        </span>
      </div>

      {/* CENTER — wordmark */}
      <div className="hidden items-center gap-2 md:flex">
        <span className="text-[var(--text-muted)]/70">INTERVIEWPROOF</span>
        <span className="text-[var(--border-accent)]">/</span>
        <span className="font-semibold text-[var(--text-secondary)]">CEO COMMAND</span>
      </div>

      {/* RIGHT — next beat + live clock */}
      <div className="flex items-center gap-4 sm:gap-6">
        <span className="hidden items-center gap-1.5 sm:inline-flex">
          <span>next beat</span>
          <span className="font-semibold text-[var(--text-secondary)] tabular-nums">
            {nextBeatLabel}
          </span>
        </span>
        <span className="font-mono text-[12px] font-semibold tabular-nums text-[var(--text-primary)]">
          {clock}
        </span>
      </div>
    </div>
  );
}
