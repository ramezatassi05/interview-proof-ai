import type { CompanyAgentKind } from '@/server/agents/company/types';

export type ToolCallStatus = 'running' | 'succeeded' | 'failed' | 'awaiting_approval';

export interface ToolCallView {
  id: string;
  skillId: string;
  status: ToolCallStatus;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  linkedActionId?: string | null;
  latencyMs?: number;
}

export type ChatSegment = { kind: 'text'; text: string } | { kind: 'tool'; toolCallId: string };

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  segments?: ChatSegment[];
  toolCalls: ToolCallView[];
  attachmentIds?: string[];
  createdAtIso?: string;
  truncated?: boolean;
}

export interface AttachmentMeta {
  id: string;
  filename: string;
  kind: 'pdf' | 'image' | 'text' | 'file';
  byteSize: number;
  mimeType?: string;
}

export type StreamStatus = 'idle' | 'opening' | 'streaming' | 'error' | 'aborted';

export interface SkillCatalogEntry {
  id: string;
  agentKinds: CompanyAgentKind[];
  kind: 'read' | 'write';
  label: string;
  description: string;
  icon?: string;
}
