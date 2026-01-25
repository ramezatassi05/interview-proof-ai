'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api, APIRequestError } from '@/lib/api';
import type { RoundType } from '@/types';

import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { PdfUpload } from '@/components/ui/PdfUpload';
import { Button } from '@/components/ui/Button';
import { RoundSelector } from '@/components/upload/RoundSelector';
import { AnalysisProgress } from '@/components/upload/AnalysisProgress';

interface FormErrors {
  resumeText?: string;
  jobDescriptionText?: string;
  roundType?: string;
  submit?: string;
}

export default function NewReportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [resumeText, setResumeText] = useState('');
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [roundType, setRoundType] = useState<RoundType | null>(null);
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

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1 py-12">
        <Container size="md">
          {isAnalyzing ? (
            <Card className="mx-auto max-w-lg">
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
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  New Interview Diagnostic
                </h1>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  Upload your resume and paste the job description to get a readiness score and
                  rejection risks.
                </p>
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

                {errors.submit && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                    <p className="text-sm text-red-800 dark:text-red-400">{errors.submit}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" size="lg" loading={isLoading}>
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
