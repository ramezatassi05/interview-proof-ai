'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api, APIRequestError } from '@/lib/api';
import type { RoundType, PrepPreferences, CareerStage, ExperienceLevel } from '@/types';

import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RoundSelector } from '@/components/upload/RoundSelector';
import { PrepPreferencesForm } from '@/components/upload/PrepPreferencesForm';
import { AnalysisProgress, DidYouKnowCard } from '@/components/upload/AnalysisProgress';
import { BlurFade } from '@/components/ui/blur-fade';

interface FormErrors {
  jobDescriptionText?: string;
  roundType?: string;
  prepPreferences?: string;
  submit?: string;
}

const STEPS = [
  { number: 1, label: 'Job Description' },
  { number: 2, label: 'Interview Type' },
  { number: 3, label: 'Study Plan' },
];

export default function NewReportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [roundType, setRoundType] = useState<RoundType | null>(null);
  const [prepPreferences, setPrepPreferences] = useState<PrepPreferences | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profileCareerStage, setProfileCareerStage] = useState<CareerStage | null>(null);
  const [profileResumeText, setProfileResumeText] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch user profile to get resume and auto-populate experience level
  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data?.careerStage) {
          setProfileCareerStage(data.data.careerStage);
        }
        setProfileResumeText(data?.data?.resumeText ?? null);
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [user]);

  const hasResume = !!profileResumeText && profileResumeText.length >= 50;

  const defaultExperienceLevel: ExperienceLevel | undefined = profileCareerStage
    ? ({
        student: 'intern' as const,
        new_grad: 'entry' as const,
        career_changer: 'entry' as const,
        experienced_professional: 'mid' as const,
      }[profileCareerStage])
    : undefined;

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    router.push('/auth/login?redirect=/new');
    return null;
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!hasResume) {
      newErrors.submit = 'Please upload your resume in Account settings before running an analysis.';
    }

    if (jobDescriptionText.trim().length < 50) {
      newErrors.jobDescriptionText = 'Job description must be at least 50 characters';
    }

    if (!roundType) {
      newErrors.roundType = 'Please select an interview round type';
    }

    // prepPreferences is optional but if started, must have at least one focus area
    if (prepPreferences && prepPreferences.focusAreas.length === 0) {
      newErrors.prepPreferences = 'Please select at least one focus area';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !roundType) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // Step 1: Create report (server fetches resume from profile)
      const createResult = await api.createReport({
        jobDescriptionText: jobDescriptionText.trim(),
        roundType,
        prepPreferences: prepPreferences || undefined,
      });

      const reportId = createResult.data.reportId;

      // Step 2: Multi-step analysis (avoids Vercel 60s timeout)
      setIsAnalyzing(true);
      await api.prepareAnalysis(reportId);
      await api.runAnalysisLLM(reportId);
      await api.completeAnalysis(reportId);

      // Step 3: Redirect to results
      router.push(`/r/${reportId}`);
    } catch (error) {
      setIsAnalyzing(false);
      if (error instanceof APIRequestError) {
        if (error.isUnauthorized) {
          router.push('/auth/login?redirect=/new');
        } else {
          setErrors({ submit: error.message });
        }
      } else if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || isAnalyzing;

  // Calculate current step for progress
  const getCurrentStep = () => {
    if (jobDescriptionText.length < 50) return 1;
    if (!roundType) return 2;
    if (!prepPreferences) return 3;
    return 4; // All complete
  };

  const currentStep = getCurrentStep();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Header />

      <main className="flex-1 py-12">
        <Container size="md">
          {isAnalyzing ? (
            <div className="mx-auto max-w-lg space-y-4">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Analyzing Your Readiness</CardTitle>
                  <CardDescription>
                    We&apos;re running a comprehensive diagnostic on your profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnalysisProgress isAnalyzing={isAnalyzing} />
                </CardContent>
              </Card>
              <DidYouKnowCard isAnalyzing={isAnalyzing} />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="mb-8">
                <h1 className="heading-modern text-2xl font-bold text-[var(--text-primary)]">
                  New Interview Diagnostic
                </h1>
                <p className="mt-2 text-[var(--text-secondary)]">
                  Paste the job description for the role you&apos;re targeting to get a readiness
                  score and rejection risks.
                </p>
              </div>

              {/* Resume Status Banner */}
              <BlurFade delay={0.1} inView>
                <div className="mb-8">
                  {profileLoading ? (
                    <div className="animate-pulse rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-12 rounded bg-[var(--bg-elevated)]" />
                        <div className="space-y-2">
                          <div className="h-4 w-40 rounded bg-[var(--bg-elevated)]" />
                          <div className="h-3 w-24 rounded bg-[var(--bg-elevated)]" />
                        </div>
                      </div>
                    </div>
                  ) : hasResume ? (
                    <Link href="/account" className="block">
                      <div className="group cursor-pointer rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 transition-all hover:border-[var(--accent-primary)]/40 hover:shadow-md">
                        <div className="flex items-center gap-4">
                          {/* Mini PDF Preview */}
                          <div className="relative h-[88px] w-[68px] shrink-0 overflow-hidden rounded-md border border-[var(--border-default)] bg-white shadow-sm transition-transform group-hover:scale-[1.02]">
                            {/* PDF page content */}
                            <div className="p-1.5">
                              {profileResumeText!
                                .split('\n')
                                .filter((l) => l.trim())
                                .slice(0, 12)
                                .map((line, i) => (
                                  <div
                                    key={i}
                                    className="mb-[2px] truncate text-[3.5px] leading-[5px] text-zinc-600"
                                    style={{
                                      fontWeight:
                                        i === 0 ? 700 : line === line.toUpperCase() ? 600 : 400,
                                      fontSize: i === 0 ? '4.5px' : '3.5px',
                                    }}
                                  >
                                    {line.slice(0, 60)}
                                  </div>
                                ))}
                            </div>
                            {/* Fade out at bottom */}
                            <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent" />
                            {/* PDF badge */}
                            <div className="absolute bottom-1 right-1 rounded-sm bg-red-500 px-1 py-[1px] text-[4px] font-bold text-white">
                              PDF
                            </div>
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-[var(--text-primary)]">
                                Your Resume
                              </p>
                              <Badge variant="success">Saved</Badge>
                            </div>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                              {profileResumeText!.length.toLocaleString()} characters
                            </p>
                            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] opacity-0 transition-opacity group-hover:opacity-100">
                              Click to update
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="rounded-xl border border-[var(--color-warning)]/20 bg-[var(--color-warning-muted)] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <svg
                            className="h-5 w-5 shrink-0 text-[var(--color-warning)]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                          <p className="text-sm text-[var(--color-warning)]">
                            No resume found. Upload your resume before running an analysis.
                          </p>
                        </div>
                        <Link href="/account">
                          <Button variant="primary" size="sm" type="button">
                            Upload Resume
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </BlurFade>

              {/* Progress Stepper */}
              <div className="mb-8 flex items-center justify-between">
                {STEPS.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div
                      className={`
                        flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all
                        ${
                          currentStep > step.number
                            ? 'bg-[var(--color-success)] text-white'
                            : currentStep === step.number
                              ? 'bg-[var(--accent-primary)] text-white'
                              : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                        }
                      `}
                    >
                      {currentStep > step.number ? (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={`ml-2 text-sm font-medium ${
                        currentStep >= step.number
                          ? 'text-[var(--text-primary)]'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {step.label}
                    </span>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`mx-4 h-0.5 w-12 sm:w-20 rounded ${
                          currentStep > step.number
                            ? 'bg-[var(--color-success)]'
                            : 'bg-[var(--border-default)]'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Job Description</CardTitle>
                    <CardDescription>
                      Paste the full job description from LinkedIn or any job board
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={jobDescriptionText}
                      onChange={(e) => setJobDescriptionText(e.target.value)}
                      placeholder="Paste the full job description from LinkedIn, Indeed, or any source..."
                      rows={10}
                      showCount
                      error={errors.jobDescriptionText}
                      disabled={isLoading}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Interview Round</CardTitle>
                    <CardDescription>
                      Select the type of interview you&apos;re preparing for
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RoundSelector
                      value={roundType}
                      onChange={setRoundType}
                      error={errors.roundType}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Personalized Study Plan</CardTitle>
                    <CardDescription>
                      Tell us about your timeline and preferences to get a tailored preparation
                      roadmap
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PrepPreferencesForm
                      value={prepPreferences}
                      onChange={setPrepPreferences}
                      error={errors.prepPreferences}
                      defaultExperienceLevel={defaultExperienceLevel}
                      careerStage={profileCareerStage}
                    />
                  </CardContent>
                </Card>

                {errors.submit && (
                  <div className="rounded-xl bg-[var(--color-danger-muted)] p-4">
                    <p className="text-sm text-[var(--color-danger)]">{errors.submit}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="gradient"
                    type="submit"
                    size="lg"
                    loading={isLoading}
                    disabled={!hasResume && !profileLoading}
                  >
                    Analyze My Readiness
                  </Button>
                </div>
              </div>
            </form>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
