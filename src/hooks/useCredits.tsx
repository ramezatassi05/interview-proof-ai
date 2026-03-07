'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { ABANDONED_DISCOUNT } from '@/lib/stripe';

interface CreditsContextType {
  balance: number;
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  isPurchaseModalOpen: boolean;
  openPurchaseModal: () => void;
  closePurchaseModal: () => void;
  hasAbandonmentDiscount: boolean;
  clearAbandonmentDiscount: () => void;
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
  const [hasAbandonmentDiscount, setHasAbandonmentDiscount] = useState(false);

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

  const recordAbandonment = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(ABANDONED_DISCOUNT.localStorageKey)) {
      localStorage.setItem(ABANDONED_DISCOUNT.localStorageKey, Date.now().toString());
      setHasAbandonmentDiscount(true);
    }
  }, []);

  const clearAbandonmentDiscount = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ABANDONED_DISCOUNT.localStorageKey);
    }
    setHasAbandonmentDiscount(false);
  }, []);

  // Check abandonment discount from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(ABANDONED_DISCOUNT.localStorageKey);
    if (stored) {
      const timestamp = Number(stored);
      if (Date.now() - timestamp < ABANDONED_DISCOUNT.ttlMs) {
        setHasAbandonmentDiscount(true);
      } else {
        localStorage.removeItem(ABANDONED_DISCOUNT.localStorageKey);
      }
    }
  }, []);

  // Check for payment result in URL and refresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get('payment');

      if (paymentStatus === 'success') {
        refreshBalance();
        clearAbandonmentDiscount();
        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete('payment');
        url.searchParams.delete('credits');
        window.history.replaceState({}, '', url);
      } else if (paymentStatus === 'cancelled') {
        recordAbandonment();
        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete('payment');
        window.history.replaceState({}, '', url);
      }
    }
  }, [refreshBalance, clearAbandonmentDiscount, recordAbandonment]);

  const openPurchaseModal = useCallback(() => setIsPurchaseModalOpen(true), []);
  const closePurchaseModal = useCallback(() => {
    setIsPurchaseModalOpen(false);
    recordAbandonment();
  }, [recordAbandonment]);

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
        hasAbandonmentDiscount,
        clearAbandonmentDiscount,
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
