import { test as setup, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import path from 'node:path';
import fs from 'node:fs';

const AUTH_FILE = path.join(__dirname, '..', '.playwright', 'auth.json');

setup('authenticate test user', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  const bootstrapSecret = process.env.E2E_BOOTSTRAP_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!email || !password || !bootstrapSecret || !supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'E2E_TEST_EMAIL, E2E_TEST_PASSWORD, E2E_BOOTSTRAP_SECRET, NEXT_PUBLIC_SUPABASE_URL, ' +
        'and NEXT_PUBLIC_SUPABASE_ANON_KEY must all be set in .env.local. ' +
        'Run `npx tsx scripts/seed-e2e.ts -- --write` to seed.'
    );
  }

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  const sb = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(
      `signInWithPassword failed: ${error?.message ?? 'no session returned'}. ` +
        'Check that the email provider is enabled in Supabase Auth settings.'
    );
  }

  const seedResponse = await page.request.post('/api/e2e/seed-session', {
    headers: { 'x-e2e-secret': bootstrapSecret },
    data: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
  });
  expect(
    seedResponse.status(),
    `seed-session route returned ${seedResponse.status()}: ${await seedResponse.text()}`
  ).toBe(204);

  await page.goto('/');
  await expect(page).not.toHaveURL(/\/auth\/login/);

  await page.context().storageState({ path: AUTH_FILE });
});
