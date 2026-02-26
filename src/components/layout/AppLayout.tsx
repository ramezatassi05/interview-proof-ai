'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface AppLayoutProps {
  children: ReactNode;
  activeTab?: string;
  reportData?: unknown;
  showIntelligencePanel?: boolean;
}

export function AppLayout({
  children,
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Header />

      <div className="flex flex-1">
        <main className="flex-1 min-w-0 py-8 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
