interface SectionHeaderProps {
  number: string;
  title: string;
  className?: string;
}

export function SectionHeader({ number, title, className = '' }: SectionHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-semibold text-[var(--accent-primary)]">
          {number}
        </span>
        <h2 className="text-lg font-semibold uppercase tracking-wide text-[var(--text-primary)]">
          {title}
        </h2>
      </div>
      <div className="mt-3 h-px bg-[var(--border-default)]" />
    </div>
  );
}
