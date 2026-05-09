import type { ReactNode } from 'react';

interface BodySectionProps {
  /**
   * Two-character section number ("01", "02", "03"). Omit for supporting/sub sections.
   */
  index?: string;
  /**
   * Uppercase eyebrow label (e.g. "TEAM", "GOALS", "DECISIONS").
   */
  eyebrow: string;
  /**
   * Serif heading for the section.
   */
  title: string;
  /**
   * Optional one-line tagline below the title.
   */
  tagline?: string;
  /**
   * Right-aligned action slot (e.g. "Tap to talk", "View all", refresh button).
   */
  action?: ReactNode;
  /**
   * If true, the title uses muted color tone — for sections that are calm/empty.
   */
  muted?: boolean;
  /**
   * Whether to include a hairline divider between header and content.
   */
  divider?: boolean;
  className?: string;
  children: ReactNode;
}

export function BodySection({
  index,
  eyebrow,
  title,
  tagline,
  action,
  muted = false,
  divider = false,
  className = '',
  children,
}: BodySectionProps) {
  return (
    <section className={`flex flex-col gap-4 ${className}`}>
      <div className="flex flex-col gap-2">
        {/* EYEBROW — hairline + numbered tag, matches hero overlines */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5 text-[10.5px] font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
            <span aria-hidden className="h-px w-5 bg-[var(--text-muted)]/40" />
            {index && (
              <>
                <span className="font-semibold tabular-nums text-[var(--text-secondary)]">
                  {index}
                </span>
                <span aria-hidden className="text-[var(--text-muted)]/50">/</span>
              </>
            )}
            <span className="truncate">{eyebrow}</span>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>

        {/* TITLE — serif, matches hero secondary metrics */}
        <h2
          className={`font-serif text-[22px] font-medium leading-tight tracking-tight sm:text-[26px] ${
            muted ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'
          }`}
        >
          {title}
        </h2>

        {/* TAGLINE — quiet supporting copy */}
        {tagline && (
          <p className="text-[12.5px] leading-relaxed text-[var(--text-muted)]">{tagline}</p>
        )}
      </div>

      {divider && (
        <div aria-hidden className="h-px w-full bg-[var(--border-default)]/60" />
      )}

      {children}
    </section>
  );
}
