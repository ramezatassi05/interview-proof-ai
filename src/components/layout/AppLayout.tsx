'use client';

import { ReactNode, useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';
import { IntelligencePanel } from './IntelligencePanel';
import type { GetReportResponse } from '@/lib/api';

type ReportData = GetReportResponse['data'];

interface AppLayoutProps {
  children: ReactNode;
  activeTab?: string;
  reportData?: ReportData | null;
  showSidebar?: boolean;
  showIntelligencePanel?: boolean;
}

export function AppLayout({
  children,
  activeTab = 'scores',
  reportData = null,
  showSidebar = true,
  showIntelligencePanel = true,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} showMenuButton={showSidebar} />

      <div className="flex flex-1">
        {/* Left Sidebar */}
        {showSidebar && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 py-8 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">{children}</div>
        </main>

        {/* Right Intelligence Panel - Hidden on mobile/tablet */}
        {showIntelligencePanel && (
          <aside className="hidden xl:block w-80 flex-shrink-0 bg-[var(--bg-card)] shadow-warm">
            <div className="sticky top-0 h-screen overflow-y-auto p-6">
              <IntelligencePanel activeTab={activeTab} reportData={reportData} />
            </div>
          </aside>
        )}
      </div>

      <Footer />
    </div>
  );
}
