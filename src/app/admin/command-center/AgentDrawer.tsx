'use client';

import type { RefObject } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { agentMeta } from './agents';
import { SectionLabel } from './_primitives';
import type { AgentOption } from './agents';
import type { CompanyAgentKind } from '@/server/agents/company/types';

interface ProposedActionShape {
  id: string;
  title: string;
  rationale: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
}

interface AgentOutputShape {
  agentKind: CompanyAgentKind;
  summary: string;
  priorities: string[];
  proposedActions: ProposedActionShape[];
}

export function AgentDrawer({
  open,
  onOpenChange,
  activeAgent,
  message,
  onMessageChange,
  onSend,
  loading,
  error,
  onDismissError,
  output,
  composerRef,
  suggestedPrompts,
  onPickPrompt,
  renderProposedAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeAgent: AgentOption;
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  loading: boolean;
  error: string | null;
  onDismissError: () => void;
  output: AgentOutputShape | null;
  composerRef: RefObject<HTMLTextAreaElement | null>;
  suggestedPrompts: string[];
  onPickPrompt: (prompt: string) => void;
  renderProposedAction: (action: ProposedActionShape) => React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">{activeAgent.label}</Badge>
            <Badge variant="default">Draft-only</Badge>
            <span className="ml-auto text-[11px] text-[var(--text-muted)]">
              {activeAgent.discipline}
            </span>
          </div>
          <DialogTitle className="mt-2">Talk to {activeAgent.label}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <p className="text-xs text-[var(--text-muted)]">
            Output is advisory. External, customer-visible, financial, or production-changing work
            requires your explicit approval in the right rail.
          </p>

          {suggestedPrompts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {suggestedPrompts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onPickPrompt(q)}
                  className="border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-left text-[11px] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <textarea
            ref={composerRef}
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            rows={6}
            className="min-h-[140px] w-full resize-y border border-[var(--border-default)] bg-[var(--bg-primary)] p-3 text-sm leading-relaxed text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--border-accent)]"
            placeholder={activeAgent.placeholder}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-[11px] tabular-nums text-[var(--text-muted)]">
              <span>{message.length} chars</span>
              <span aria-hidden>·</span>
              <span>
                <kbd className="border border-[var(--border-default)] bg-[var(--bg-primary)] px-1 py-0.5 font-mono text-[10px]">
                  ⌘↵
                </kbd>{' '}
                to send
              </span>
            </div>
            <Button
              variant="primary"
              size="sm"
              loading={loading}
              disabled={!message.trim()}
              onClick={onSend}
            >
              {loading ? 'Working' : 'Send to agent'}
            </Button>
          </div>

          {error && (
            <div className="flex items-start justify-between gap-3 border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] px-3 py-2">
              <p className="text-xs text-[var(--color-danger)]">{error}</p>
              <button
                type="button"
                onClick={onDismissError}
                className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-danger)] hover:opacity-80"
              >
                Dismiss
              </button>
            </div>
          )}

          {(output || loading) && (
            <div className="border-t border-[var(--border-default)] pt-4">
              <div className="flex items-center justify-between gap-2">
                <SectionLabel>Latest output</SectionLabel>
                {output && <Badge variant="accent">{agentMeta(output.agentKind).label}</Badge>}
              </div>

              {!output && loading && (
                <div className="mt-4 flex flex-col items-center justify-center gap-2 py-6">
                  <p className="text-sm text-[var(--text-secondary)]">Drafting response…</p>
                </div>
              )}

              {output && (
                <div className="mt-3 flex flex-col gap-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">
                    {output.summary}
                  </p>

                  {output.priorities.length > 0 && (
                    <div className="border-t border-[var(--border-default)] pt-3">
                      <SectionLabel>Priorities</SectionLabel>
                      <ol className="mt-2 flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
                        {output.priorities.map((priority, idx) => (
                          <li
                            key={`${idx}-${priority.slice(0, 24)}`}
                            className="flex items-start gap-3 border-l-2 border-[var(--accent-primary)] pl-3"
                          >
                            <span className="font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span>{priority}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {output.proposedActions.length > 0 && (
                    <div className="border-t border-[var(--border-default)] pt-3">
                      <div className="flex items-center justify-between">
                        <SectionLabel>Proposed actions</SectionLabel>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {output.proposedActions.length} drafted
                        </span>
                      </div>
                      <div className="mt-2 flex flex-col gap-2">
                        {output.proposedActions.map((action) => renderProposedAction(action))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
