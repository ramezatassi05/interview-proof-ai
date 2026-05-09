import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { isAdminUser } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { publicCompanyAction } from '@/server/agents/company/types';
import type { CompanyAgentActionRow } from '@/server/agents/company/types';
import { relativeTime } from '@/lib/relative-time';
import { TriageTranscript } from './TriageTranscript';
import { IdeaActionsList } from './IdeaActionsList';

interface CeoIdeaRow {
  id: string;
  user_id: string;
  raw_text: string;
  source: 'cli' | 'chat';
  status: 'triaging' | 'routed' | 'completed' | 'failed';
  context_json: {
    cwd?: string;
    branch?: string;
    lastCommitSubject?: string;
    lastCommitSha?: string;
  } | null;
  triage_session_id: string | null;
  spawned_action_ids: string[] | null;
  error: string | null;
  created_at: string;
}

export default async function CeoIdeaDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');
  if (!isAdminUser(user)) redirect('/dashboard');

  const { data: ideaRow } = await supabase
    .from('ceo_ideas')
    .select(
      'id,user_id,raw_text,source,status,context_json,triage_session_id,spawned_action_ids,error,created_at'
    )
    .eq('id', id)
    .single();

  if (!ideaRow) notFound();
  const idea = ideaRow as CeoIdeaRow;

  // Linked actions (1–3 spawned by the orchestrator). Query by session_id so we
  // pick up any actions emitted during the triage turn even if the orchestrator
  // spawned them in tools that finished after we patched the parent row.
  let actions: ReturnType<typeof publicCompanyAction>[] = [];
  if (idea.triage_session_id) {
    const { data: actionRows } = await supabase
      .from('company_agent_actions')
      .select()
      .eq('session_id', idea.triage_session_id)
      .order('created_at', { ascending: true });
    actions = ((actionRows as CompanyAgentActionRow[] | null) ?? []).map(publicCompanyAction);
  }

  const ctx = idea.context_json ?? {};

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-1">
        <Link
          href="/admin/command-center/ideas"
          className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          ← All ideas
        </Link>
        <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span>{relativeTime(idea.created_at)}</span>
          <span>·</span>
          <span className="uppercase tracking-wide">via {idea.source}</span>
          <span>·</span>
          <span>status: {idea.status}</span>
        </div>
      </header>

      {/* Raw idea */}
      <section className="border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Your idea</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-primary)]">
          {idea.raw_text}
        </p>
        {(ctx.branch || ctx.lastCommitSubject) && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--text-muted)]">
            {ctx.branch && <span>branch: {ctx.branch}</span>}
            {ctx.lastCommitSubject && (
              <span>
                last commit: {ctx.lastCommitSubject}
                {ctx.lastCommitSha ? ` (${ctx.lastCommitSha.slice(0, 7)})` : ''}
              </span>
            )}
          </div>
        )}
      </section>

      {idea.error && (
        <div className="border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] px-3 py-2 text-xs text-[var(--color-danger)]">
          Triage failed: {idea.error}
        </div>
      )}

      {/* Live triage transcript */}
      {idea.triage_session_id && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Triage thought process
          </h2>
          <TriageTranscript
            sessionId={idea.triage_session_id}
            ideaId={idea.id}
            initialStatus={idea.status}
          />
        </section>
      )}

      {/* Spawned actions */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
          Routed to ({actions.length})
        </h2>
        <IdeaActionsList initialActions={actions} ideaId={idea.id} />
      </section>
    </div>
  );
}
