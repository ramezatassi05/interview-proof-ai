'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { Spinner } from '@/components/ui/Spinner';
import type { UserProfile } from '@/types';

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/auth/login?redirect=/onboarding');
      return;
    }

    // Fetch or create profile
    async function initProfile() {
      try {
        const res = await fetch('/api/profile');
        const json = await res.json();

        if (json.data) {
          // Profile exists
          if (json.data.onboardingCompleted) {
            // Already completed — set cookie and redirect
            document.cookie = 'ip_onboarded=1; path=/; max-age=31536000; SameSite=Lax';
            router.replace('/dashboard');
            return;
          }
          setProfile(json.data);
        } else {
          // Create new profile
          const createRes = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          const createJson = await createRes.json();
          setProfile(createJson.data);
        }
      } catch (error) {
        console.error('Profile init error:', error);
      } finally {
        setLoading(false);
      }
    }

    initProfile();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--text-secondary)]">Something went wrong. Please try again.</p>
      </div>
    );
  }

  return <OnboardingWizard initialProfile={profile} />;
}
