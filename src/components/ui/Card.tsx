import { ReactNode } from 'react';

type CardVariant = 'default' | 'elevated' | 'bordered' | 'glass';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: CardVariant;
  hover?: boolean;
  glow?: boolean;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-[var(--bg-card)] border border-[var(--border-default)]',
  elevated: 'bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-lg',
  bordered: 'bg-[var(--bg-card)] border-2 border-[var(--border-accent)]',
  glass: 'glass',
};

export function Card({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  hover = false,
  glow = false,
}: CardProps) {
  return (
    <div
      className={`
        rounded-xl
        ${variantStyles[variant]}
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

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-[var(--text-primary)] ${className}`}>{children}</h3>
  );
}

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return <p className={`mt-1 text-sm text-[var(--text-secondary)] ${className}`}>{children}</p>;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={className}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return <div className={`mt-4 flex items-center gap-3 ${className}`}>{children}</div>;
}
