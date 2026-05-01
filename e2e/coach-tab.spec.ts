import { test, expect } from '@playwright/test';

const REPORT_ID = process.env.E2E_TEST_REPORT_ID;

test.describe('Coach tab + Strategy tab (D6 + D7)', () => {
  test.beforeEach(async () => {
    if (!REPORT_ID) test.skip(true, 'E2E_TEST_REPORT_ID not set');
  });

  test('Coach tab renders the right rail and CoachingHub', async ({ page }) => {
    await page.goto(`/r/${REPORT_ID}/full`);

    // Switch to the Coach tab.
    await page.getByRole('tab', { name: /coach/i }).click();

    // Today's snapshot in the IntelligencePanel right rail.
    await expect(page.getByText(/today.s snapshot/i)).toBeVisible();

    // CoachingHub section header migrated from Strategy tab.
    await expect(page.getByRole('heading', { name: /coaching hub/i })).toBeVisible();
  });

  test('Strategy tab no longer contains CoachingHub', async ({ page }) => {
    await page.goto(`/r/${REPORT_ID}/full`);
    await page.getByRole('tab', { name: /strategy/i }).click();

    // Priority Actions and Cognitive Risk Map remain.
    await expect(
      page.getByRole('heading', { name: /priority actions|cognitive risk map/i }).first()
    ).toBeVisible();

    // Coaching Hub heading should NOT appear in the strategy tab any more.
    await expect(page.getByRole('heading', { name: /coaching hub/i })).toHaveCount(0);
  });
});
