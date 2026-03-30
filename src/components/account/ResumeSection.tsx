'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { Badge } from '@/components/ui/Badge';
import { PdfUpload } from '@/components/ui/PdfUpload';
import { Textarea } from '@/components/ui/Textarea';
import { MagicCard } from '@/components/ui/magic-card';

const PREVIEW_CHAR_LIMIT = 500;

interface ResumeSectionProps {
  initialResumeText: string | null;
  initialResumePdfPath: string | null;
}

export function ResumeSection({ initialResumeText, initialResumePdfPath }: ResumeSectionProps) {
  const [resumeText, setResumeText] = useState<string | null>(initialResumeText);
  const [resumePdfPath, setResumePdfPath] = useState<string | null>(initialResumePdfPath);
  // Cache-bust key so the iframe reloads after a new upload
  const [pdfVersion, setPdfVersion] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [inputMode, setInputMode] = useState<'pdf' | 'paste'>('pdf');
  const [draftText, setDraftText] = useState('');
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasResume = !!resumeText && resumeText.length > 0;
  const hasPdf = !!resumePdfPath;
  const isLong = hasResume && resumeText.length > PREVIEW_CHAR_LIMIT;

  const handleStartEditing = () => {
    setDraftText(resumeText || '');
    setDraftFile(null);
    setInputMode('pdf');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraftText('');
    setDraftFile(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    // If we have a PDF file, upload it via the new endpoint
    if (draftFile) {
      setIsSaving(true);
      try {
        const formData = new FormData();
        formData.append('file', draftFile);

        const res = await fetch('/api/profile/resume-upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload resume');

        setResumeText(data.data.text);
        setResumePdfPath(data.data.resumePdfPath);
        setPdfVersion((v) => v + 1);
        setIsEditing(false);
        setDraftText('');
        setDraftFile(null);
        toast.success('Resume saved successfully');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save resume');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Text-only save (paste mode)
    if (draftText.length < 50) {
      toast.error('Resume must be at least 50 characters');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: draftText }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save resume');
      }

      setResumeText(draftText);
      setIsEditing(false);
      setDraftText('');
      toast.success('Resume saved successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save resume');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePdfExtracted = (text: string) => {
    if (text) {
      setDraftText(text);
      setInputMode('paste');
    }
  };

  const handleFileSelected = (file: File | null) => {
    setDraftFile(file);
  };

  // Edit mode
  if (isEditing) {
    return (
      <MagicCard className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)]">
        <Card className="border-0 bg-transparent">
          <CardHeader>
            <CardTitle>{hasResume ? 'Update Resume' : 'Add Resume'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Input mode toggle */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={inputMode === 'pdf' ? 'primary' : 'ghost'}
                  onClick={() => setInputMode('pdf')}
                >
                  Upload PDF
                </Button>
                <Button
                  size="sm"
                  variant={inputMode === 'paste' ? 'primary' : 'ghost'}
                  onClick={() => setInputMode('paste')}
                >
                  Paste Text
                </Button>
              </div>

              {/* Input area */}
              {inputMode === 'pdf' ? (
                <PdfUpload
                  onTextExtracted={handlePdfExtracted}
                  onFileSelected={handleFileSelected}
                />
              ) : (
                <Textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder="Paste your resume text here..."
                  rows={8}
                  maxLength={100000}
                  showCount
                />
              )}

              {/* Extracted text preview after PDF upload */}
              {inputMode === 'pdf' && draftText && (
                <div className="rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success-muted)] p-3">
                  <p className="text-xs font-medium text-[var(--color-success)]">
                    Text extracted ({draftText.length.toLocaleString()} characters)
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-3">
                    {draftText.slice(0, 200)}...
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3">
                <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || (!draftFile && draftText.length < 50)}
                  loading={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Resume'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </MagicCard>
    );
  }

  // View mode
  return (
    <MagicCard className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)]">
      <Card className="border-0 bg-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Resume</CardTitle>
            <Badge variant={hasResume ? 'success' : 'default'}>
              {hasResume ? 'Saved' : 'Not uploaded'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {hasPdf ? (
            // PDF preview mode — proxy through our own API to avoid CORS issues
            <div className="space-y-3">
              <iframe
                src={`/api/profile/resume-pdf?v=${pdfVersion}`}
                className="w-full rounded-lg border border-[var(--border-default)] bg-white"
                style={{ height: '500px' }}
                title="Resume PDF preview"
              />
              <LiquidButton variant="gradient" size="sm" onClick={handleStartEditing}>
                Update Resume
              </LiquidButton>
            </div>
          ) : hasResume ? (
            // Text-only mode (legacy users or paste-only)
            <div className="space-y-3">
              <TextFallback
                resumeText={resumeText}
                isExpanded={isExpanded}
                isLong={isLong}
                onToggleExpand={() => setIsExpanded(!isExpanded)}
              />
              <p className="text-xs text-[var(--text-muted)]">
                {resumeText.length.toLocaleString()} characters
              </p>
              <LiquidButton variant="gradient" size="sm" onClick={handleStartEditing}>
                Update Resume
              </LiquidButton>
            </div>
          ) : (
            // No resume at all
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-secondary)]">
                Upload your resume to use it across all your interview analyses.
              </p>
              <LiquidButton variant="gradient" size="sm" onClick={handleStartEditing}>
                Add Resume
              </LiquidButton>
            </div>
          )}
        </CardContent>
      </Card>
    </MagicCard>
  );
}

function TextFallback({
  resumeText,
  isExpanded,
  isLong,
  onToggleExpand,
}: {
  resumeText: string | null;
  isExpanded: boolean;
  isLong: boolean;
  onToggleExpand: () => void;
}) {
  if (!resumeText) return null;

  return (
    <div className="rounded-lg bg-[var(--bg-elevated)] p-3">
      <p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--text-secondary)]">
        {isExpanded ? resumeText : resumeText.slice(0, PREVIEW_CHAR_LIMIT)}
        {isLong && !isExpanded && '...'}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={onToggleExpand}
          className="mt-2 text-xs font-medium text-[var(--accent-primary)] hover:underline"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
