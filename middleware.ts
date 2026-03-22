import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const maintenanceHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>InterviewProof — Maintenance</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #09090B;
      color: #E8E8ED;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 24px;
    }
    .container {
      text-align: center;
      max-width: 480px;
    }
    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 2rem;
      color: #6366F1;
    }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1rem;
      letter-spacing: -0.02em;
    }
    p {
      color: #8B8B95;
      font-size: 1.05rem;
      line-height: 1.6;
    }
    .divider {
      width: 48px;
      height: 2px;
      background: linear-gradient(90deg, #6366F1, #818CF8);
      margin: 1.5rem auto;
      border-radius: 1px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">InterviewProof</div>
    <h1>We'll be back soon</h1>
    <div class="divider"></div>
    <p>We're performing scheduled maintenance to improve your experience. Please check back shortly.</p>
  </div>
</body>
</html>`;

const MAINTENANCE_PASSTHROUGH = ['/api/webhook/', '/api/cron/'];

export async function middleware(request: NextRequest) {
  // MAINTENANCE MODE: hardcoded ON — remove this block to restore the site
  if (true) {
    const path = request.nextUrl.pathname;
    const isPassthrough = MAINTENANCE_PASSTHROUGH.some((prefix) => path.startsWith(prefix));
    if (!isPassthrough) {
      return new NextResponse(maintenanceHTML, {
        status: 503,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Retry-After': '3600',
        },
      });
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
