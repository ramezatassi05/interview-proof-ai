import { cn } from '@/lib/utils';

interface AnimatedShinyTextProps {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
}

export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 100,
}: AnimatedShinyTextProps) {
  return (
    <span
      style={
        {
          '--shimmer-width': `${shimmerWidth}px`,
        } as React.CSSProperties
      }
      className={cn(
        'inline-flex animate-shimmer-slide bg-clip-text',
        'bg-[length:var(--shimmer-width)_100%] bg-no-repeat',
        'bg-gradient-to-r from-transparent via-[var(--accent-secondary)] via-50% to-transparent',
        '[--bg-size:var(--shimmer-width)]',
        className
      )}
    >
      {children}
    </span>
  );
}
