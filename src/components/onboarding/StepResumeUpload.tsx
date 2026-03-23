'use client';

import { useState, useCallback } from 'react';
import { BlurFade } from '@/components/ui/blur-fade';
import { Spinner } from '@/components/ui/Spinner';
import type { ExtractedResume } from '@/types';

interface StepResumeUploadProps {
  hasResume: boolean;
  onUpload: (parsed: ExtractedResume | null, text: string) => void;
}

export function StepResumeUpload({ hasResume, onUpload }: StepResumeUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);

      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file.');
        setUploading(false);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('File must be less than 5MB.');
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/profile/upload-resume', {
          method: 'POST',
          body: formData,
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json.error || 'Upload failed. Please try again.');
          setUploading(false);
          return;
        }

        setFileName(file.name);
        onUpload(json.data.parsed, json.data.text);
      } catch {
        setError('Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const showSuccess = hasResume || fileName;

  return (
    <div className="flex flex-col items-center">
      <BlurFade delay={0}>
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-primary)]/10">
          <svg className="h-8 w-8 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m0 0l2.25-2.25M9.75 15l2.25 2.25M6 3v18h12V8.25L13.5 3H6z" />
          </svg>
        </div>
      </BlurFade>

      <BlurFade delay={0.1}>
        <h1 className="mb-2 text-center font-serif text-3xl font-bold text-[var(--text-primary)]">
          Upload Your Resume
        </h1>
      </BlurFade>

      <BlurFade delay={0.2}>
        <p className="mb-10 text-center text-[var(--text-secondary)]">
          We&apos;ll use your resume to auto-fill your profile and provide better analysis.
        </p>
      </BlurFade>

      <BlurFade delay={0.3}>
        <div className="w-full max-w-md">
          {showSuccess ? (
            <div className="flex items-center gap-3 rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-success)]/10">
                <svg className="h-5 w-5 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {fileName || 'Resume uploaded'}
                </p>
                <p className="text-xs text-[var(--color-success)]">
                  Parsed successfully — your profile will be auto-filled
                </p>
              </div>
            </div>
          ) : (
            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed p-10 transition-colors ${
                dragOver
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                  : 'border-[var(--border-default)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {uploading ? (
                <Spinner size="md" />
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-elevated)]">
                    <svg className="h-6 w-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      Drop your resume here or <span className="text-[var(--accent-primary)]">browse</span>
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">PDF only, up to 5MB</p>
                  </div>
                </>
              )}
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleInputChange}
                disabled={uploading}
              />
            </label>
          )}

          {error && (
            <p className="mt-3 text-center text-sm text-[var(--color-danger)]">{error}</p>
          )}
        </div>
      </BlurFade>
    </div>
  );
}
