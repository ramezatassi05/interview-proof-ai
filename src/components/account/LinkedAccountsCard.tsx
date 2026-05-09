'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { MagicCard } from '@/components/ui/magic-card';

interface LinkedAccount {
  id: string;
  provider: 'google';
  accountEmail: string | null;
  scope: string;
  expiresAt: string | null;
}

const PROVIDER_LABELS: Record<LinkedAccount['provider'], string> = {
  google: 'Google (Gmail + Calendar)',
};

const PROVIDER_DESCRIPTIONS: Record<LinkedAccount['provider'], string> = {
  google: 'Lets your agents send recruiter replies from your Gmail and propose interview slots on your Calendar.',
};

export function LinkedAccountsCard() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Surface the redirect-back banner from the OAuth callback.
  useEffect(() => {
    const ok = searchParams?.get('linked_ok');
    const err = searchParams?.get('linked_error');
    if (ok) setSuccess(`Connected ${ok}.`);
    if (err) setError(humanizeOAuthError(err));
  }, [searchParams]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/account/linked-accounts');
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const json = (await res.json()) as { data: LinkedAccount[] };
      setAccounts(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleConnect = (provider: LinkedAccount['provider']) => {
    if (provider === 'google') {
      window.location.href = '/api/auth/google/start';
    }
  };

  const handleDisconnect = async (provider: LinkedAccount['provider']) => {
    setBusyProvider(provider);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/account/linked-accounts/${provider}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setBusyProvider(null);
    }
  };

  const providers: LinkedAccount['provider'][] = ['google'];

  return (
    <MagicCard className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)]">
      <Card className="border-0 bg-transparent">
        <CardHeader>
          <CardTitle>Connected accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Loading…</p>
          ) : (
            <div className="space-y-3">
              {success && (
                <p className="rounded-md border border-[var(--color-success)]/30 bg-[var(--color-success-muted)] px-3 py-2 text-xs text-[var(--color-success)]">
                  {success}
                </p>
              )}
              {error && (
                <p className="rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] px-3 py-2 text-xs text-[var(--color-danger)]">
                  {error}
                </p>
              )}
              {providers.map((provider) => {
                const connected = accounts.find((a) => a.provider === provider);
                return (
                  <div
                    key={provider}
                    className="flex items-start justify-between gap-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {PROVIDER_LABELS[provider]}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        {PROVIDER_DESCRIPTIONS[provider]}
                      </p>
                      {connected?.accountEmail && (
                        <p className="mt-2 font-mono text-[11px] text-[var(--text-muted)]">
                          {connected.accountEmail}
                        </p>
                      )}
                    </div>
                    {connected ? (
                      <button
                        type="button"
                        onClick={() => handleDisconnect(provider)}
                        disabled={busyProvider === provider}
                        className="shrink-0 rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] disabled:opacity-50"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleConnect(provider)}
                        className="shrink-0 rounded-md bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </MagicCard>
  );
}

function humanizeOAuthError(code: string): string {
  switch (code) {
    case 'oauth_not_configured':
      return 'Google OAuth is not configured on this deployment yet.';
    case 'state_mismatch':
      return 'OAuth state mismatch — please try connecting again.';
    case 'token_exchange_failed':
      return 'Google rejected the token exchange. Try again.';
    case 'insufficient_scope':
      return 'The Gmail-send and Calendar scopes are required. Please grant both.';
    case 'store_failed':
      return 'Could not save your connection. Try again.';
    case 'unauthorized':
      return 'Please sign in first, then connect.';
    default:
      return `Connection failed: ${code}`;
  }
}
