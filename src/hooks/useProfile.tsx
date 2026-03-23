'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile } from '@/types';

interface ProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/profile');
      const json = await res.json();
      setProfile(json.data ?? null);
    } catch (error) {
      console.error('Profile fetch error:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    fetchProfile();
  }, [authLoading, fetchProfile]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
