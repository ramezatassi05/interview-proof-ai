'use client';

import { useState } from 'react';
import { useActiveSection } from '@/hooks/useActiveSection';

interface SidebarSection {
  id: string;
  number: string;
  label: string;
}

interface ReportSidebarProps {
  sections: SidebarSection[];
}

export function ReportSidebar({ sections }: ReportSidebarProps) {
  const sectionIds = sections.map((s) => s.id);
  const activeId = useActiveSection(sectionIds);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileOpen(false);
    }
  };

  const navContent = (
    <nav className="space-y-1">
      {sections.map((section) => {
        const isActive = activeId === section.id;
        return (
          <button
            key={section.id}
            onClick={() => handleClick(section.id)}
            className={`
              flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors
              ${
                isActive
                  ? 'border-l-2 border-l-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--text-primary)]'
                  : 'border-l-2 border-l-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }
            `}
          >
            <span className={`font-mono text-xs ${isActive ? 'text-[var(--accent-primary)]' : ''}`}>
              {section.number}
            </span>
            <span className="truncate">{section.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-56 flex-shrink-0">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto py-4 pr-4">
          <p className="section-label mb-4 px-3">Sections</p>
          {navContent}
        </div>
      </aside>

      {/* Mobile floating button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-12 items-center gap-2 rounded-xl border border-[var(--border-accent)] bg-[var(--bg-card)] px-4 text-sm font-medium text-[var(--text-primary)] shadow-lg backdrop-blur-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Navigate
        </button>
      </div>

      {/* Mobile slide-up sheet */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-[var(--border-default)] bg-[var(--bg-card)] p-6 max-h-[70vh] overflow-y-auto animate-fade-in">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[var(--border-default)]" />
            <p className="section-label mb-4">Jump to Section</p>
            {navContent}
          </div>
        </>
      )}
    </>
  );
}
