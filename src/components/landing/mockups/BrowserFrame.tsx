import { ReactNode } from 'react';

interface BrowserFrameProps {
  url?: string;
  children: ReactNode;
  className?: string;
}

export function BrowserFrame({ url = 'interviewproof.ai', children, className = '' }: BrowserFrameProps) {
  return (
    <div className={`rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden shadow-xl shadow-black/5 ${className}`}>
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-[var(--border-default)] px-4 py-2.5 bg-[var(--bg-secondary)]">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#EF4444]/60" />
          <span className="h-3 w-3 rounded-full bg-[#F59E0B]/60" />
          <span className="h-3 w-3 rounded-full bg-[#22C55E]/60" />
        </div>
        <div className="ml-2 flex-1 rounded-md bg-[var(--bg-elevated)] px-3 py-1">
          <span className="text-[11px] text-[var(--text-muted)]">{url}</span>
        </div>
      </div>
      {/* Content */}
      <div className="overflow-hidden p-5">
        {children}
      </div>
    </div>
  );
}
