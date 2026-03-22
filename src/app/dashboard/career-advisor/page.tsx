'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import type { UserResume } from '@/types';
import { AppLayout } from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { BlurFade } from '@/components/ui/blur-fade';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { DotPattern } from '@/components/ui/dot-pattern';
import { BorderBeam } from '@/components/ui/border-beam';
import { ResumeUpload } from '@/components/career-advisor/ResumeUpload';
import { ResumeSummary } from '@/components/career-advisor/ResumeSummary';
import { CareerAdvisorChat } from '@/components/career-advisor/CareerAdvisorChat';

export default function CareerAdvisorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [resume, setResume] = useState<UserResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/dashboard/career-advisor');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || authLoading) return;

    const fetchResume = async () => {
      try {
        const result = await api.getResume();
        setResume(result.data.resume);
      } catch {
        // No resume yet — that's fine
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [user, authLoading]);

  const handleParsed = useCallback((newResume: UserResume) => {
    setResume(newResume);
    setShowUpload(false);
  }, []);

  const handleDelete = useCallback(async () => {
    try {
      await api.deleteResume();
      setResume(null);
    } catch {
      // Silently fail — user can retry
    }
  }, []);

  const handleUpdate = useCallback(() => {
    setShowUpload(true);
  }, []);

  if (authLoading || !user) {
    return (
      <AppLayout showIntelligencePanel={false}>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout showIntelligencePanel={false}>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  // No resume — show upload
  if (!resume || showUpload) {
    return (
      <AppLayout showIntelligencePanel={false}>
        <div className="relative">
          <DotPattern className="absolute inset-0 opacity-[0.03] pointer-events-none [mask-image:radial-gradient(400px_at_center,white,transparent)]" />

          <div className="relative max-w-lg mx-auto space-y-6 py-8">
            <BlurFade delay={0}>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  <AnimatedGradientText
                    colorFrom="#4F46E5"
                    colorTo="#7C3AED"
                    className="text-2xl font-bold"
                  >
                    Career Advisor
                  </AnimatedGradientText>
                </h1>
                <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                  Upload your resume and get personalized career roadmaps, skill gap analysis,
                  and learning recommendations powered by real market data.
                </p>
              </div>
            </BlurFade>

            <BlurFade delay={0.1}>
              <ResumeUpload onParsed={handleParsed} />
            </BlurFade>

            {showUpload && resume && (
              <BlurFade delay={0.15}>
                <button
                  onClick={() => setShowUpload(false)}
                  className="block mx-auto text-sm text-[var(--accent-primary)] hover:underline"
                >
                  Cancel and return to chat
                </button>
              </BlurFade>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Resume exists — show summary + chat
  return (
    <AppLayout showIntelligencePanel={false}>
      <div className="flex flex-col h-[calc(100vh-10rem)]">
        {/* Collapsible resume summary */}
        <div className="mb-4">
          <ResumeSummary
            resume={resume}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </div>

        {/* Chat area */}
        <div className="relative flex-1 min-h-0 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden">
          <BorderBeam
            size={200}
            duration={15}
            colorFrom="var(--accent-primary)"
            colorTo="var(--accent-secondary, #7C3AED)"
          />
          <CareerAdvisorChat resume={resume} />
        </div>
      </div>
    </AppLayout>
  );
}
