'use client';

import { ReactNode } from 'react';
import { CreditsProvider, useCredits } from '@/hooks/useCredits';
import { CreditsPurchaseModal } from './CreditsPurchaseModal';

function CreditsModal() {
  const { isPurchaseModalOpen, closePurchaseModal } = useCredits();
  return <CreditsPurchaseModal isOpen={isPurchaseModalOpen} onClose={closePurchaseModal} />;
}

interface CreditsWrapperProps {
  children: ReactNode;
}

export function CreditsWrapper({ children }: CreditsWrapperProps) {
  return (
    <CreditsProvider>
      {children}
      <CreditsModal />
    </CreditsProvider>
  );
}
