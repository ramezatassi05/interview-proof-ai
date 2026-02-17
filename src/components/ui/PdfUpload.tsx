'use client';

import { useCallback, useState, useRef } from 'react';

interface PdfUploadProps {
  onTextExtracted: (text: string) => void;
  onManualEntry?: () => void;
  error?: string;
  disabled?: boolean;
}

export function PdfUpload({ onTextExtracted, onManualEntry, error, disabled }: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf') {
        setUploadError('Please upload a PDF file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        return;
      }

      setIsUploading(true);
      setUploadError(null);
      setFileName(file.name);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to parse PDF');
        }

        onTextExtracted(data.data.text);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Failed to parse PDF');
        setFileName(null);
      } finally {
        setIsUploading(false);
      }
    },
    [onTextExtracted]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, isUploading, handleFile]
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

  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  const handleRemove = () => {
    setFileName(null);
    setUploadError(null);
    onTextExtracted('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const displayError = uploadError || error;

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {fileName ? (
        <div className="flex items-center justify-between rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success-muted)] px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-success)]/20">
              <svg
                className="h-6 w-6 text-[var(--color-success)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{fileName}</p>
              <p className="text-xs text-[var(--color-success)]">Resume uploaded successfully</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || isUploading}
            className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 transition-all
            ${isDragging ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-[var(--border-default)]'}
            ${disabled || isUploading ? 'cursor-not-allowed opacity-50' : 'hover:border-[var(--accent-primary)] hover:bg-[var(--bg-elevated)]'}
            ${displayError ? 'border-[var(--color-danger)]' : ''}
          `}
        >
          {isUploading ? (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-primary)]/20">
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
              <p className="mt-4 text-sm text-[var(--text-secondary)]">Processing PDF...</p>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-primary)]/20">
                <svg
                  className="h-7 w-7 text-[var(--accent-primary)]"
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
            </>
          )}
        </div>
      )}

      {displayError && <p className="mt-2 text-xs text-[var(--color-danger)]">{displayError}</p>}

      {onManualEntry && (
        <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
          <button
            type="button"
            onClick={onManualEntry}
            className="text-[var(--accent-primary)] hover:underline"
          >
            Or paste your resume text instead
          </button>
        </p>
      )}
    </div>
  );
}
