'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const SECTIONS = [
  { id: 'hero', label: 'Hero' },
  { id: 'live-feed', label: 'Live Feed' },
  { id: 'highlights', label: 'Highlights' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'showcase', label: 'Showcase' },
  { id: 'report-preview', label: 'Report Preview' },
  { id: 'features', label: 'Features' },
  { id: 'vertical-ai', label: 'AI Model' },
  { id: 'benefits', label: 'Benefits' },
  { id: 'advantages', label: 'Why Us' },
  { id: 'security', label: 'Security' },
  { id: 'press', label: 'Recognition' },

  { id: 'faq', label: 'FAQ' },
  { id: 'newsletter', label: 'Newsletter' },
  { id: 'footer-cta', label: 'Get Started' },
];

export function SectionNav() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const heroObserverRef = useRef<IntersectionObserver | null>(null);
  const ratiosRef = useRef<Map<string, number>>(new Map());

  const handleSectionIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    // Update persistent ratio map with changed entries
    entries.forEach((entry) => {
      ratiosRef.current.set(entry.target.id, entry.intersectionRatio);
    });

    // Find the section with the highest ratio across ALL tracked sections
    let maxRatio = 0;
    let maxId: string | null = null;
    ratiosRef.current.forEach((ratio, id) => {
      if (ratio > maxRatio) {
        maxRatio = ratio;
        maxId = id;
      }
    });
    if (maxId) setActiveId(maxId);
  }, []);

  useEffect(() => {
    // Hero visibility observer — show nav only after scrolling past hero
    const heroEl = document.getElementById('hero');
    if (heroEl) {
      heroObserverRef.current = new IntersectionObserver(
        ([entry]) => setVisible(!entry.isIntersecting),
        { threshold: 0.1 }
      );
      heroObserverRef.current.observe(heroEl);
    }

    // Section tracking observer
    observerRef.current = new IntersectionObserver(handleSectionIntersect, {
      rootMargin: '0px 0px -40% 0px',
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    });

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
      heroObserverRef.current?.disconnect();
    };
  }, [handleSectionIntersect]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 lg:flex transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }}
      aria-label="Page sections"
    >
      <div className="glass flex flex-col items-center gap-3 rounded-full px-2 py-4">
        {SECTIONS.map(({ id, label }) => {
          const isActive = activeId === id;
          return (
            <div key={id} className="relative flex items-center">
              {/* Tooltip */}
              {hoveredId === id && (
                <span className="absolute right-full mr-3 whitespace-nowrap rounded-md bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] shadow-lg border border-[var(--border-default)]">
                  {label}
                </span>
              )}
              <button
                onClick={() => scrollTo(id)}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
                className="group flex items-center justify-center rounded-full transition-all duration-200"
                aria-label={`Scroll to ${label}`}
                aria-current={isActive ? 'true' : undefined}
              >
                <span
                  className="block rounded-full transition-all duration-200"
                  style={{
                    width: isActive ? '10px' : '8px',
                    height: isActive ? '10px' : '8px',
                    backgroundColor: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                    opacity: isActive ? 1 : 0.4,
                    boxShadow: isActive ? '0 0 8px var(--accent-primary)' : 'none',
                  }}
                />
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
