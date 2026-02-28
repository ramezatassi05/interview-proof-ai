'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/layout/Container';
import { WaitlistSuccess } from '@/components/waitlist/WaitlistSuccess';

function ConfirmContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const position = searchParams.get('position');
  const code = searchParams.get('code');
  const errorMessage = searchParams.get('message');

  return (
    <Container className="py-16 lg:py-24">
      {status === 'confirmed' && position && code ? (
        <WaitlistSuccess position={parseInt(position, 10)} referralCode={code} />
      ) : status === 'error' ? (
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-danger)]/10">
            <svg
              className="h-7 w-7 text-[var(--color-danger)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[var(--text-primary)]">
            {errorMessage === 'invalid-token'
              ? 'Invalid confirmation link'
              : 'Something went wrong'}
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            {errorMessage === 'invalid-token'
              ? 'This link may have expired or already been used. Try signing up again.'
              : 'Please try again later or contact support.'}
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent-primary)]" />
          <p className="mt-4 text-[var(--text-secondary)]">Confirming your spot...</p>
        </div>
      )}
    </Container>
  );
}

export default function WaitlistConfirmPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <Container className="py-16 lg:py-24">
              <div className="mx-auto max-w-md text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent-primary)]" />
                <p className="mt-4 text-[var(--text-secondary)]">Loading...</p>
              </div>
            </Container>
          }
        >
          <ConfirmContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
