'use client';

import { useCallback, useRef, useState } from 'react';
import { BlurFade } from '@/components/ui/blur-fade';

type TabId = 'analysis' | 'practice' | 'strategy' | 'insights';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface DiagnosticTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  tabs: TabConfig[];
  children: React.ReactNode;
}

const BarChartIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const BookOpenIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const TargetIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export { BarChartIcon, BookOpenIcon, TargetIcon, EyeIcon };
export type { TabId, TabConfig };

export function DiagnosticTabs({ activeTab, onTabChange, tabs, children }: DiagnosticTabsProps) {
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Observe when tab bar should become sticky
  const stickyCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    sentinelRef.current = node;

    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      {/* Sentinel for sticky detection */}
      <div ref={stickyCallbackRef} className="h-0" />

      {/* Tab bar */}
      <div
        ref={tabBarRef}
        className={`
          sticky top-0 z-30 transition-all duration-200
          ${isSticky ? 'glass shadow-md border-b border-[var(--border-default)]' : ''}
        `}
      >
        <div
          className={`
            flex gap-1.5 rounded-2xl p-2 overflow-x-auto scrollbar-none
            ${!isSticky ? 'bg-[var(--bg-card)] border border-[var(--border-default)]' : ''}
          `}
          role="tablist"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 whitespace-nowrap flex-1 justify-center
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                  }
                `}
              >
                <span className="flex-shrink-0">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`
                      ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-mono leading-none
                      ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}
                    `}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="pt-6">
        <BlurFade key={activeTab} duration={0.3} offset={8}>
          {children}
        </BlurFade>
      </div>
    </div>
  );
}
