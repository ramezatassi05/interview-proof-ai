'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { CompanyAgentKind } from '@/server/agents/company/types';
import type {
  AttachmentMeta,
  ChatMessage,
  ChatSegment,
  StreamStatus,
  ToolCallStatus,
  ToolCallView,
} from './types';

interface InFlightAssistant {
  id: string;
  segments: ChatSegment[];
  toolCalls: Map<string, ToolCallView>;
  text: string;
}

interface State {
  messages: ChatMessage[];
  inFlight: InFlightAssistant | null;
  status: StreamStatus;
  error: string | null;
  sessionId: string | null;
  activeSkillId: string | null;
  memoryBumps: number;
}

type Action =
  | { type: 'reset'; sessionId: string | null; messages: ChatMessage[] }
  | { type: 'set_session'; sessionId: string }
  | { type: 'append_user'; message: ChatMessage }
  | { type: 'open_assistant' }
  | { type: 'text_delta'; delta: string }
  | {
      type: 'tool_start';
      toolCallId: string;
      skillId: string;
      input?: Record<string, unknown>;
    }
  | {
      type: 'tool_complete';
      toolCallId: string;
      skillId: string;
      status: ToolCallStatus;
      output?: Record<string, unknown>;
      error?: string;
      linkedActionId?: string | null;
      latencyMs?: number;
    }
  | { type: 'memory_bump' }
  | { type: 'done'; messageId: string; truncated: boolean }
  | { type: 'error'; message: string }
  | { type: 'aborted' }
  | { type: 'clear_active_skill' };

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2, 11)}`;
}

function appendTextSegment(segments: ChatSegment[], delta: string): ChatSegment[] {
  if (segments.length === 0 || segments[segments.length - 1].kind !== 'text') {
    return [...segments, { kind: 'text', text: delta }];
  }
  const last = segments[segments.length - 1];
  if (last.kind !== 'text') return segments;
  return [...segments.slice(0, -1), { kind: 'text', text: last.text + delta }];
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'reset':
      return {
        messages: action.messages,
        inFlight: null,
        status: 'idle',
        error: null,
        sessionId: action.sessionId,
        activeSkillId: null,
        memoryBumps: 0,
      };
    case 'set_session':
      return { ...state, sessionId: action.sessionId };
    case 'append_user':
      return { ...state, messages: [...state.messages, action.message], error: null };
    case 'open_assistant':
      return {
        ...state,
        inFlight: { id: makeId(), segments: [], toolCalls: new Map(), text: '' },
        status: 'streaming',
        error: null,
      };
    case 'text_delta': {
      if (!state.inFlight) return state;
      return {
        ...state,
        inFlight: {
          ...state.inFlight,
          segments: appendTextSegment(state.inFlight.segments, action.delta),
          text: state.inFlight.text + action.delta,
        },
      };
    }
    case 'tool_start': {
      if (!state.inFlight) return state;
      const nextCalls = new Map(state.inFlight.toolCalls);
      nextCalls.set(action.toolCallId, {
        id: action.toolCallId,
        skillId: action.skillId,
        status: 'running',
        input: action.input,
      });
      return {
        ...state,
        activeSkillId: action.skillId,
        inFlight: {
          ...state.inFlight,
          toolCalls: nextCalls,
          segments: [...state.inFlight.segments, { kind: 'tool', toolCallId: action.toolCallId }],
        },
      };
    }
    case 'tool_complete': {
      if (!state.inFlight) return state;
      const nextCalls = new Map(state.inFlight.toolCalls);
      const prev = nextCalls.get(action.toolCallId);
      nextCalls.set(action.toolCallId, {
        id: action.toolCallId,
        skillId: action.skillId,
        status: action.status,
        input: prev?.input,
        output: action.output,
        error: action.error,
        linkedActionId: action.linkedActionId ?? null,
        latencyMs: action.latencyMs,
      });
      return {
        ...state,
        inFlight: { ...state.inFlight, toolCalls: nextCalls },
      };
    }
    case 'memory_bump':
      return { ...state, memoryBumps: state.memoryBumps + 1 };
    case 'clear_active_skill':
      return { ...state, activeSkillId: null };
    case 'done': {
      if (!state.inFlight) return { ...state, status: 'idle' };
      const finalized: ChatMessage = {
        id: action.messageId,
        role: 'assistant',
        text: state.inFlight.text,
        segments: state.inFlight.segments,
        toolCalls: Array.from(state.inFlight.toolCalls.values()),
        truncated: action.truncated,
      };
      return {
        ...state,
        messages: [...state.messages, finalized],
        inFlight: null,
        status: 'idle',
        activeSkillId: null,
      };
    }
    case 'error': {
      if (state.inFlight) {
        const partial: ChatMessage = {
          id: state.inFlight.id,
          role: 'assistant',
          text: state.inFlight.text,
          segments: state.inFlight.segments,
          toolCalls: Array.from(state.inFlight.toolCalls.values()),
          truncated: true,
        };
        return {
          ...state,
          messages:
            state.inFlight.text || state.inFlight.toolCalls.size > 0
              ? [...state.messages, partial]
              : state.messages,
          inFlight: null,
          status: 'error',
          error: action.message,
          activeSkillId: null,
        };
      }
      return { ...state, status: 'error', error: action.message };
    }
    case 'aborted': {
      if (!state.inFlight) return { ...state, status: 'aborted' };
      const partial: ChatMessage = {
        id: state.inFlight.id,
        role: 'assistant',
        text: state.inFlight.text,
        segments: state.inFlight.segments,
        toolCalls: Array.from(state.inFlight.toolCalls.values()),
        truncated: true,
      };
      return {
        ...state,
        messages:
          state.inFlight.text || state.inFlight.toolCalls.size > 0
            ? [...state.messages, partial]
            : state.messages,
        inFlight: null,
        status: 'aborted',
        activeSkillId: null,
      };
    }
    default:
      return state;
  }
}

const initialState: State = {
  messages: [],
  inFlight: null,
  status: 'idle',
  error: null,
  sessionId: null,
  activeSkillId: null,
  memoryBumps: 0,
};

interface ParsedSseEvent {
  event: string;
  data: string;
}

function parseSseChunk(buffer: string): { events: ParsedSseEvent[]; remainder: string } {
  const events: ParsedSseEvent[] = [];
  let rest = buffer;
  while (true) {
    const sep = rest.indexOf('\n\n');
    if (sep === -1) break;
    const block = rest.slice(0, sep);
    rest = rest.slice(sep + 2);
    let eventName = 'message';
    const dataLines: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }
    if (dataLines.length > 0) {
      events.push({ event: eventName, data: dataLines.join('\n') });
    }
  }
  return { events, remainder: rest };
}

interface SendArgs {
  text: string;
  attachmentIds?: string[];
}

interface UseAgentStreamArgs {
  agentKind: CompanyAgentKind;
  initialSessionId?: string | null;
  onAttachmentsHydrated?: (atts: AttachmentMeta[]) => void;
}

interface HistoryAttachment {
  id: string;
  filename: string;
  kind: 'pdf' | 'image' | 'text' | 'file';
  byteSize: number;
  mimeType?: string;
}

interface HistoryToolCall {
  id: string;
  skillId: string;
  status: ToolCallStatus;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  linkedActionId?: string | null;
  latencyMs?: number;
}

interface HistoryMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  toolCalls: HistoryToolCall[];
  attachments?: HistoryAttachment[];
  createdAtIso?: string;
  truncated?: boolean;
}

function hydrateMessages(rows: HistoryMessage[]): {
  messages: ChatMessage[];
  attachments: AttachmentMeta[];
} {
  const messages: ChatMessage[] = [];
  const attachments: AttachmentMeta[] = [];
  for (const row of rows) {
    const toolCallViews: ToolCallView[] = row.toolCalls.map((tc) => ({
      id: tc.id,
      skillId: tc.skillId,
      status: tc.status,
      input: tc.input,
      output: tc.output,
      error: tc.error,
      linkedActionId: tc.linkedActionId ?? null,
      latencyMs: tc.latencyMs,
    }));
    // Build segments: tool cards first, then prose. The live stream typically
    // fires tool_use blocks before post-tool text, and we don't persist
    // intra-message ordering, so this matches the common shape.
    const segments: ChatSegment[] = [];
    for (const tc of toolCallViews) {
      segments.push({ kind: 'tool', toolCallId: tc.id });
    }
    if (row.text) segments.push({ kind: 'text', text: row.text });
    const atts = row.attachments ?? [];
    if (atts.length > 0) {
      for (const a of atts) {
        attachments.push({
          id: a.id,
          filename: a.filename,
          kind: a.kind,
          byteSize: a.byteSize,
          mimeType: a.mimeType,
        });
      }
    }
    messages.push({
      id: row.id,
      role: row.role,
      text: row.text,
      segments,
      toolCalls: toolCallViews,
      attachmentIds: atts.map((a) => a.id),
      createdAtIso: row.createdAtIso,
      truncated: row.truncated,
    });
  }
  return { messages, attachments };
}

export function useAgentStream({
  agentKind,
  initialSessionId,
  onAttachmentsHydrated,
}: UseAgentStreamArgs) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef<AbortController | null>(null);
  const hydratedSessionRef = useRef<string | null>(null);
  // Auto-clear the SkillsPanel pulse 1.5s after the latest activation.
  const skillPulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skillPulse = useCallback(() => {
    if (skillPulseTimerRef.current) clearTimeout(skillPulseTimerRef.current);
    skillPulseTimerRef.current = setTimeout(() => dispatch({ type: 'clear_active_skill' }), 1500);
  }, []);

  // One-shot hydration when an existing sessionId is provided (drawer reopened
  // on a prior conversation). Skips for fresh sessions.
  useEffect(() => {
    if (!initialSessionId) return;
    if (hydratedSessionRef.current === initialSessionId) return;
    hydratedSessionRef.current = initialSessionId;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/admin/company-agent/sessions/${encodeURIComponent(initialSessionId)}/messages`
        );
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as { messages?: HistoryMessage[] };
        const rows = json.messages ?? [];
        const { messages, attachments } = hydrateMessages(rows);
        if (cancelled) return;
        dispatch({ type: 'reset', sessionId: initialSessionId, messages });
        if (attachments.length > 0) onAttachmentsHydrated?.(attachments);
      } catch (err) {
        if (!cancelled) {
          console.error('[useAgentStream] hydrate error:', err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialSessionId, onAttachmentsHydrated]);

  const send = useCallback(
    async ({ text, attachmentIds }: SendArgs) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (state.status === 'streaming' || state.status === 'opening') return;

      dispatch({
        type: 'append_user',
        message: {
          id: makeId(),
          role: 'user',
          text: trimmed,
          toolCalls: [],
          attachmentIds: attachmentIds ?? [],
        },
      });
      dispatch({ type: 'open_assistant' });

      const controller = new AbortController();
      abortRef.current = controller;

      let res: Response;
      try {
        res = await fetch('/api/admin/company-agent/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            sessionId: state.sessionId ?? undefined,
            agentKind,
            attachmentIds,
          }),
          signal: controller.signal,
        });
      } catch (err) {
        if (controller.signal.aborted) {
          dispatch({ type: 'aborted' });
        } else {
          dispatch({
            type: 'error',
            message: err instanceof Error ? err.message : 'Network error',
          });
        }
        return;
      }

      if (!res.ok || !res.body) {
        let message = `Request failed (${res.status})`;
        try {
          const json = (await res.json()) as { error?: string };
          if (json.error) message = json.error;
        } catch {
          // not JSON, keep generic
        }
        dispatch({ type: 'error', message });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parsed = parseSseChunk(buffer);
          buffer = parsed.remainder;
          for (const evt of parsed.events) {
            handleEvent(evt);
          }
        }
        // flush any trailing event
        if (buffer.trim().length > 0) {
          const parsed = parseSseChunk(buffer + '\n\n');
          for (const evt of parsed.events) handleEvent(evt);
        }
      } catch (err) {
        if (controller.signal.aborted) {
          dispatch({ type: 'aborted' });
        } else {
          dispatch({
            type: 'error',
            message: err instanceof Error ? err.message : 'Stream error',
          });
        }
      } finally {
        abortRef.current = null;
      }

      function handleEvent(evt: ParsedSseEvent) {
        let payload: unknown;
        try {
          payload = JSON.parse(evt.data);
        } catch {
          return;
        }
        const obj = (payload ?? {}) as Record<string, unknown>;
        switch (evt.event) {
          case 'session': {
            const sessionId = typeof obj.sessionId === 'string' ? obj.sessionId : null;
            if (sessionId) dispatch({ type: 'set_session', sessionId });
            break;
          }
          case 'text_delta': {
            const delta = typeof obj.delta === 'string' ? obj.delta : '';
            if (delta) dispatch({ type: 'text_delta', delta });
            break;
          }
          case 'tool_call_start': {
            const id = typeof obj.id === 'string' ? obj.id : null;
            const skillId = typeof obj.skillId === 'string' ? obj.skillId : null;
            if (id && skillId) {
              dispatch({
                type: 'tool_start',
                toolCallId: id,
                skillId,
                input:
                  obj.input && typeof obj.input === 'object'
                    ? (obj.input as Record<string, unknown>)
                    : undefined,
              });
              skillPulse();
            }
            break;
          }
          case 'tool_call_complete': {
            const id = typeof obj.id === 'string' ? obj.id : null;
            const skillId = typeof obj.skillId === 'string' ? obj.skillId : '';
            const status =
              typeof obj.status === 'string' ? (obj.status as ToolCallStatus) : 'failed';
            if (!id) break;
            dispatch({
              type: 'tool_complete',
              toolCallId: id,
              skillId,
              status,
              output:
                obj.output && typeof obj.output === 'object'
                  ? (obj.output as Record<string, unknown>)
                  : undefined,
              error: typeof obj.error === 'string' ? obj.error : undefined,
              linkedActionId: typeof obj.linkedActionId === 'string' ? obj.linkedActionId : null,
              latencyMs: typeof obj.latencyMs === 'number' ? obj.latencyMs : undefined,
            });
            break;
          }
          case 'memory_updated':
            dispatch({ type: 'memory_bump' });
            break;
          case 'done': {
            const messageId = typeof obj.messageId === 'string' ? obj.messageId : makeId();
            const truncated = Boolean(obj.truncated);
            dispatch({ type: 'done', messageId, truncated });
            break;
          }
          case 'error': {
            const message = typeof obj.message === 'string' ? obj.message : 'Agent error';
            dispatch({ type: 'error', message });
            break;
          }
          case 'usage':
            // currently unused in UI; could surface in IdentityStrip later
            break;
          default:
            break;
        }
      }
    },
    [agentKind, skillPulse, state.status, state.sessionId]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback((args?: { sessionId?: string | null; messages?: ChatMessage[] }) => {
    abortRef.current?.abort();
    dispatch({
      type: 'reset',
      sessionId: args?.sessionId ?? null,
      messages: args?.messages ?? [],
    });
  }, []);

  return {
    messages: state.messages,
    inFlight: state.inFlight,
    status: state.status,
    error: state.error,
    sessionId: state.sessionId,
    activeSkillId: state.activeSkillId,
    memoryBumps: state.memoryBumps,
    send,
    abort,
    reset,
  };
}
