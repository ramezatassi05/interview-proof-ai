import { test, expect } from '@playwright/test';

test.describe('Agent actions API smoke', () => {
  test('Unauthenticated requests are rejected (sanity check)', async ({ playwright }) => {
    // Fresh request context with NO storage state — should hit 401 on
    // auth-protected endpoints.
    const ctx = await playwright.request.newContext();
    const res = await ctx.get('/api/agent/sessions');
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('Authenticated GET /api/agent/sessions returns a list', async ({ request }) => {
    const res = await request.get('/api/agent/sessions');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
  });

  test('GET /api/opportunities returns the user opportunities list', async ({ request }) => {
    const res = await request.get('/api/opportunities');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
  });
});
