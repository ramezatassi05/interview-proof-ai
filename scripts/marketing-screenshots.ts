/**
 * Marketing Screenshots Generator
 *
 * Captures 22 retina-quality screenshots of InterviewProof in both dark and light mode.
 * Authenticates automatically using Supabase admin magic link — no manual login needed.
 *
 * Usage:
 *   npx tsx scripts/marketing-screenshots.ts
 *
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SCREENSHOT_EMAIL
 * Or pass email: npx tsx scripts/marketing-screenshots.ts ramezfatassi@gmail.com
 */

import { chromium, type BrowserContext, type Page } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');
const VIEWPORT = { width: 1440, height: 900 };
const DEVICE_SCALE_FACTOR = 2;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const EMAIL = process.argv[2] || process.env.SCREENSHOT_EMAIL || 'ramezfatassi@gmail.com';

// ─── Helpers ────────────────────────────────────────────────────────────────

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }
    `,
  });
}

async function setTheme(page: Page, theme: 'dark' | 'light') {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
  }, theme);
  await page.waitForTimeout(400);
}

async function dismissOverlays(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-sonner-toast], [role="status"]').forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });
  });
}

async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

async function scrollToSection(page: Page, sectionId: string) {
  await page.evaluate((id) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ block: 'start' });
  }, sectionId);
  await page.waitForTimeout(600);
}

// ─── Auth via Supabase Admin API ────────────────────────────────────────────

async function authenticateWithMagicLink(context: BrowserContext): Promise<void> {
  console.log(`🔐  Generating magic link for ${EMAIL}...`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: EMAIL,
    options: {
      redirectTo: `${BASE_URL}/auth/callback`,
    },
  });

  if (error || !data?.properties?.action_link) {
    throw new Error(`Failed to generate magic link: ${error?.message || 'no link returned'}`);
  }

  // Rewrite the redirect_to to point to localhost
  const actionUrl = new URL(data.properties.action_link);
  actionUrl.searchParams.set('redirect_to', `${BASE_URL}/auth/callback`);
  const magicLink = actionUrl.toString();
  console.log('✅  Magic link generated');

  const page = context.pages()[0] || (await context.newPage());

  // Navigate to Supabase verify URL — it will redirect back with tokens in the URL hash
  await page.goto(magicLink, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Extract tokens from the URL hash (format: #access_token=...&refresh_token=...)
  const tokens = await page.evaluate(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return {
      accessToken: params.get('access_token'),
      refreshToken: params.get('refresh_token'),
    };
  });

  if (!tokens.accessToken || !tokens.refreshToken) {
    throw new Error('No tokens found in redirect URL hash.');
  }

  console.log('   Tokens extracted from redirect');

  // Navigate to the app and set cookies in @supabase/ssr chunked format
  await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });

  // Extract project ref for cookie name
  const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  // The session payload in the format @supabase/ssr expects
  const sessionPayload = JSON.stringify({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  });

  // @supabase/ssr chunks cookies at ~3180 chars each
  const CHUNK_SIZE = 3180;
  const chunks: string[] = [];
  for (let i = 0; i < sessionPayload.length; i += CHUNK_SIZE) {
    chunks.push(sessionPayload.substring(i, i + CHUNK_SIZE));
  }

  // Set chunked cookies via Playwright context (these get sent with every request)
  const cookieBase = {
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax' as const,
    expires: Math.floor(Date.now() / 1000) + 3600,
  };

  const cookiesToSet = chunks.map((chunk, i) => ({
    ...cookieBase,
    name: chunks.length === 1 ? cookieName : `${cookieName}.${i}`,
    value: chunk,
  }));

  await context.addCookies(cookiesToSet);
  console.log(`   Set ${cookiesToSet.length} auth cookie(s)`);

  // Navigate to dashboard — middleware should now pick up the session
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  if (page.url().includes('/auth/login')) {
    throw new Error('Authentication failed — still redirecting to login after session injection.');
  }

  console.log('✅  Authenticated\n');
}

// ─── Report Discovery ───────────────────────────────────────────────────────

async function discoverReportId(context: BrowserContext): Promise<string> {
  const page = context.pages()[0] || (await context.newPage());
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });

  if (page.url().includes('/auth/login')) {
    throw new Error('Not logged in — authentication may have failed.');
  }

  try {
    await Promise.race([
      page.waitForSelector('a[href^="/r/"]', { timeout: 15_000 }),
      page.waitForSelector('text=No reports yet', { timeout: 15_000 }),
    ]);
  } catch {
    console.log(`  ⚠️  Dashboard content slow to load. URL: ${page.url()}`);
  }

  const href = await page.evaluate(() => {
    const link = document.querySelector('a[href^="/r/"]');
    return link?.getAttribute('href') ?? null;
  });

  if (!href) {
    throw new Error('No report found on dashboard. Create a report first, then re-run.');
  }

  const match = href.match(/\/r\/([^/]+)/);
  if (!match) {
    throw new Error(`Could not parse report ID from href: ${href}`);
  }

  console.log(`📋  Using report ID: ${match[1]}`);
  return match[1];
}

// ─── Screenshot Target Definitions ─────────────────────────────────────────

interface ScreenshotTarget {
  name: string;
  num: string;
  url: string;
  action: (page: Page) => Promise<void>;
  elementSelector?: string;
}

function defineTargets(reportId: string): ScreenshotTarget[] {
  const fullUrl = `/r/${reportId}/full`;

  return [
    // ─── Landing Page (public) ─────────────────────────────────
    {
      name: 'landing-hero',
      num: '01',
      url: '/?access=open',
      action: async (page) => {
        await scrollToSection(page, '#hero');
      },
    },
    {
      name: 'landing-highlights',
      num: '02',
      url: '/?access=open',
      action: async (page) => {
        await scrollToSection(page, '#highlights');
      },
    },
    {
      name: 'landing-how-it-works',
      num: '03',
      url: '/?access=open',
      action: async (page) => {
        await scrollToSection(page, '#how-it-works');
      },
    },
    {
      name: 'landing-showcase',
      num: '04',
      url: '/?access=open',
      action: async (page) => {
        await scrollToSection(page, '#showcase');
      },
    },
    {
      name: 'landing-report-preview',
      num: '05',
      url: '/?access=open',
      action: async (page) => {
        await scrollToSection(page, '#report-preview');
      },
    },
    {
      name: 'landing-features',
      num: '06',
      url: '/?access=open',
      action: async (page) => {
        await scrollToSection(page, '#features');
      },
    },
    {
      name: 'landing-pricing',
      num: '07',
      url: '/?access=open',
      action: async (page) => {
        await scrollToSection(page, '#pricing');
      },
    },
    {
      name: 'landing-benefits',
      num: '08',
      url: '/?access=open',
      action: async (page) => {
        await scrollToSection(page, '#benefits');
      },
    },

    // ─── Dashboard ─────────────────────────────────────────────
    {
      name: 'dashboard-full',
      num: '09',
      url: '/dashboard',
      action: async (page) => {
        try {
          await page.waitForSelector('a[href^="/r/"]', { timeout: 10_000 });
        } catch {
          // no reports — capture as-is
        }
      },
    },

    // ─── Diagnostic Dashboard Hero ─────────────────────────────
    {
      name: 'diagnostic-dashboard',
      num: '10',
      url: fullUrl,
      action: async (page) => {
        try {
          await page.waitForSelector('svg circle', { timeout: 10_000 });
        } catch {
          // capture as-is
        }
      },
    },

    // ─── Diagnostic Tabs ───────────────────────────────────────
    {
      name: 'diagnostic-analysis',
      num: '11',
      url: fullUrl,
      action: async (page) => {
        try {
          await page.waitForSelector('[aria-controls="panel-analysis"]', { timeout: 10_000 });
        } catch {
          return;
        }
        await page.click('[aria-controls="panel-analysis"]').catch(() => {});
        await page.waitForTimeout(800);
        await scrollToSection(page, '[role="tabpanel"]');
      },
    },
    {
      name: 'diagnostic-practice',
      num: '12',
      url: fullUrl,
      action: async (page) => {
        try {
          await page.waitForSelector('[aria-controls="panel-practice"]', { timeout: 10_000 });
        } catch {
          return;
        }
        await page.click('[aria-controls="panel-practice"]').catch(() => {});
        await page.waitForTimeout(800);
        await scrollToSection(page, '[role="tabpanel"]');
      },
    },
    {
      name: 'diagnostic-strategy',
      num: '13',
      url: fullUrl,
      action: async (page) => {
        try {
          await page.waitForSelector('[aria-controls="panel-strategy"]', { timeout: 10_000 });
        } catch {
          return;
        }
        await page.click('[aria-controls="panel-strategy"]').catch(() => {});
        await page.waitForTimeout(800);
        await scrollToSection(page, '[role="tabpanel"]');
      },
    },
    {
      name: 'diagnostic-insights',
      num: '14',
      url: fullUrl,
      action: async (page) => {
        try {
          await page.waitForSelector('[aria-controls="panel-insights"]', { timeout: 10_000 });
        } catch {
          return;
        }
        await page.click('[aria-controls="panel-insights"]').catch(() => {});
        await page.waitForTimeout(800);
        await scrollToSection(page, '[role="tabpanel"]');
      },
    },

    // ─── Upload Flow ───────────────────────────────────────────
    {
      name: 'upload-flow',
      num: '15',
      url: '/new',
      action: async () => {},
    },

    // ─── Wallet ────────────────────────────────────────────────
    {
      name: 'wallet-overview',
      num: '16',
      url: '/wallet',
      action: async () => {},
    },

    // ─── Element Closeups ──────────────────────────────────────
    {
      name: 'closeup-score-ring',
      num: '17',
      url: fullUrl,
      action: async (page) => {
        try {
          await page.waitForSelector('svg circle', { timeout: 10_000 });
        } catch {
          // fallback
        }
      },
      elementSelector: '.flex.flex-col.items-center.gap-3:has(svg circle)',
    },
    {
      name: 'closeup-heatmap',
      num: '18',
      url: fullUrl,
      action: async (page) => {
        try {
          await page.waitForSelector('[aria-controls="panel-analysis"]', { timeout: 10_000 });
        } catch {
          return;
        }
        await page.click('[aria-controls="panel-analysis"]').catch(() => {});
        await page.waitForTimeout(800);
      },
      elementSelector: '.rounded-xl:has(table.w-full)',
    },
    {
      name: 'closeup-hire-zone',
      num: '19',
      url: fullUrl,
      action: async (page) => {
        try {
          await page.waitForSelector('[aria-controls="panel-analysis"]', { timeout: 10_000 });
        } catch {
          return;
        }
        await page.click('[aria-controls="panel-analysis"]').catch(() => {});
        await page.waitForTimeout(800);
      },
      elementSelector: '.rounded-xl:has(svg[viewBox="0 0 500 100"])',
    },
    {
      name: 'closeup-cognitive-radar',
      num: '20',
      url: fullUrl,
      action: async (page) => {
        try {
          await page.waitForSelector('[aria-controls="panel-strategy"]', { timeout: 10_000 });
        } catch {
          return;
        }
        await page.click('[aria-controls="panel-strategy"]').catch(() => {});
        await page.waitForTimeout(800);
      },
      elementSelector: '.rounded-xl:has(svg[viewBox="0 0 300 300"])',
    },
    {
      name: 'closeup-coaching',
      num: '21',
      url: fullUrl,
      action: async (page) => {
        try {
          await page.waitForSelector('[aria-controls="panel-strategy"]', { timeout: 10_000 });
        } catch {
          return;
        }
        await page.click('[aria-controls="panel-strategy"]').catch(() => {});
        await page.waitForTimeout(800);
      },
      elementSelector:
        '.rounded-xl:has(.rounded-xl.border.border-\\[var\\(--border-accent\\)\\])',
    },
    {
      name: 'closeup-recruiter',
      num: '22',
      url: fullUrl,
      action: async (page) => {
        try {
          await page.waitForSelector('[aria-controls="panel-insights"]', { timeout: 10_000 });
        } catch {
          return;
        }
        await page.click('[aria-controls="panel-insights"]').catch(() => {});
        await page.waitForTimeout(800);
      },
      elementSelector:
        '.rounded-xl:has([data-recruiter-view]), .rounded-xl:has(.font-mono.uppercase)',
    },
  ];
}

// ─── Capture Engine ─────────────────────────────────────────────────────────

async function captureTarget(
  context: BrowserContext,
  target: ScreenshotTarget,
  theme: 'dark' | 'light'
) {
  const page = await context.newPage();
  const filename = `${target.num}-${target.name}-${theme}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, theme, filename);

  try {
    await page.goto(`${BASE_URL}${target.url}`, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    });
    await waitForPageReady(page);
    await setTheme(page, theme);
    await disableAnimations(page);
    await dismissOverlays(page);

    await target.action(page);
    await page.waitForTimeout(400);
    await dismissOverlays(page);

    if (target.elementSelector) {
      const element = await page.$(target.elementSelector);
      if (element) {
        await element.screenshot({ path: filepath });
        console.log(`  ✅ ${filename}`);
      } else {
        console.log(`  ⚠️  ${filename} — selector not found: ${target.elementSelector}`);
        await page.screenshot({ path: filepath });
        console.log(`     ↳ Captured viewport fallback`);
      }
    } else {
      await page.screenshot({ path: filepath });
      console.log(`  ✅ ${filename}`);
    }
  } catch (err) {
    console.error(`  ❌ ${filename} — ${(err as Error).message}`);
  } finally {
    await page.close();
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🎨 InterviewProof Marketing Screenshots\n');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }

  ensureDir(path.join(SCREENSHOTS_DIR, 'dark'));
  ensureDir(path.join(SCREENSHOTS_DIR, 'light'));

  const browser = await chromium.launch({ headless: false });

  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: DEVICE_SCALE_FACTOR,
    });

    // Authenticate using admin-generated magic link
    await authenticateWithMagicLink(context);

    // Discover latest report
    const reportId = await discoverReportId(context);

    // Capture all screenshots
    const targets = defineTargets(reportId);
    const themes: Array<'dark' | 'light'> = ['dark', 'light'];

    for (const theme of themes) {
      console.log(`\n📸 Capturing ${theme} mode (${targets.length} shots)...\n`);

      for (const target of targets) {
        await captureTarget(context, target, theme);
      }
    }

    await context.close();

    const darkCount = fs.readdirSync(path.join(SCREENSHOTS_DIR, 'dark')).length;
    const lightCount = fs.readdirSync(path.join(SCREENSHOTS_DIR, 'light')).length;

    console.log(`\n🎉 Done! ${darkCount + lightCount} screenshots saved to ./screenshots/`);
    console.log(`   dark/  → ${darkCount} files`);
    console.log(`   light/ → ${lightCount} files\n`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
