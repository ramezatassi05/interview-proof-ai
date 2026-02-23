'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  initialEnabled: boolean;
  initialShareUrl?: string;
  readinessScore?: number;
  companyName?: string;
}

export function ShareModal({
  isOpen,
  onClose,
  reportId,
  initialEnabled,
  initialShareUrl,
  readinessScore,
  companyName,
}: ShareModalProps) {
  const [shareEnabled, setShareEnabled] = useState(initialEnabled);
  const [shareUrl, setShareUrl] = useState(initialShareUrl || '');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.toggleShare(reportId, !shareEnabled);
      setShareEnabled(result.data.shareEnabled);
      setShareUrl(result.data.shareUrl);
    } catch {
      setError('Failed to update sharing settings');
    } finally {
      setLoading(false);
    }
  }, [reportId, shareEnabled]);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const handleEmail = useCallback(() => {
    const subject = encodeURIComponent(
      `Interview Readiness Report${companyName ? ` — ${companyName}` : ''}`
    );
    const scoreText = readinessScore != null ? `Readiness Score: ${readinessScore}/100\n\n` : '';
    const body = encodeURIComponent(
      `Check out my interview readiness report:\n\n${scoreText}${shareUrl}\n\nGenerated with InterviewProof`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  }, [shareUrl, readinessScore, companyName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-fade-in rounded-[20px] bg-[var(--bg-card)] p-6 shadow-warm">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Share Report</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Share a read-only version of your diagnostic report
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] p-3 text-center text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        {/* Toggle */}
        <div className="flex items-center justify-between rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Enable sharing</p>
            <p className="text-xs text-[var(--text-muted)]">
              Anyone with the link can view
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
              shareEnabled ? 'bg-[var(--color-accent)]' : 'bg-[var(--border-default)]'
            } ${loading ? 'opacity-50' : ''}`}
            role="switch"
            aria-checked={shareEnabled}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                shareEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
              } mt-[2px]`}
            />
          </button>
        </div>

        {/* Share URL + Actions (only when enabled) */}
        {shareEnabled && shareUrl && (
          <div className="mt-4 space-y-3">
            {/* URL input + copy */}
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-secondary)] outline-none"
              />
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-all hover:bg-[var(--bg-card)] hover:border-[var(--border-accent)]"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Email button */}
            <button
              onClick={handleEmail}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-all hover:bg-[var(--bg-card)] hover:border-[var(--border-accent)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Email to myself
            </button>
          </div>
        )}

        {/* Privacy note */}
        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
          Your resume and job description are not included in shared reports.
        </p>
      </div>
    </div>
  );
}
