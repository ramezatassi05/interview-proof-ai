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

      // Check if user has completed onboarding
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const serviceClient = await createServiceClient();
          const { data: profile } = await serviceClient
            .from('user_profiles')
            .select('onboarding_completed')
            .eq('user_id', user.id)
            .single();

          if (profile?.onboarding_completed) {
            // Onboarding complete — set cookie and redirect to original destination
            const response = NextResponse.redirect(`${origin}${redirect}`);
            response.cookies.set('ip_onboarded', '1', {
              httpOnly: false,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 365, // 1 year
              path: '/',
            });
            return response;
          }

          // No profile or onboarding incomplete — redirect to onboarding
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      } catch {
        // Non-blocking: onboarding check failure should not prevent login
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Redirect to login with error if code exchange fails
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
