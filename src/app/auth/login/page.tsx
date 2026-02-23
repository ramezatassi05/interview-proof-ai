'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Container } from '@/components/layout/Container';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/new';
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    error === 'auth_failed' ? 'Authentication failed. Please try again.' : null
  );

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setOauthLoading(null);
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSent(true);
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in to InterviewProof</CardTitle>
        <CardDescription>Enter your email to receive a magic link</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success-muted)]">
                <svg
                  className="h-8 w-8 text-[var(--color-success)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)]">Check your email</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              We sent a magic link to{' '}
              <strong className="text-[var(--text-primary)]">{email}</strong>
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Click the link in the email to sign in.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-4 text-sm text-[var(--accent-primary)] underline hover:text-[var(--accent-secondary)]"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={oauthLoading !== null}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)] disabled:opacity-50"
              >
                {oauthLoading === 'google' ? (
                  <Spinner size="sm" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('github')}
                disabled={oauthLoading !== null}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)] disabled:opacity-50"
              >
                {oauthLoading === 'github' ? (
                  <Spinner size="sm" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M9 0C4.027 0 0 4.027 0 9c0 3.978 2.579 7.35 6.154 8.541.45.082.616-.195.616-.432 0-.214-.008-.78-.012-1.531-2.503.544-3.032-1.206-3.032-1.206-.41-1.04-1-1.316-1-1.316-.816-.558.062-.546.062-.546.903.063 1.378.927 1.378.927.803 1.375 2.106.978 2.62.748.081-.582.314-.978.571-1.203-1.999-.227-4.1-1-4.1-4.448 0-.983.351-1.786.927-2.416-.093-.228-.402-1.143.088-2.382 0 0 .756-.242 2.475.923A8.627 8.627 0 019 4.363c.765.004 1.535.103 2.254.303 1.718-1.165 2.472-.923 2.472-.923.492 1.24.183 2.154.09 2.382.578.63.926 1.433.926 2.416 0 3.457-2.104 4.218-4.11 4.44.323.278.611.828.611 1.668 0 1.204-.011 2.175-.011 2.472 0 .24.163.519.62.431C15.424 16.347 18 12.975 18 9c0-4.973-4.027-9-9-9z"/>
                  </svg>
                )}
                Continue with GitHub
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-default)]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[var(--bg-card)] px-3 text-[var(--text-muted)]">or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errorMessage || undefined}
                required
              />
              <Button variant="accent" type="submit" loading={loading} glow className="w-full">
                Send Magic Link
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoginLoading() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex min-h-[200px] items-center justify-center">
        <Spinner size="lg" />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-primary)]">
      <Container size="sm" className="flex flex-1 items-center justify-center py-12">
        <Suspense fallback={<LoginLoading />}>
          <LoginForm />
        </Suspense>
      </Container>
    </div>
  );
}
