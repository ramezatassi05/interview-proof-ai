'use client';

import { useCallback, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { PromptInputBox } from '@/components/ui/ai-prompt-box';
import { useTabsContext } from '@/components/ui/Tabs';

type TabId = 'dashboard' | 'inbox' | 'ideas' | 'audit';

interface NavTarget {
  tab: TabId;
  label: string;
  highlight: { kind: 'action' | 'task'; id: string } | null;
}

interface ChatState {
  question: string;
  answer: string;
  isStreaming: boolean;
  navigation: NavTarget | null;
  error: string | null;
}

const NAVIGATE_RE = /<navigate>([\s\S]*?)<\/navigate>/i;

function parseNavigateTag(raw: string): { cleaned: string; nav: NavTarget | null } {
  const match = raw.match(NAVIGATE_RE);
  if (!match) return { cleaned: raw, nav: null };
  const cleaned = raw.replace(NAVIGATE_RE, '').trim();
  try {
    const parsed = JSON.parse(match[1]) as Partial<NavTarget>;
    if (!parsed.tab || !parsed.label) return { cleaned, nav: null };
    if (!['dashboard', 'inbox', 'ideas', 'audit'].includes(parsed.tab)) {
      return { cleaned, nav: null };
    }
    return {
      cleaned,
      nav: {
        tab: parsed.tab as TabId,
        label: String(parsed.label).slice(0, 36),
        highlight: parsed.highlight ?? null,
      },
    };
  } catch {
    return { cleaned, nav: null };
  }
}

const INITIAL_STATE: ChatState = {
  question: '',
  answer: '',
  isStreaming: false,
  navigation: null,
  error: null,
};

export function CeoChatWidget() {
  const { setActiveTab } = useTabsContext();
  const [state, setState] = useState<ChatState>(INITIAL_STATE);

  const send = useCallback(async (raw: string) => {
    const message = raw.trim();
    if (!message) return;
    setState({
      question: message,
      answer: '',
      isStreaming: true,
      navigation: null,
      error: null,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    try {
      const res = await fetch('/api/ceo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '');
        setState((s) => ({
          ...s,
          isStreaming: false,
          error: errText || `Request failed (${res.status})`,
        }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      let trimmedHeartbeat = false;

      let done = false;
      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;
        if (done) break;
        const value = chunk.value;
        acc += decoder.decode(value, { stream: true });
        if (!trimmedHeartbeat) {
          acc = acc.replace(/^\s+/, '');
          if (acc.length > 0) trimmedHeartbeat = true;
        }
        const visible = acc.replace(NAVIGATE_RE, '');
        setState((s) => ({ ...s, answer: visible }));
      }

      const { cleaned, nav } = parseNavigateTag(acc);
      setState((s) => ({
        ...s,
        answer: cleaned,
        isStreaming: false,
        navigation: nav,
      }));
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      setState((s) => ({
        ...s,
        isStreaming: false,
        error: aborted
          ? 'Concierge timed out — try again.'
          : err instanceof Error
            ? err.message
            : 'Network error',
      }));
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  const handleNavigate = useCallback(() => {
    if (!state.navigation) return;
    setActiveTab(state.navigation.tab);
    if (state.navigation.highlight) {
      window.dispatchEvent(
        new CustomEvent('cc:highlight', { detail: state.navigation.highlight }),
      );
    }
  }, [setActiveTab, state.navigation]);

  const hasAnswer = state.answer.length > 0 || state.isStreaming || state.error;

  return (
    <div className="flex w-full flex-col gap-3">
      {hasAnswer && (
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
            <Sparkles className="h-3 w-3" />
            <span>{state.isStreaming ? 'thinking…' : 'concierge'}</span>
          </div>
          {state.question && (
            <p className="mt-2 text-[12px] italic text-[var(--text-muted)]">
              you asked: {state.question}
            </p>
          )}
          {state.error ? (
            <p className="mt-2 text-[14px] leading-relaxed text-red-500">{state.error}</p>
          ) : (
            <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--text-primary)]">
              {state.answer || <span className="text-[var(--text-muted)]">…</span>}
            </p>
          )}
          {state.navigation && !state.isStreaming && (
            <button
              type="button"
              onClick={handleNavigate}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 px-3 py-1.5 text-[12px] font-medium text-[var(--accent-primary)] transition hover:bg-[var(--accent-primary)]/15"
            >
              {state.navigation.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <PromptInputBox
        onSend={send}
        isLoading={state.isStreaming}
        placeholder="Ask about today, a task, or anything in the room…"
      />
    </div>
  );
}
