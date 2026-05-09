import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminUser } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { relativeTime } from '@/lib/relative-time';

interface CeoIdeaRow {
  id: string;
  raw_text: string;
  source: 'cli' | 'chat';
  status: 'triaging' | 'routed' | 'completed' | 'failed';
  triage_session_id: string | null;
  spawned_action_ids: string[] | null;
  error: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<CeoIdeaRow['status'], string> = {
  triaging: 'Triaging',
  routed: 'Routed',
  completed: 'Completed',
  failed: 'Failed',
};

export default async function CeoIdeasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');
  if (!isAdminUser(user)) redirect('/dashboard');

  const { data, error } = await supabase
    .from('ceo_ideas')
    .select('id,raw_text,source,status,triage_session_id,spawned_action_ids,error,created_at')
    .order('created_at', { ascending: false })
    .limit(80);

  if (error) {
    console.error('[ideas/page] load failed:', error);
  }

  const ideas = (data ?? []) as CeoIdeaRow[];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-8">
      <header className="flex flex-col gap-1">
        <Link
          href="/admin/command-center"
          className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          ← Back to Command Center
        </Link>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Ideas from Claude Code
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Every idea you typed via{' '}
          <code className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-xs">/idea</code> in
          your CLI lands here. The CEO orchestrator triages each one and routes it to the right
          specialist. Autonomous agent flows continue alongside this — these are an additional input
          channel, not a replacement.
        </p>
      </header>

      {ideas.length === 0 ? (
        <div className="border border-dashed border-[var(--border-default)] bg-[var(--bg-card)] px-6 py-16 text-center text-sm text-[var(--text-secondary)]">
          No ideas relayed yet. Try{' '}
          <code className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-xs">
            /idea &lt;your thought&gt;
          </code>{' '}
          in this Claude Code session.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {ideas.map((idea) => {
            const spawned = idea.spawned_action_ids?.length ?? 0;
            return (
              <li key={idea.id}>
                <Link
                  href={`/admin/command-center/ideas/${idea.id}`}
                  className="block border border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-3 transition-colors hover:bg-[var(--bg-elevated)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-2 text-sm text-[var(--text-primary)]">
                        {idea.raw_text}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                        <span>{relativeTime(idea.created_at)}</span>
                        <span>·</span>
                        <span className="uppercase tracking-wide">{idea.source}</span>
                        {spawned > 0 && (
                          <>
                            <span>·</span>
                            <span>
                              {spawned} {spawned === 1 ? 'action' : 'actions'} drafted
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <StatusPill status={idea.status} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: CeoIdeaRow['status'] }) {
  const tone =
    status === 'failed'
      ? 'border-[var(--color-danger)]/40 bg-[var(--color-danger-muted)] text-[var(--color-danger)]'
      : status === 'triaging'
        ? 'border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
        : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]';
  return (
    <span
      className={`shrink-0 border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${tone}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
