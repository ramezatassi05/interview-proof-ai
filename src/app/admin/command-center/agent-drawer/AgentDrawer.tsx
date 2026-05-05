'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CompanyAgentKind } from '@/server/agents/company/types';
import { agentMeta, AGENT_OPTIONS } from '../agents';
import { IdentityStrip } from './IdentityStrip';
import { SkillsPanel } from './SkillsPanel';
import { MessageList } from './MessageList';
import { AttachmentTray } from './AttachmentTray';
import { Composer } from './Composer';
import { useAgentStream } from './useAgentStream';
import type { AttachmentMeta } from './types';

interface AgentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentKind: CompanyAgentKind;
  suggestedPrompts?: string[];
  onActionsCreated?: () => void;
}

export function AgentDrawer({
  open,
  onOpenChange,
  agentKind,
  suggestedPrompts,
  onActionsCreated,
}: AgentDrawerProps) {
  const meta = agentMeta(agentKind);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid h-[90vh] max-h-[90vh] w-[min(96vw,1080px)] max-w-none grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Talk to {meta.label}</DialogTitle>
        </DialogHeader>
        {open && (
          <AgentChatContent
            key={agentKind}
            agentKind={agentKind}
            suggestedPrompts={suggestedPrompts}
            onActionsCreated={onActionsCreated}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AgentChatContent({
  agentKind,
  suggestedPrompts,
  onActionsCreated,
  onClose,
}: {
  agentKind: CompanyAgentKind;
  suggestedPrompts?: string[];
  onActionsCreated?: () => void;
  onClose: () => void;
}) {
  const meta = agentMeta(agentKind);
  const [draft, setDraft] = useState('');
  const [attachments] = useState<AttachmentMeta[]>([]);

  const stream = useAgentStream({ agentKind });
  const { messages, inFlight, status, error, send, abort, activeSkillId, memoryBumps } = stream;

  const busy = status === 'streaming' || status === 'opening';

  // Notify parent when actions get linked to the latest assistant turn.
  useEffect(() => {
    if (status !== 'idle') return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant') return;
    if (last.toolCalls.some((c) => c.linkedActionId)) {
      onActionsCreated?.();
    }
  }, [status, messages, onActionsCreated]);

  // Cancel any in-flight stream when the content unmounts (drawer closed).
  useEffect(() => {
    return () => {
      abort();
    };
  }, [abort]);

  const promptsToShow = useMemo(() => {
    if (!suggestedPrompts || suggestedPrompts.length === 0) return [];
    return suggestedPrompts.slice(0, 4);
  }, [suggestedPrompts]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    void send({ text, attachmentIds: attachments.map((a) => a.id) });
  };

  // If the user closes the dialog mid-stream, the parent will set open=false and
  // the content unmounts. The cleanup effect above aborts the fetch.
  void onClose;

  return (
    <>
      <IdentityStrip agentKind={agentKind} memoryCount={memoryBumps} />

      <div className="grid min-h-0 grid-cols-[220px_minmax(0,1fr)] overflow-hidden">
        <div className="hidden md:block">
          <SkillsPanel agentKind={agentKind} activeSkillId={activeSkillId} />
        </div>

        <div className="flex min-h-0 flex-col">
          {promptsToShow.length > 0 && messages.length === 0 && !inFlight && (
            <div className="flex flex-wrap gap-1.5 border-b border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2">
              {promptsToShow.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setDraft(q)}
                  className="border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-left text-[11px] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <MessageList
            messages={messages}
            inFlight={inFlight}
            status={status}
            emptyHint={`Ask ${meta.label} anything. ${
              AGENT_OPTIONS.find((a) => a.value === agentKind)?.placeholder ?? ''
            }`}
          />

          {error && (
            <div className="border-t border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] px-4 py-2">
              <p className="text-xs text-[var(--color-danger)]">{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[var(--border-default)]">
        <AttachmentTray attachments={attachments} hint="Attachments arrive in M5." />
        <Composer
          value={draft}
          onChange={setDraft}
          onSend={handleSend}
          onAbort={abort}
          busy={busy}
          placeholder={meta.placeholder}
        />
      </div>
    </>
  );
}
