'use client';

interface CreditsBalanceProps {
  balance: number;
  size?: 'sm' | 'md';
  onClick?: () => void;
}

export function CreditsBalance({ balance, size = 'md', onClick }: CreditsBalanceProps) {
  const baseClasses =
    'inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] transition-all';
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:border-[var(--border-accent)] hover:bg-[var(--bg-card)]'
    : '';

  return (
    <button
      type="button"
      className={`${baseClasses} ${sizeClasses} ${interactiveClasses}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <svg
        className={`${size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-[var(--text-secondary)]`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v12M8 10h8M8 14h8" strokeLinecap="round" />
      </svg>
      <span className="font-semibold text-[var(--text-primary)]">{balance}</span>
      <span className="text-[var(--text-muted)]">
        {size === 'md' ? (balance === 1 ? 'credit' : 'credits') : ''}
      </span>
    </button>
  );
}
