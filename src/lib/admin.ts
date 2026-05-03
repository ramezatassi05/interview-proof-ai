import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const ADMIN_ENV_KEYS = ['INTERVIEWPROOF_CEO_EMAILS', 'ADMIN_EMAILS'];

function parseEmailList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function configuredAdminEmails(): Set<string> {
  const emails = ADMIN_ENV_KEYS.flatMap((key) => parseEmailList(process.env[key]));
  return new Set(emails);
}

export function isAdminUser(user: User | null): user is User {
  if (!user) return false;
  const role = user.app_metadata?.role;
  if (role === 'admin' || role === 'ceo') return true;

  const email = user.email?.toLowerCase();
  if (!email) return false;
  return configuredAdminEmails().has(email);
}

export async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!isAdminUser(user)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true as const, supabase, user };
}
