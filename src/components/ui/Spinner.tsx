type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div className={`inline-flex items-center gap-1 ${sizeStyles[size]} ${className}`}>
      <span className="inline-block h-[30%] w-[30%] rounded-full bg-[var(--accent-primary)] animate-[bounce-dot_1.2s_ease-in-out_0s_infinite]" />
      <span className="inline-block h-[30%] w-[30%] rounded-full bg-[var(--accent-secondary)] animate-[bounce-dot_1.2s_ease-in-out_0.2s_infinite]" />
      <span className="inline-block h-[30%] w-[30%] rounded-full bg-[var(--accent-primary)] animate-[bounce-dot_1.2s_ease-in-out_0.4s_infinite]" />
    </div>
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-[var(--text-secondary)]">{message}</p>
    </div>
  );
}
