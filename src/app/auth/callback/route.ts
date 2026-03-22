import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { grantCredits } from '@/lib/credits';

// Promotional welcome credits for specific users
const WELCOME_CREDIT_EMAILS: Record<string, number> = {
  'business.codehype@gmail.com': 15,
  'phalgun.mittal99@gmail.com': 15,
};

/** Validate redirect is a safe relative path (prevents open redirect attacks) */
function sanitizeRedirect(redirect: string | null): string {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//') || redirect.includes('://')) {
    return '/';
  }
  return redirect;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = sanitizeRedirect(searchParams.get('redirect'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Grant promotional welcome credits if applicable
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const email = user?.email?.toLowerCase();
        const welcomeAmount = email ? WELCOME_CREDIT_EMAILS[email] : undefined;

        if (user && welcomeAmount) {
          const serviceClient = await createServiceClient();
          await grantCredits({
            supabase: serviceClient,
            userId: user.id,
            amount: welcomeAmount,
            reason: 'welcome',
            uniqueKey: user.id,
          });
        }
      } catch {
        // Non-blocking: welcome credits failure should not prevent login
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Redirect to login with error if code exchange fails
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
