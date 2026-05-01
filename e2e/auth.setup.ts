import { test as setup, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const AUTH_FILE = path.join(__dirname, '..', '.playwright', 'auth.json');

setup('authenticate test user', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set in .env.local for Playwright auth.setup'
    );
  }

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), {
    timeout: 30_000,
  });

  await expect(page).not.toHaveURL(/\/auth\/login/);

  await page.context().storageState({ path: AUTH_FILE });
});
