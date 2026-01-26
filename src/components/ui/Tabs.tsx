'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within a Tabs provider');
  }
  return context;
}

interface TabsProps {
  defaultTab: string;
  children: ReactNode;
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export function Tabs({ defaultTab, children, className = '', onTabChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleSetActiveTab = (id: string) => {
    setActiveTab(id);
    onTabChange?.(id);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleSetActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabListProps {
  children: ReactNode;
  className?: string;
}

export function TabList({ children, className = '' }: TabListProps) {
  return (
    <div
      className={`
        flex gap-1 rounded-xl p-1.5
        bg-[var(--bg-card)] border border-[var(--border-default)]
        overflow-x-auto
        ${className}
      `}
      role="tablist"
    >
      {children}
    </div>
  );
}

interface TabTriggerProps {
  id: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function TabTrigger({ id, children, icon, className = '' }: TabTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === id;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${id}`}
      onClick={() => setActiveTab(id)}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
        transition-all duration-200 whitespace-nowrap
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]
        ${
          isActive
            ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm border border-[var(--border-accent)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50'
        }
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

interface TabContentProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function TabContent({ id, children, className = '' }: TabContentProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== id) {
    return null;
  }

  return (
    <div
      id={`panel-${id}`}
      role="tabpanel"
      aria-labelledby={id}
      className={`animate-fade-in ${className}`}
    >
      {children}
    </div>
  );
}
