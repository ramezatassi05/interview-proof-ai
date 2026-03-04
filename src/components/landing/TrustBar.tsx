const COMPANIES = [
  'Google',
  'Meta',
  'Amazon',
  'Apple',
  'Netflix',
  'Stripe',
  'Microsoft',
  'Uber',
];

function CompanyLogo({ name }: { name: string }) {
  return (
    <span className="flex-shrink-0 px-6 text-base font-semibold tracking-wide text-[var(--text-muted)]/40 select-none uppercase">
      {name}
    </span>
  );
}

export function TrustBar() {
  return (
    <section className="border-y border-[var(--border-default)] bg-[var(--bg-secondary)]/50 py-8 overflow-hidden">
      <p className="text-center text-xs font-medium uppercase tracking-widest text-[var(--text-muted)] mb-6">
        Candidates preparing for interviews at
      </p>

      <div className="relative">
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-[var(--bg-primary)] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-[var(--bg-primary)] to-transparent" />

        <div className="flex items-center trust-marquee-track" style={{ animation: 'trust-marquee 25s linear infinite' }}>
          {/* Double the logos for seamless loop */}
          {[...COMPANIES, ...COMPANIES].map((name, i) => (
            <CompanyLogo key={`${name}-${i}`} name={name} />
          ))}
        </div>
      </div>
    </section>
  );
}
