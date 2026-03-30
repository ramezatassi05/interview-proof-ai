'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PdfUpload } from '@/components/ui/PdfUpload';
import { Textarea } from '@/components/ui/Textarea';
import { MagicCard } from '@/components/ui/magic-card';

const PREVIEW_CHAR_LIMIT = 500;

interface ResumeSectionProps {
  initialResumeText: string | null;
}

export function ResumeSection({ initialResumeText }: ResumeSectionProps) {
  const [resumeText, setResumeText] = useState<string | null>(initialResumeText);
  const [isEditing, setIsEditing] = useState(false);
  const [inputMode, setInputMode] = useState<'pdf' | 'paste'>('pdf');
  const [draftText, setDraftText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasResume = !!resumeText && resumeText.length > 0;
  const isLong = hasResume && resumeText.length > PREVIEW_CHAR_LIMIT;

  const handleStartEditing = () => {
    setDraftText(resumeText || '');
    setInputMode('pdf');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraftText('');
    setIsEditing(false);
  };

  const handleSave = async () => {
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
                <PdfUpload onTextExtracted={handlePdfExtracted} />
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
                  disabled={isSaving || draftText.length < 50}
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
          {hasResume ? (
            <div className="space-y-3">
              {/* Resume preview */}
              <div className="rounded-lg bg-[var(--bg-elevated)] p-3">
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--text-secondary)]">
                  {isExpanded ? resumeText : resumeText.slice(0, PREVIEW_CHAR_LIMIT)}
                  {isLong && !isExpanded && '...'}
                </p>
                {isLong && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-2 text-xs font-medium text-[var(--accent-primary)] hover:underline"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                {resumeText.length.toLocaleString()} characters
              </p>
              <Button variant="primary" size="sm" rounded onClick={handleStartEditing}>
                Update Resume
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-secondary)]">
                Upload your resume to use it across all your interview analyses.
              </p>
              <Button size="sm" onClick={handleStartEditing}>
                Add Resume
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </MagicCard>
  );
}
