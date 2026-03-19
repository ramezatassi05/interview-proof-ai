'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Credits system is currently disabled — redirect to account page.
// Original wallet implementation preserved in git history for re-enablement.
export default function WalletPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account');
  }, [router]);

  return null;
}
