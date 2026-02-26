export function MorphingWaveDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full py-2 ${className}`}>
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/20 to-transparent" />
    </div>
  );
}

// Alias for new name
export const SectionDivider = MorphingWaveDivider;
