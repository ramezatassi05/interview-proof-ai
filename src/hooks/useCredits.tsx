'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './useAuth';

interface CreditsContextType {
  balance: number;
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  isPurchaseModalOpen: boolean;
  openPurchaseModal: () => void;
  closePurchaseModal: () => void;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

interface CreditsProviderProps {
  children: ReactNode;
}

export function CreditsProvider({ children }: CreditsProviderProps) {
  const { user, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/account');
      if (!res.ok) {
        throw new Error('Failed to fetch credits');
      }
      const data = await res.json();
      setBalance(data.data?.creditBalance ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    refreshBalance();
  }, [authLoading, refreshBalance]);

  // Check for successful payment in URL and refresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success') {
        refreshBalance();
        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete('payment');
        url.searchParams.delete('credits');
        window.history.replaceState({}, '', url);
      }
    }
  }, [refreshBalance]);

  const openPurchaseModal = useCallback(() => setIsPurchaseModalOpen(true), []);
  const closePurchaseModal = useCallback(() => setIsPurchaseModalOpen(false), []);

  return (
    <CreditsContext.Provider
      value={{
        balance,
        loading,
        error,
        refreshBalance,
        isPurchaseModalOpen,
        openPurchaseModal,
        closePurchaseModal,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
}
