import { test, expect, type Page } from '@playwright/test';

const REPORT_ID = process.env.E2E_TEST_REPORT_ID;

// The interactive tour auto-opens on every diagnostic-page load. It traps
// focus and overlays the tab panels, so any test that clicks a non-default
// tab must dismiss it first. The "Skip tour" button is rendered inside the
// tour dialog at /r/[id]/full.
async function dismissTour(page: Page) {
  const skip = page.getByRole('button', { name: /skip tour/i });
  try {
    await skip.waitFor({ state: 'visible', timeout: 3000 });
    await skip.click();
    await skip.waitFor({ state: 'hidden', timeout: 2000 });
  } catch {
    // Tour wasn't open this load — nothing to do.
  }
}

test.describe('Coach tab + Strategy tab (D6 + D7)', () => {
  test.beforeEach(async () => {
    if (!REPORT_ID) test.skip(true, 'E2E_TEST_REPORT_ID not set');
  });

  test('Coach tab renders the right rail and CoachingHub', async ({ page }) => {
    await page.goto(`/r/${REPORT_ID}/full`);
    await dismissTour(page);

    // Switch to the Coach tab.
    await page.getByRole('tab', { name: /coach/i }).click();

    // Today's snapshot in the IntelligencePanel right rail.
    await expect(page.getByText(/today.s snapshot/i)).toBeVisible();

    // CoachingHub section header migrated from Strategy tab.
    await expect(page.getByRole('heading', { name: /coaching hub/i })).toBeVisible();
  });

  test('Strategy tab no longer contains CoachingHub', async ({ page }) => {
    await page.goto(`/r/${REPORT_ID}/full`);
    await dismissTour(page);
    await page.getByRole('tab', { name: /strategy/i }).click();

    // Priority Actions and Cognitive Risk Map remain.
    await expect(
      page.getByRole('heading', { name: /priority actions|cognitive risk map/i }).first()
    ).toBeVisible();

    // Coaching Hub heading should NOT appear in the strategy tab any more.
    await expect(page.getByRole('heading', { name: /coaching hub/i })).toHaveCount(0);
  });
});
