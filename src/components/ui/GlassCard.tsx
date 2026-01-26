import { ReactNode } from 'react';

type GlassVariant = 'default' | 'elevated' | 'bordered';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: GlassVariant;
  glow?: boolean;
  hover?: boolean;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function GlassCard({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  glow = false,
  hover = false,
}: GlassCardProps) {
  const variantClasses = {
    default: '',
    elevated: 'shadow-lg',
    bordered: 'border-2 border-[var(--border-accent)]',
  };

  return (
    <div
      className={`
        rounded-xl
        glass
        ${variantClasses[variant]}
        ${paddingStyles[padding]}
        ${hover ? 'card-hover cursor-pointer' : ''}
        ${glow ? 'glow-accent' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
