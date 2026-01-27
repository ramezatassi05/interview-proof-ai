'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api, APIRequestError } from '@/lib/api';
import type { RoundType, PrepPreferences } from '@/types';

import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { PdfUpload } from '@/components/ui/PdfUpload';
import { Button } from '@/components/ui/Button';
import { RoundSelector } from '@/components/upload/RoundSelector';
import { PrepPreferencesForm } from '@/components/upload/PrepPreferencesForm';
import { AnalysisProgress } from '@/components/upload/AnalysisProgress';

interface FormErrors {
  resumeText?: string;
  jobDescriptionText?: string;
  roundType?: string;
  prepPreferences?: string;
  submit?: string;
}

const STEPS = [
  { number: 1, label: 'Resume' },
  { number: 2, label: 'Job Description' },
  { number: 3, label: 'Interview Type' },
  { number: 4, label: 'Study Plan' },
];

export default function NewReportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [resumeText, setResumeText] = useState('');
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [roundType, setRoundType] = useState<RoundType | null>(null);
  const [prepPreferences, setPrepPreferences] = useState<PrepPreferences | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    router.push('/auth/login?redirect=/new');
    return null;
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (resumeText.trim().length < 50) {
      newErrors.resumeText = 'Please upload a resume PDF';
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
      // Step 1: Create report
      const createResult = await api.createReport({
        resumeText: resumeText.trim(),
        jobDescriptionText: jobDescriptionText.trim(),
        roundType,
        prepPreferences: prepPreferences || undefined,
      });

      const reportId = createResult.data.reportId;

      // Step 2: Analyze report
      setIsAnalyzing(true);
      await api.analyzeReport(reportId);

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
    if (resumeText.length < 50) return 1;
    if (jobDescriptionText.length < 50) return 2;
    if (!roundType) return 3;
    if (!prepPreferences) return 4;
    return 5; // All complete
  };

  const currentStep = getCurrentStep();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <Header />

      <main className="flex-1 py-12">
        <Container size="md">
          {isAnalyzing ? (
            <Card variant="glass" className="mx-auto max-w-lg">
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
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  New Interview Diagnostic
                </h1>
                <p className="mt-2 text-[var(--text-secondary)]">
                  Upload your resume and paste the job description to get a readiness score and
                  rejection risks.
                </p>
              </div>

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
                              ? 'bg-[var(--accent-primary)] text-white glow-accent'
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
                    <CardTitle>Resume</CardTitle>
                    <CardDescription>Upload your resume as a PDF</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PdfUpload
                      onTextExtracted={setResumeText}
                      error={errors.resumeText}
                      disabled={isLoading}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Job Description</CardTitle>
                    <CardDescription>
                      Paste the full job posting you&apos;re targeting
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={jobDescriptionText}
                      onChange={(e) => setJobDescriptionText(e.target.value)}
                      placeholder="Paste the job description here..."
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
                    />
                  </CardContent>
                </Card>

                {errors.submit && (
                  <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] p-4">
                    <p className="text-sm text-[var(--color-danger)]">{errors.submit}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button variant="accent" type="submit" size="lg" loading={isLoading} glow>
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
