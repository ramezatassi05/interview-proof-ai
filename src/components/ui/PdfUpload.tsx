'use client';

import { useCallback, useState, useRef } from 'react';

interface PdfUploadProps {
  onTextExtracted: (text: string) => void;
  error?: string;
  disabled?: boolean;
}

export function PdfUpload({ onTextExtracted, error, disabled }: PdfUploadProps) {
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
        <div className="flex items-center justify-between rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex items-center gap-3">
            <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2 5 5h-5V4zM8.5 13h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1zm0 2h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1zm0 2h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1 0-1z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{fileName}</p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Resume uploaded successfully
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || isUploading}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
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
            flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors
            ${isDragging ? 'border-zinc-500 bg-zinc-100 dark:bg-zinc-800' : 'border-zinc-300 dark:border-zinc-700'}
            ${disabled || isUploading ? 'cursor-not-allowed opacity-50' : 'hover:border-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}
            ${displayError ? 'border-red-500' : ''}
          `}
        >
          {isUploading ? (
            <>
              <svg className="h-10 w-10 animate-spin text-zinc-400" fill="none" viewBox="0 0 24 24">
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
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Processing PDF...</p>
            </>
          ) : (
            <>
              <svg
                className="h-10 w-10 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  Click to upload
                </span>{' '}
                or drag and drop
              </p>
              <p className="mt-1 text-xs text-zinc-500">PDF up to 5MB</p>
            </>
          )}
        </div>
      )}

      {displayError && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{displayError}</p>
      )}
    </div>
  );
}
