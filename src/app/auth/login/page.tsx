'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Container } from '@/components/layout/Container';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/new';
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    error === 'auth_failed' ? 'Authentication failed. Please try again.' : null
  );

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
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Container size="sm" className="flex flex-1 items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in to InterviewProof</CardTitle>
            <CardDescription>Enter your email to receive a magic link</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center">
                <div className="mb-4 text-4xl">&#x2709;</div>
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  Check your email
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  We sent a magic link to <strong>{email}</strong>
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                  Click the link in the email to sign in.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-4 text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errorMessage || undefined}
                  required
                  autoFocus
                />
                <Button type="submit" loading={loading} className="w-full">
                  Send Magic Link
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
