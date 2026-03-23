import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Routes that bypass the onboarding guard */
const ONBOARDING_BYPASS = ['/', '/auth/', '/api/', '/onboarding', '/s/'];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Onboarding guard: redirect authenticated users without onboarding to /onboarding
  if (user) {
    const path = request.nextUrl.pathname;
    const isBypassed =
      path === '/' || ONBOARDING_BYPASS.some((prefix) => prefix !== '/' && path.startsWith(prefix));

    if (!isBypassed) {
      const onboardedCookie = request.cookies.get('ip_onboarded');
      if (!onboardedCookie) {
        const url = request.nextUrl.clone();
        url.pathname = '/onboarding';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
