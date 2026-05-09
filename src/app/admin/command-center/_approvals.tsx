'use client';

import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { relativeTime } from '@/lib/relative-time';
import type { CompanyAgentKind } from '@/server/agents/company/types';
import { agentMeta } from './agents';
import { SoftLabel, PriorityBadge, StatusBadge } from './_primitives';
import { friendlyActionType } from './_action-copy';
import { Markdown } from './_markdown';

export interface EvidenceRef {
  label: string;
  source: string;
}

export interface CompanyAction {
  id: string;
  sessionId: string | null;
  agentKind: CompanyAgentKind;
  actionType: string;
  title: string;
  rationale: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'drafted' | 'awaiting_approval' | 'approved' | 'rejected' | 'completed' | 'failed';
  triggeredBy?: 'user' | 'cron' | 'agent' | 'ceo_cli' | 'ceo_chat';
  requiresApproval?: boolean;
  payloadJson?: Record<string, unknown> | null;
  resultJson?: Record<string, unknown> | null;
  evidenceRefsJson?: EvidenceRef[] | null;
  completedAt?: string | null;
  error?: string | null;
  createdAt: string;
}

export type TransitionStatus = 'approved' | 'rejected';

export function ApprovalRow({
  action,
  pending,
  onTransition,
  onRequestReject,
  onOpenDetail,
}: {
  action: CompanyAction;
  pending: boolean;
  onTransition: (id: string, status: TransitionStatus) => void;
  onRequestReject: (action: CompanyAction) => void;
  onOpenDetail: (action: CompanyAction) => void;
}) {
  const isAwaiting = action.status === 'awaiting_approval';
  const isAutoExecuted = action.requiresApproval === false;
  return (
    <div className="border border-[var(--border-default)]/70 bg-[var(--bg-card)] transition-colors hover:border-[var(--border-default)]">
      <button
        type="button"
        onClick={() => onOpenDetail(action)}
        className="block w-full px-4 py-3.5 text-left transition-colors hover:bg-[var(--bg-elevated)] focus:bg-[var(--bg-elevated)] focus:outline-none"
        aria-label={`See the full version of ${action.title}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={action.priority} />
          <span className="text-[11px] font-medium text-[var(--accent-primary)]">
            {agentMeta(action.agentKind).label}
          </span>
          {action.triggeredBy === 'cron' && <Badge variant="default">Acted on its own</Badge>}
          {isAutoExecuted && <Badge variant="success">Auto-executed</Badge>}
          {!isAwaiting && !isAutoExecuted && <StatusBadge status={action.status} />}
          <span className="ml-auto text-[11px] tabular-nums text-[var(--text-muted)]">
            {relativeTime(action.createdAt)}
          </span>
        </div>
        <h3
          className="mt-2 line-clamp-2 text-[15px] font-semibold leading-snug text-[var(--text-primary)]"
          title={action.title}
        >
          {action.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
          {action.rationale}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-[var(--accent-primary)]">
          See the whole thing
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </button>
      {isAwaiting && (
        <div className="grid grid-cols-2 gap-2 border-t border-[var(--border-default)] px-4 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => onRequestReject(action)}
            disabled={pending}
          >
            Reject
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            loading={pending}
            onClick={() => onTransition(action.id, 'approved')}
          >
            Approve
          </Button>
        </div>
      )}
    </div>
  );
}

const FRIENDLY_PAYLOAD_LABELS: Record<string, string> = {
  body: 'What I drafted',
  copy: 'What I drafted',
  text: 'What I drafted',
  message: 'What I drafted',
  title: 'Subject',
  channel: 'Where it goes',
  audience: "Who it's for",
  tone: 'Tone',
  goal: "What we're going for",
  angle: 'The angle',
  format: 'Format',
  description: 'What I drafted',
  decisionText: 'The decision',
  ownerKind: 'Who owns it',
  dueAt: 'Due',
  notes: 'Notes',
  summary: 'Summary',
};

function friendlyPayloadLabel(key: string): string {
  if (FRIENDLY_PAYLOAD_LABELS[key]) return FRIENDLY_PAYLOAD_LABELS[key];
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function PayloadField({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === '') return null;

  let body: ReactNode;
  if (typeof value === 'string') {
    body = <Markdown text={value} />;
  } else if (typeof value === 'number' || typeof value === 'boolean') {
    body = <p className="text-sm tabular-nums text-[var(--text-secondary)]">{String(value)}</p>;
  } else if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
    body = (
      <ul className="list-disc pl-5 text-sm leading-relaxed text-[var(--text-secondary)]">
        {(value as string[]).map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    );
  } else {
    body = (
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words border border-[var(--border-default)] bg-[var(--bg-primary)] p-2 text-[11px] leading-relaxed text-[var(--text-secondary)]">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <SoftLabel>{friendlyPayloadLabel(label)}</SoftLabel>
      {body}
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded border border-[var(--border-default)] bg-[var(--bg-primary)] p-3 text-xs leading-relaxed text-[var(--text-secondary)]">
      {children}
    </pre>
  );
}

function ResultLink({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline gap-2 text-xs text-[var(--text-secondary)]">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="font-mono text-[11px] text-[var(--text-primary)]">{String(value)}</span>
    </div>
  );
}

function ResultJsonPanel({
  actionType,
  result,
}: {
  actionType: string;
  result: Record<string, unknown>;
}) {
  const get = <T,>(key: string): T | undefined => result[key] as T | undefined;

  let body: ReactNode;
  switch (actionType) {
    case 'draft_brief': {
      const briefBody = get<string>('body');
      const weekStart = get<string>('weekStart');
      const briefId = get<string>('briefId');
      body = (
        <>
          {weekStart && <ResultLink label="Week of" value={weekStart} />}
          {briefId && <ResultLink label="Brief id" value={briefId} />}
          {briefBody && <Markdown text={briefBody} />}
        </>
      );
      break;
    }
    case 'draft_marketing_asset':
    case 'draft_engineering_spec': {
      const text = get<string>(actionType === 'draft_marketing_asset' ? 'copy' : 'spec');
      const taskId = get<string>('taskId');
      const ownerKind = get<string>('ownerKind');
      body = (
        <>
          {ownerKind && <ResultLink label="Owner" value={ownerKind} />}
          {taskId && <ResultLink label="Task id" value={taskId} />}
          {text && <Markdown text={text} />}
        </>
      );
      break;
    }
    case 'draft_finance_memo': {
      const memo = get<string>('memo');
      const decisionId = get<string>('decisionId');
      body = (
        <>
          {decisionId && <ResultLink label="Decision id" value={decisionId} />}
          {memo && <Markdown text={memo} />}
        </>
      );
      break;
    }
    case 'create_task': {
      const taskId = get<string>('taskId');
      const ownerKind = get<string>('ownerKind');
      body = (
        <p className="text-sm text-[var(--text-secondary)]">
          Created task <span className="font-mono text-xs">{taskId}</span>
          {ownerKind ? ` for ${ownerKind}.` : '.'}
        </p>
      );
      break;
    }
    case 'record_decision': {
      const decisionId = get<string>('decisionId');
      body = (
        <p className="text-sm text-[var(--text-secondary)]">
          Recorded decision <span className="font-mono text-xs">{decisionId}</span>.
        </p>
      );
      break;
    }
    case 'request_approval': {
      const note = get<string>('note');
      body = note ? (
        <p className="text-sm text-[var(--text-secondary)]">{note}</p>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">Approval recorded.</p>
      );
      break;
    }
    case 'summarize_metrics': {
      const summary = get<string>('summary');
      const metrics = get<unknown>('metrics');
      body = (
        <>
          {summary && <Markdown text={summary} />}
          {metrics !== undefined && <CodeBlock>{JSON.stringify(metrics, null, 2)}</CodeBlock>}
        </>
      );
      break;
    }
    case 'append_roadmap_row': {
      const domain = get<string>('domain');
      const filePath = get<string>('filePath');
      const rowId = get<string>('id');
      const line = get<string>('line');
      body = (
        <>
          {domain && <ResultLink label="Domain" value={domain} />}
          {rowId && <ResultLink label="Row id" value={rowId} />}
          {filePath && <ResultLink label="File" value={filePath} />}
          {line && <Markdown text={line} />}
        </>
      );
      break;
    }
    default:
      body = <CodeBlock>{JSON.stringify(result, null, 2)}</CodeBlock>;
  }

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--border-default)] pt-4">
      <SoftLabel>What I did after you approved</SoftLabel>
      <div className="flex flex-col gap-2">{body}</div>
    </div>
  );
}

export function ApprovalDetailModal({
  action,
  open,
  onOpenChange,
  pending,
  onTransition,
  onRequestReject,
}: {
  action: CompanyAction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onTransition: (id: string, status: TransitionStatus) => void;
  onRequestReject: (action: CompanyAction) => void;
}) {
  if (!action) return null;

  const payloadEntries = action.payloadJson
    ? Object.entries(action.payloadJson).filter(
        ([, v]) => v !== null && v !== undefined && v !== ''
      )
    : [];
  const evidence = action.evidenceRefsJson ?? [];
  const isAwaiting = action.status === 'awaiting_approval';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <PriorityBadge priority={action.priority} />
            <span className="text-[11px] font-medium text-[var(--accent-primary)]">
              {agentMeta(action.agentKind).label}
            </span>
            {action.triggeredBy === 'cron' && <Badge variant="default">Acted on its own</Badge>}
            {action.requiresApproval === false ? (
              <Badge variant="success">Auto-executed</Badge>
            ) : (
              <StatusBadge status={action.status} />
            )}
            <span className="ml-auto text-[10px] tabular-nums text-[var(--text-muted)]">
              {relativeTime(action.createdAt)}
            </span>
          </div>
          <p className="mt-3 text-[11px] text-[var(--text-muted)]">
            {agentMeta(action.agentKind).label} drafted {friendlyActionType(action.actionType)} for you.
          </p>
          <DialogTitle className="mt-1 break-words">{action.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <SoftLabel>Why I&apos;m proposing this</SoftLabel>
            <Markdown text={action.rationale} />
          </div>

          {payloadEntries.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-[var(--border-default)] pt-4">
              {payloadEntries.map(([key, value]) => (
                <PayloadField key={key} label={key} value={value} />
              ))}
            </div>
          )}

          {action.status === 'completed' && action.resultJson && (
            <ResultJsonPanel actionType={action.actionType} result={action.resultJson} />
          )}

          {action.status === 'rejected' &&
            typeof action.resultJson?.rejection_feedback === 'string' && (
              <div className="flex flex-col gap-2 border-t border-[var(--border-default)] pt-4">
                <SoftLabel>Feedback you gave the agent</SoftLabel>
                <Markdown text={action.resultJson.rejection_feedback as string} />
                <p className="text-[11px] text-[var(--text-muted)]">
                  The agent was asked to draft a new version that addresses this.
                </p>
              </div>
            )}

          {evidence.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-[var(--border-default)] pt-4">
              <SoftLabel>What I&apos;m working from</SoftLabel>
              <ul className="flex flex-col gap-1.5">
                {evidence.map((ref, idx) => (
                  <li
                    key={idx}
                    className="flex flex-wrap items-baseline gap-x-2 text-xs text-[var(--text-secondary)]"
                  >
                    <span className="font-semibold text-[var(--text-primary)]">{ref.label}</span>
                    <span className="text-[var(--text-muted)]">·</span>
                    <span className="break-all font-mono text-[11px] text-[var(--text-muted)]">
                      {ref.source}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {action.error && (
            <div className="border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] px-3 py-2">
              <SoftLabel>Something went wrong</SoftLabel>
              <p className="mt-1 text-xs text-[var(--color-danger)]">{action.error}</p>
            </div>
          )}
        </div>

        {isAwaiting && (
          <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex items-center justify-end gap-2 border-t border-[var(--border-default)] bg-[var(--bg-card)] px-6 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRequestReject(action)}
              disabled={pending}
            >
              Reject
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={pending}
              onClick={() => onTransition(action.id, 'approved')}
            >
              Approve
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
