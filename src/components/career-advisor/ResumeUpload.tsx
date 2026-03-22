'use client';

import { useCallback, useState, useRef } from 'react';
import { api } from '@/lib/api';
import type { UserResume } from '@/types';
import { MagicCard } from '@/components/ui/magic-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { TypingAnimation } from '@/components/ui/typing-animation';
import { BlurFade } from '@/components/ui/blur-fade';

interface ResumeUploadProps {
  onParsed: (resume: UserResume) => void;
}

export function ResumeUpload({ onParsed }: ResumeUploadProps) {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are supported.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB.');
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const result = await api.parseResume(file);
        onParsed(result.data.resume);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse resume.');
      } finally {
        setIsUploading(false);
      }
    },
    [onParsed]
  );

  const handlePasteSubmit = useCallback(async () => {
    if (pasteText.trim().length < 50) {
      setError('Resume text is too short (minimum 50 characters).');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await api.parseResumeText(pasteText);
      onParsed(result.data.resume);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse resume.');
    } finally {
      setIsUploading(false);
    }
  }, [pasteText, onParsed]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (isUploading) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [isUploading, handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (isUploading) {
    return (
      <BlurFade delay={0.1}>
        <MagicCard className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-primary)]/20">
              <svg
                className="h-8 w-8 animate-spin text-[var(--accent-primary)]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </div>
            <TypingAnimation
              className="text-base font-medium text-[var(--text-primary)]"
              duration={60}
              startOnView={false}
            >
              Analyzing your resume...
            </TypingAnimation>
            <p className="text-sm text-[var(--text-muted)]">
              Extracting skills, experience, and career trajectory
            </p>
          </div>
        </MagicCard>
      </BlurFade>
    );
  }

  return (
    <BlurFade delay={0.1}>
      <MagicCard className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
          className="hidden"
        />

        {mode === 'upload' ? (
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 transition-all
              ${isDragging ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-[var(--accent-primary)]/30'}
              hover:border-[var(--accent-primary)] hover:bg-[var(--bg-elevated)]
            `}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-primary)]/15">
              <svg
                className="h-8 w-8 text-[var(--accent-primary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">Click to upload</span> or
              drag and drop
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">PDF up to 5MB</p>
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your full resume text here..."
              className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] p-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] min-h-[200px] resize-y"
            />
            <ShimmerButton
              onClick={handlePasteSubmit}
              disabled={pasteText.trim().length < 50}
              shimmerColor="var(--accent-primary)"
              background="var(--accent-primary)"
              borderRadius="12px"
              className="w-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Analyze Resume
            </ShimmerButton>
          </div>
        )}

        {error && <p className="mt-3 text-xs text-[var(--color-danger)]">{error}</p>}

        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
          {mode === 'upload' ? (
            <button
              type="button"
              onClick={() => {
                setMode('paste');
                setError(null);
              }}
              className="text-[var(--accent-primary)] hover:underline"
            >
              Or paste your resume text instead
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('upload');
                setError(null);
              }}
              className="text-[var(--accent-primary)] hover:underline"
            >
              Or upload a PDF instead
            </button>
          )}
        </p>
      </MagicCard>
    </BlurFade>
  );
}
